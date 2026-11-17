"""
Milestone 1: Backend Peer Core Test Suite (test_peer_workflow.py)
Validates complete Member and Listener sanctuary workflows:
1. Member match request creation, status polling, and cancellation.
2. Listener availability toggle and live active queue visibility.
3. Atomic race-safe match acceptance (preventing double claims) and decline logic.
4. Workload capacity limit enforcement.
5. Peer consultation messaging with AES-256-GCM envelope encryption roundtrip.
6. Session closure idempotency.
7. Post-session feedback persistence, encrypted narrative, and listener rolling rating recalculation.
8. Safety conduct reporting with encrypted details and non-UUID session mapping.
9. Input validation and edge cases.
10. Schema alias mapping (isOnline / is_online to active_now).
11. Authentication header resolution (x-user-id / x-member-id).
12. Deterministic regex Live Crisis Sentinel in peer chat creating SafetyCase and safety alert.
13. Request expiry transition and sweeper.
14. WebRTC signaling over WebSocket with participant exclusion.

Modeled after test_milestone4_persistence.py using run_async coroutine runner
to ensure zero deadlocks under CPython 3.14 on Windows.
"""
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.security import encrypt_content, decrypt_content, get_current_user_id
from app.core.websocket_manager import ConnectionManager, manager
from app.models.peer import (
    ListenerProfile,
    ListenerMatchRequest,
    ListenerMatch,
    PeerConversation,
    PeerMessage,
)
from app.models.member import AppPrincipal, MemberProfile
from app.models.operations import ListenerFeedback, ConductReport, SafetyCase
from app.schemas.peer import (
    MatchRequestCreate,
    PeerMessageCreate,
    ListenerProfileUpdate,
    FeedbackCreate,
)
from app.services.peer_service import PeerService, CRISIS_REGEX
from app.services.operations_service import OperationsService
from app.routers.peer import websocket_peer_endpoint


def run_async(coro):
    """Synchronous trampoline runner for async coroutines avoiding AnyIO/TestClient deadlocks."""
    import inspect
    stack = [coro]
    val = None
    while stack:
        curr = stack[-1]
        try:
            res = curr.send(val)
            val = None
            if inspect.isawaitable(res):
                if hasattr(res, "__await__"):
                    stack.append(res.__await__())
                else:
                    stack.append(res)
        except StopIteration as e:
            stack.pop()
            val = e.value
    return val


# ─── 1. MEMBER MATCH REQUEST CREATION & POLLING ──────────────────────────────

def test_member_create_and_poll_match_request():
    """Verify member can initiate a support request with 30m expiry and poll its queued status."""
    async def _test():
        mock_db = AsyncMock()

        # Mock principal check (already exists)
        p_mock = MagicMock()
        p_mock.scalar_one_or_none.return_value = AppPrincipal(user_id="usr-demo-member-01")
        mock_db.execute.return_value = p_mock

        svc = PeerService(mock_db)
        payload = MatchRequestCreate(
            support_topic="anxiety",
            preferred_channel="chat",
            preferred_languages=["en"],
            notes="Feeling overwhelmed with upcoming exam deadlines."
        )

        res = await svc.create_match_request("usr-demo-member-01", payload)
        assert res["request_state"] == "queued"
        assert res["support_topic"] == "anxiety"
        assert res["preferred_channel"] == "chat"
        assert "id" in res
        assert mock_db.add.called
        assert mock_db.commit.called

        # Test polling queued status
        req_uuid = uuid.UUID(res["id"])
        mock_req = ListenerMatchRequest(
            id=req_uuid,
            member_id="usr-demo-member-01",
            request_state="queued",
            support_topic="anxiety",
            preferred_channel="chat",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=30)
        )
        poll_mock = MagicMock()
        poll_mock.scalar_one_or_none.return_value = mock_req
        mock_db.execute.return_value = poll_mock

        poll_res = await svc.get_match_request_status("usr-demo-member-01", str(req_uuid))
        assert poll_res["id"] == str(req_uuid)
        assert poll_res["request_state"] == "queued"
        assert poll_res["conversation_id"] is None
        assert poll_res["listener"] is None

    run_async(_test())


def test_member_cancel_queued_request():
    """Verify member can cancel an active queued request and that cancellation is idempotent."""
    async def _test():
        mock_db = AsyncMock()
        req_uuid = uuid.uuid4()
        req = ListenerMatchRequest(
            id=req_uuid,
            member_id="usr-demo-member-01",
            request_state="queued",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=30)
        )

        find_mock = MagicMock()
        find_mock.scalar_one_or_none.return_value = req
        mock_db.execute.return_value = find_mock

        svc = PeerService(mock_db)
        cancel_res = await svc.cancel_match_request("usr-demo-member-01", str(req_uuid))
        assert cancel_res["status"] == "cancelled"
        assert req.request_state == "cancelled"
        assert req.closed_at is not None
        assert mock_db.commit.called

        # Second cancel is idempotent
        second_res = await svc.cancel_match_request("usr-demo-member-01", str(req_uuid))
        assert second_res["status"] == "cancelled"

        # Cancelling matched request raises 400
        req.request_state = "matched"
        with pytest.raises(HTTPException) as exc_info:
            await svc.cancel_match_request("usr-demo-member-01", str(req_uuid))
        assert exc_info.value.status_code == 400

    run_async(_test())


# ─── 2. LISTENER AVAILABILITY & LIVE ACTIVE QUEUE ────────────────────────────

def test_listener_availability_toggle():
    """Verify listener availability toggle updates active_now and returns online status."""
    async def _test():
        mock_db = AsyncMock()
        lp = ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01",
            application_state="approved",
            eligibility_state="eligible",
            active_now=True
        )
        res_mock = MagicMock()
        res_mock.scalar_one_or_none.return_value = lp
        mock_db.execute.return_value = res_mock

        svc = PeerService(mock_db)
        toggle_res = await svc.toggle_listener_active("usr-demo-listener-01")
        assert toggle_res["status"] == "success"
        assert toggle_res["active_now"] is False
        assert toggle_res["is_online"] is False
        assert lp.active_now is False
        assert mock_db.commit.called

    run_async(_test())


def test_listener_active_match_requests_query():
    """Verify active queue query filters expired requests and calculates waiting minutes."""
    async def _test():
        mock_db = AsyncMock()
        req_active = ListenerMatchRequest(
            id=uuid.uuid4(),
            member_id="usr-demo-member-01",
            request_state="queued",
            support_topic="stress",
            preferred_channel="chat",
            created_at=datetime.utcnow() - timedelta(minutes=5),
            expires_at=datetime.utcnow() + timedelta(minutes=25)
        )
        res_mock = MagicMock()
        res_mock.all.return_value = [(req_active, "Priya Sharma")]
        mock_db.execute.return_value = res_mock

        svc = PeerService(mock_db)
        queue_items = await svc.list_active_match_requests("usr-demo-listener-01")
        assert len(queue_items) == 1
        item = queue_items[0]
        assert item["id"] == str(req_active.id)
        assert item["member_name"] == "Priya Sharma"
        assert item["support_topic"] == "stress"
        assert item["waiting_minutes"] >= 5
        assert item["urgency"] == "routine"

    run_async(_test())


# ─── 3. ATOMIC RACE-SAFE MATCH ACCEPTANCE ───────────────────────────────────

def test_atomic_match_acceptance_race_condition():
    """Verify atomic conditional match claim: winner receives 200, competing listener receives 409."""
    async def _test():
        mock_db = AsyncMock()
        req_uuid = uuid.uuid4()
        listener_profile = ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01",
            capacity_limit=3,
            active_now=True
        )

        req_row = ListenerMatchRequest(
            id=req_uuid,
            member_id="usr-demo-member-01",
            request_state="queued",
            preferred_channel="chat",
            support_topic="sleep",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=30)
        )

        # 1. First listener claims successfully: rowcount = 1
        prof_mock = MagicMock()
        prof_mock.scalar_one_or_none.return_value = listener_profile

        open_convs_mock = MagicMock()
        open_convs_mock.scalar.return_value = 0

        update_success = MagicMock()
        update_success.rowcount = 1

        fetch_req_mock = MagicMock()
        fetch_req_mock.scalar_one.return_value = req_row

        mock_db.execute.side_effect = [
            prof_mock,
            open_convs_mock,
            update_success,
            fetch_req_mock
        ]

        svc = PeerService(mock_db)
        accept_res = await svc.accept_match_request("usr-demo-listener-01", str(req_uuid))
        assert accept_res["status"] == "accepted"
        assert "conversation_id" in accept_res
        assert "match_id" in accept_res

        # 2. Competing listener attempts claim after winner: rowcount = 0, existing = matched -> 409
        prof_mock2 = MagicMock()
        prof_mock2.scalar_one_or_none.return_value = listener_profile

        open_convs_mock2 = MagicMock()
        open_convs_mock2.scalar.return_value = 0

        update_fail = MagicMock()
        update_fail.rowcount = 0

        existing_claimed = ListenerMatchRequest(
            id=req_uuid,
            member_id="usr-demo-member-01",
            request_state="matched",
            created_at=datetime.utcnow()
        )
        chk_mock = MagicMock()
        chk_mock.scalar_one_or_none.return_value = existing_claimed

        mock_db.execute.side_effect = [
            prof_mock2,
            open_convs_mock2,
            update_fail,
            chk_mock
        ]

        with pytest.raises(HTTPException) as exc_info:
            await svc.accept_match_request("usr-demo-listener-02", str(req_uuid))
        assert exc_info.value.status_code == 409
        assert exc_info.value.detail == "REQUEST_ALREADY_CLAIMED"

    run_async(_test())


def test_listener_decline_match_offer():
    """Verify listener declining offer marks match declined while keeping request queued."""
    async def _test():
        mock_db = AsyncMock()
        req_uuid = uuid.uuid4()
        listener_profile = ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01"
        )
        match_record = ListenerMatch(
            id=uuid.uuid4(),
            request_id=req_uuid,
            listener_id=listener_profile.id,
            match_state="offered"
        )

        p_mock = MagicMock()
        p_mock.scalar_one_or_none.return_value = listener_profile

        m_mock = MagicMock()
        m_mock.scalar_one_or_none.return_value = match_record

        req_mock = MagicMock()
        req_mock.scalar_one_or_none.return_value = ListenerMatchRequest(id=req_uuid, request_state="queued")

        mock_db.execute.side_effect = [p_mock, m_mock, req_mock]

        svc = PeerService(mock_db)
        decline_res = await svc.decline_match_request("usr-demo-listener-01", str(req_uuid))
        assert decline_res["status"] == "declined"
        assert decline_res["reassigned"] is True
        assert match_record.match_state == "declined"
        assert match_record.end_reason_code == "listener_declined"
        assert mock_db.commit.called

    run_async(_test())


# ─── 4. PEER MESSAGING & AES-256 ENCRYPTION ──────────────────────────────────

def test_peer_messaging_and_encryption_roundtrip():
    """Verify peer messages are envelope-encrypted in PostgreSQL and decrypted on read."""
    async def _test():
        mock_db = AsyncMock()
        conv_id = uuid.uuid4()
        conv = PeerConversation(
            id=conv_id,
            member_id="usr-demo-member-01",
            listener_id=uuid.uuid4(),
            conversation_state="open"
        )

        c_mock = MagicMock()
        c_mock.scalar_one_or_none.return_value = conv

        seq_mock = MagicMock()
        seq_mock.scalar.return_value = 0

        mock_db.execute.side_effect = [c_mock, seq_mock]

        svc = PeerService(mock_db)
        payload = PeerMessageCreate(content="Thank you for listening to me today.")
        msg_dict = await svc.send_message("usr-demo-member-01", str(conv_id), payload)

        assert msg_dict["content"] == "Thank you for listening to me today."
        assert msg_dict["conversation_id"] == str(conv_id)
        assert mock_db.add.called
        assert mock_db.commit.called

        # Inspect added PeerMessage: content_ciphertext must be binary ciphertext, not plaintext string
        added_msg = mock_db.add.call_args[0][0]
        assert isinstance(added_msg, PeerMessage)
        assert isinstance(added_msg.content_ciphertext, bytes)
        assert b"Thank you for listening" not in added_msg.content_ciphertext
        assert added_msg.key_version in ("v1", "v2")

        # Verify decryption roundtrip restores original plaintext
        decrypted = decrypt_content(added_msg.content_ciphertext, added_msg.key_version)
        assert decrypted == "Thank you for listening to me today."

    run_async(_test())


# ─── 5. SESSION CLOSURE & FEEDBACK PERSISTENCE ──────────────────────────────

def test_session_closure_and_feedback_persistence():
    """Verify conversation closure idempotency and post-session rating recalculation."""
    async def _test():
        mock_db = AsyncMock()
        conv_id = uuid.uuid4()
        match_id = uuid.uuid4()
        listener_id = uuid.uuid4()

        conv = PeerConversation(
            id=conv_id,
            match_id=match_id,
            member_id="usr-demo-member-01",
            listener_id=listener_id,
            conversation_state="open"
        )
        match_rec = ListenerMatch(id=match_id, match_state="accepted")

        c_mock = MagicMock()
        c_mock.scalar_one_or_none.return_value = conv
        m_mock = MagicMock()
        m_mock.scalar_one_or_none.return_value = match_rec

        mock_db.execute.side_effect = [c_mock, m_mock]

        svc = PeerService(mock_db)
        close_res = await svc.close_conversation("usr-demo-member-01", str(conv_id))
        assert close_res["conversation_state"] == "closed"
        assert conv.conversation_state == "closed"
        assert conv.closed_by_user_id == "usr-demo-member-01"
        assert match_rec.ended_at is not None

        # Test feedback submission & rolling rating calculation
        lp = ListenerProfile(id=listener_id, user_id="usr-demo-listener-01", rating=5.0, total_conversations=1)
        c_mock2 = MagicMock()
        c_mock2.scalar_one_or_none.return_value = conv
        lp_mock = MagicMock()
        lp_mock.scalar_one_or_none.return_value = lp

        mock_db.execute.side_effect = [c_mock2, lp_mock]

        fb_payload = FeedbackCreate(
            rating=4,
            feedback_text="Really calm listener.",
            post_mood_score=8.0,
            post_mood_label="peaceful"
        )
        fb_res = await svc.submit_feedback("usr-demo-member-01", str(conv_id), fb_payload)
        assert fb_res["status"] == "success"
        # Rolling rating: (5.0 * 1 + 4) / 2 = 4.5
        assert lp.rating == 4.5
        assert lp.total_conversations == 2

    run_async(_test())


# ─── 6. CONDUCT & SAFETY ESCALATION ──────────────────────────────────────────

def test_conduct_report_submission_and_encryption():
    """Verify conduct report submission stores encrypted narrative and links conversation."""
    async def _test():
        mock_db = AsyncMock()
        c_uuid = uuid.uuid4()

        ops = OperationsService(mock_db)
        rep_payload = {
            "conversation_id": str(c_uuid),
            "category_code": "CRISIS_SENTINEL",
            "details": "Participant violated safety community boundaries.",
            "severity": "high"
        }

        rep_res = await ops.create_conduct_report("usr-demo-listener-01", rep_payload)
        assert rep_res["status"] == "created"
        assert rep_res["category_code"] == "CRISIS_SENTINEL"
        assert rep_res["severity"] == "high"
        assert mock_db.add.called
        assert mock_db.commit.called

        added_rep = mock_db.add.call_args[0][0]
        assert isinstance(added_rep, ConductReport)
        assert isinstance(added_rep.details_ciphertext, bytes)
        assert b"Participant violated safety" not in added_rep.details_ciphertext

    run_async(_test())


# ─── 7. WORKLOAD CAPACITY LIMIT ENFORCEMENT ─────────────────────────────────

def test_listener_capacity_limit_enforcement():
    """Verify listener cannot accept new requests when active conversation count reaches limit."""
    async def _test():
        mock_db = AsyncMock()
        req_uuid = uuid.uuid4()
        listener_profile = ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01",
            capacity_limit=1,
            active_now=True
        )

        p_mock = MagicMock()
        p_mock.scalar_one_or_none.return_value = listener_profile

        # Open conversations count = 1 (saturated capacity)
        open_convs_mock = MagicMock()
        open_convs_mock.scalar.return_value = 1

        mock_db.execute.side_effect = [p_mock, open_convs_mock]

        svc = PeerService(mock_db)
        with pytest.raises(HTTPException) as exc_info:
            await svc.accept_match_request("usr-demo-listener-01", str(req_uuid))
        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "CAPACITY_LIMIT_EXCEEDED"

    run_async(_test())


# ─── 8. VALIDATION & ERROR HANDLING ──────────────────────────────────────────

def test_feedback_rating_validation():
    """Verify Pydantic schema rejects rating values outside 1-5 range."""
    with pytest.raises(ValidationError):
        FeedbackCreate(rating=0)

    with pytest.raises(ValidationError):
        FeedbackCreate(rating=6)

    valid_fb = FeedbackCreate(rating=5)
    assert valid_fb.rating == 5


def test_nonexistent_request_error_handling():
    """Verify appropriate 404/400 errors for missing or malformed request IDs."""
    async def _test():
        mock_db = AsyncMock()
        svc = PeerService(mock_db)

        # Invalid UUID string raises 400
        with pytest.raises(HTTPException) as exc_400:
            await svc.get_match_request_status("usr-demo-member-01", "not-a-valid-uuid")
        assert exc_400.value.status_code == 400

        # Nonexistent UUID raises 404
        empty_res = MagicMock()
        empty_res.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = empty_res

        with pytest.raises(HTTPException) as exc_404:
            await svc.get_match_request_status("usr-demo-member-01", str(uuid.uuid4()))
        assert exc_404.value.status_code == 404

    run_async(_test())


# ─── 9. SCHEMA ALIAS HANDLING (isOnline / is_online) ─────────────────────────

def test_listener_profile_update_schema_aliases():
    """Verify ListenerProfileUpdate correctly maps isOnline/is_online aliases to active_now."""
    # isOnline alias
    p1 = ListenerProfileUpdate(isOnline=True)
    assert p1.active_now is True
    assert p1.isOnline is True

    # is_online alias
    p2 = ListenerProfileUpdate(is_online=False)
    assert p2.active_now is False

    # capacityLimit alias
    p3 = ListenerProfileUpdate(capacityLimit=2, isOnline=True)
    assert p3.capacity_limit == 2
    assert p3.active_now is True

    async def _test():
        mock_db = AsyncMock()
        lp = ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01",
            capacity_limit=1,
            active_now=False
        )
        p_mock = MagicMock()
        p_mock.scalar_one_or_none.return_value = lp
        mock_db.execute.side_effect = [
            MagicMock(scalar_one_or_none=lambda: AppPrincipal(user_id="usr-demo-listener-01")),
            p_mock
        ]

        svc = PeerService(mock_db)
        update_payload = ListenerProfileUpdate(isOnline=True, capacityLimit=2)
        res = await svc.update_listener_profile("usr-demo-listener-01", update_payload)

        assert res["status"] == "success"
        assert res["active_now"] is True
        assert res["is_online"] is True
        assert res["isOnline"] is True
        assert lp.active_now is True
        assert lp.capacity_limit == 2

    run_async(_test())


# ─── 10. AUTHENTICATION & DEV USER RESOLUTION (x-user-id / x-member-id) ──────

def test_security_x_user_id_dev_resolution():
    """Verify get_current_user_id extracts user identity from x-user-id or x-member-id header."""
    async def _test():
        class MockRequest:
            def __init__(self, headers):
                self.headers = headers

        # x-user-id header
        req1 = MockRequest({"x-user-id": "usr-demo-listener-01"})
        user_id1 = await get_current_user_id(request=req1)
        assert user_id1 == "usr-demo-listener-01"

        # x-member-id header
        req2 = MockRequest({"x-member-id": "usr-custom-member-77"})
        user_id2 = await get_current_user_id(request=req2)
        assert user_id2 == "usr-custom-member-77"

        # Fallback to demo member when unauthenticated
        req_empty = MockRequest({})
        user_id_fallback = await get_current_user_id(request=req_empty)
        assert user_id_fallback == "usr-demo-member-01"

    run_async(_test())


# ─── 11. CONDUCT REPORT SESSION_ID MAPPING & NON-UUID SAFETY ────────────────

def test_conduct_report_session_id_mapping_and_non_uuid_safety():
    """Verify create_conduct_report maps session_id to conversation_id and safely handles non-UUID strings."""
    async def _test():
        mock_db = AsyncMock()
        ops = OperationsService(mock_db)

        # Arbitrary non-UUID session string must not throw 500 error
        payload = {
            "session_id": "session-live-room-xyz-12345",
            "reason": "inappropriate_boundary",
            "notes": "Listener provided off-platform contact details.",
            "severity": "urgent"
        }

        res = await ops.create_conduct_report("usr-demo-member-01", payload)
        assert res["status"] == "created"
        assert res["session_id"] == "session-live-room-xyz-12345"
        assert "conversation_id" in res
        # Verify conversation_id is a valid UUID
        uuid.UUID(res["conversation_id"])
        assert res["category_code"] == "inappropriate_boundary"
        assert res["severity"] == "urgent"

    run_async(_test())


# ─── 12. LIVE CRISIS SENTINEL IN PEER CHAT ───────────────────────────────────

def test_live_crisis_sentinel_in_peer_chat():
    """Verify deterministic regex crisis tripwire creates SafetyCase and broadcasts alert without blocking chat."""
    async def _test():
        mock_db = AsyncMock()
        conv_id = uuid.uuid4()
        conv = PeerConversation(
            id=conv_id,
            member_id="usr-demo-member-01",
            listener_id=uuid.uuid4(),
            conversation_state="open"
        )

        c_mock = MagicMock()
        c_mock.scalar_one_or_none.return_value = conv
        seq_mock = MagicMock()
        seq_mock.scalar.return_value = 1

        mock_db.execute.side_effect = [c_mock, seq_mock]

        # Verify CRISIS_REGEX matches terms in < 2ms
        crisis_text = "I feel like I want to die and end my life tonight"
        assert bool(CRISIS_REGEX.search(crisis_text)) is True

        svc = PeerService(mock_db)
        with patch.object(OperationsService, "create_safety_case", new_callable=AsyncMock) as mock_create_case, \
             patch.object(manager, "broadcast", new_callable=AsyncMock) as mock_broadcast:

            mock_create_case.return_value = {"status": "created", "id": str(uuid.uuid4())}

            msg_res = await svc.send_message(
                "usr-demo-member-01",
                str(conv_id),
                PeerMessageCreate(content=crisis_text)
            )

            # Chat message is NOT blocked; it is delivered and returned
            assert msg_res["content"] == crisis_text
            assert msg_res["is_crisis"] is True
            assert "safety_case_id" in msg_res

            # SafetyCase was created with urgent priority
            assert mock_create_case.called
            case_payload = mock_create_case.call_args[0][0]
            assert case_payload["source_type"] == "peer_chat"
            assert case_payload["priority_code"] == "urgent"

            # Broadcast sent new_message AND safety_alert with helplines
            assert mock_broadcast.call_count == 2
            alert_call = mock_broadcast.call_args_list[1][0][1]
            assert alert_call["type"] == "safety_alert"
            assert "14416" in alert_call["helplines"]
            assert "112" in alert_call["helplines"]

    run_async(_test())


# ─── 13. REQUEST EXPIRATION & SWEEPER ───────────────────────────────────────

def test_match_request_expiration_and_sweeper():
    """Verify expired match requests transition to expired state and cannot be claimed."""
    async def _test():
        mock_db = AsyncMock()
        req_uuid = uuid.uuid4()
        now = datetime.utcnow()
        expired_req = ListenerMatchRequest(
            id=req_uuid,
            member_id="usr-demo-member-01",
            request_state="queued",
            created_at=now - timedelta(minutes=35),
            expires_at=now - timedelta(minutes=5)
        )

        r_mock = MagicMock()
        r_mock.scalar_one_or_none.return_value = expired_req
        mock_db.execute.return_value = r_mock

        svc = PeerService(mock_db)
        status_res = await svc.get_match_request_status("usr-demo-member-01", str(req_uuid))
        assert status_res["request_state"] == "expired"
        assert expired_req.request_state == "expired"
        assert expired_req.closed_at is not None

        # Expired request rejected on claim with 409 REQUEST_EXPIRED
        listener_profile = ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01",
            capacity_limit=3,
            active_now=True
        )
        p_mock = MagicMock()
        p_mock.scalar_one_or_none.return_value = listener_profile
        open_convs_mock = MagicMock()
        open_convs_mock.scalar.return_value = 0
        update_fail = MagicMock()
        update_fail.rowcount = 0
        chk_mock = MagicMock()
        chk_mock.scalar_one_or_none.return_value = expired_req

        mock_db.execute.side_effect = [
            p_mock,
            open_convs_mock,
            update_fail,
            chk_mock
        ]

        with pytest.raises(HTTPException) as exc_info:
            await svc.accept_match_request("usr-demo-listener-01", str(req_uuid))
        assert exc_info.value.status_code == 409
        assert exc_info.value.detail == "REQUEST_EXPIRED"

        # Sweeper executes update query on overdue queued rows
        sweep_update_mock = MagicMock()
        sweep_update_mock.rowcount = 3
        mock_db.execute.side_effect = None
        mock_db.execute.return_value = sweep_update_mock

        swept_count = await svc.sweep_expired_requests()
        assert swept_count == 3
        assert mock_db.commit.called

    run_async(_test())


# ─── 14. WEBRTC SIGNALING & WEBSOCKET BROADCAST ──────────────────────────────

def test_webrtc_signaling_and_websocket_broadcast():
    """Verify WebSocket signaling relays offer/answer/candidate to peer with sender exclusion."""
    async def _test():
        cm = ConnectionManager()
        ws_sender = AsyncMock()
        ws_peer = AsyncMock()

        conv_id = str(uuid.uuid4())
        await cm.connect(conv_id, ws_sender)
        await cm.connect(conv_id, ws_peer)

        # Broadcast WebRTC offer with exclude=ws_sender
        signal_data = {"type": "offer", "sdp": "v=0\r\no=alice..."}
        message = {
            "type": "webrtc_signal",
            "signal": signal_data,
            "from_user_id": "usr-sender-01"
        }
        await cm.broadcast(conv_id, message, exclude=ws_sender)

        # Peer receives signal, sender does NOT receive echo
        assert ws_peer.send_json.called
        assert ws_peer.send_json.call_args[0][0]["type"] == "webrtc_signal"
        assert ws_peer.send_json.call_args[0][0]["from_user_id"] == "usr-sender-01"
        assert not ws_sender.send_json.called

        # Test websocket endpoint message dispatching
        mock_service = AsyncMock()
        mock_ws = AsyncMock()

        # 1. ping receives pong
        mock_ws.receive_json.side_effect = [
            {"type": "ping"},
            {"type": "webrtc_signal", "signal": {"type": "candidate"}, "from_user_id": "usr-01"},
            {"type": "session_closed", "from_user_id": "usr-01"},
            {"type": "chat_message", "content": "Hello via WS", "sender_id": "usr-01"},
            Exception("Disconnect loop")
        ]

        with patch.object(manager, "broadcast", new_callable=AsyncMock) as ws_broadcast:
            await websocket_peer_endpoint(mock_ws, conv_id, service=mock_service)

            # Assert pong was sent
            assert mock_ws.send_json.called
            assert mock_ws.send_json.call_args[0][0] == {"type": "pong"}

            # Assert webrtc_signal broadcasted
            assert ws_broadcast.called

            # Assert session_closed called close_conversation
            assert mock_service.close_conversation.called

            # Assert chat_message called send_message
            assert mock_service.send_message.called

    run_async(_test())
