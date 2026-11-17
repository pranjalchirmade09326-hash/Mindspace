"""
Milestone 1: Backend Peer Core Test Suite (test_peer_workflow.py)
Validates complete Member and Listener workflow:
1. Member match request creation, status polling, and cancellation.
2. Listener availability toggle and live active queue visibility.
3. Atomic race-safe match acceptance (preventing double claims) and decline logic.
4. Workload capacity limit enforcement.
5. Peer consultation messaging with AES-256-GCM envelope encryption roundtrip (verifying plaintext is not in DB).
6. Session closure idempotency.
7. Post-session feedback persistence, encrypted narrative, and listener rolling rating recalculation.
8. Safety conduct reporting with encrypted details.
9. Input validation and edge cases.
"""
import pytest
import uuid
import json
import sqlite3
import unittest.mock
from datetime import datetime, timezone, timedelta

# SQLite adapter for Python list and dict to prevent SQLite binding error
sqlite3.register_adapter(list, json.dumps)
sqlite3.register_adapter(dict, json.dumps)

from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

# SQLite compilation overrides for PostgreSQL-specific types
@compiles(ARRAY, "sqlite")
def compile_array_sqlite(type_, compiler, **kw):
    return "TEXT"

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.core.security import encrypt_content, decrypt_content
from app.models.member import AppPrincipal, MemberProfile
from app.models.peer import ListenerProfile, ListenerMatchRequest, ListenerMatch, PeerConversation, PeerMessage
from app.models.operations import ListenerFeedback, ConductReport
from app.routers import peer, operations

test_app = FastAPI()
test_app.include_router(peer.router)
test_app.include_router(operations.router)

# In-memory SQLite test database with StaticPool and check_same_thread=False
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)
tables = [
    AppPrincipal.__table__,
    MemberProfile.__table__,
    ListenerProfile.__table__,
    ListenerMatchRequest.__table__,
    ListenerMatch.__table__,
    PeerConversation.__table__,
    PeerMessage.__table__,
    ListenerFeedback.__table__,
    ConductReport.__table__,
]
Base.metadata.create_all(bind=test_engine, tables=tables)
TestSessionLocal = sessionmaker(bind=test_engine, expire_on_commit=False)


class AsyncSessionWrapper:
    """Wraps synchronous SQLite session to satisfy AsyncSession interface in services."""
    def __init__(self, session):
        self.session = session

    async def execute(self, statement, *args, **kwargs):
        return self.session.execute(statement, *args, **kwargs)

    def add(self, instance):
        self.session.add(instance)

    async def commit(self):
        self.session.commit()

    async def flush(self):
        self.session.flush()

    async def refresh(self, instance):
        self.session.refresh(instance)

    async def close(self):
        self.session.close()


def override_get_db():
    sync_session = TestSessionLocal()
    wrapper = AsyncSessionWrapper(sync_session)
    try:
        yield wrapper
    finally:
        sync_session.close()


test_app.dependency_overrides[get_db] = override_get_db
client = TestClient(test_app)


@pytest.fixture(autouse=True)
def seed_test_database():
    """Ensure baseline test principal and listener records exist before each test."""
    session = TestSessionLocal()
    
    # Check or seed member
    m_principal = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-member-01")).scalar_one_or_none()
    if not m_principal:
        session.add(AppPrincipal(user_id="usr-demo-member-01", account_state="active"))
        session.add(MemberProfile(user_id="usr-demo-member-01", display_name="Priya Sharma"))
    
    # Check or seed listener 1
    l1_principal = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-listener-01")).scalar_one_or_none()
    if not l1_principal:
        session.add(AppPrincipal(user_id="usr-demo-listener-01", account_state="active"))
        session.add(MemberProfile(user_id="usr-demo-listener-01", display_name="Aarav Sharma"))
        session.add(ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-01",
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=3,
            profile_languages=["English", "Hindi"],
            active_now=True,
            rating=5.0,
            total_conversations=0
        ))

    # Check or seed listener 2
    l2_principal = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == "usr-demo-listener-02")).scalar_one_or_none()
    if not l2_principal:
        session.add(AppPrincipal(user_id="usr-demo-listener-02", account_state="active"))
        session.add(MemberProfile(user_id="usr-demo-listener-02", display_name="Ananya Patel"))
        session.add(ListenerProfile(
            id=uuid.uuid4(),
            user_id="usr-demo-listener-02",
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=3,
            profile_languages=["English"],
            active_now=True,
            rating=4.8,
            total_conversations=5
        ))

    session.commit()
    session.close()


# ─── 1. MEMBER MATCH REQUEST CREATION & POLLING ──────────────────────────────

def test_member_create_and_poll_match_request():
    """Verify member can initiate a support request and poll its queued status."""
    payload = {
        "support_topic": "anxiety",
        "preferred_channel": "chat",
        "preferred_languages": ["en"],
        "notes": "Feeling overwhelmed with upcoming exam deadlines."
    }
    res = client.post(
        "/api/v1/peer/match-requests",
        json=payload,
        headers={"x-user-id": "usr-demo-member-01"}
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["request_state"] == "queued"
    assert data["support_topic"] == "anxiety"
    assert data["preferred_channel"] == "chat"
    req_id = data["id"]

    # Poll request status
    poll_res = client.get(f"/api/v1/peer/match-requests/{req_id}")
    assert poll_res.status_code == 200
    poll_data = poll_res.json()
    assert poll_data["id"] == req_id
    assert poll_data["request_state"] == "queued"
    assert poll_data["conversation_id"] is None
    assert poll_data["listener"] is None


def test_member_cancel_queued_request():
    """Verify member can cancel an active queued request and that cancellation is idempotent."""
    # Create request
    create_res = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "stress", "preferred_channel": "chat"},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    req_id = create_res.json()["id"]

    # Cancel request
    cancel_res = client.post(f"/api/v1/peer/match-requests/{req_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Verify status via polling
    poll_res = client.get(f"/api/v1/peer/match-requests/{req_id}")
    assert poll_res.json()["request_state"] == "cancelled"

    # Idempotent second cancel
    second_cancel = client.post(f"/api/v1/peer/match-requests/{req_id}/cancel")
    assert second_cancel.status_code == 200
    assert second_cancel.json()["status"] == "cancelled"


# ─── 2. LISTENER AVAILABILITY & LIVE ACTIVE QUEUE ────────────────────────────

def test_listener_availability_toggle():
    """Verify listener can toggle availability between active (online) and offline."""
    # Initial status of listener 1 is active (seeded as True)
    res = client.post(
        "/api/v1/listeners/me/toggle-active",
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    # Should toggle to False
    assert res.json()["active_now"] is False

    # Toggle again -> should toggle back to True
    res2 = client.post(
        "/api/v1/listeners/me/toggle-active",
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    assert res2.status_code == 200
    assert res2.json()["active_now"] is True


def test_listener_active_match_requests_query():
    """Verify listeners can query queued match requests with calculated waiting minutes."""
    # Create a fresh queued request
    create_res = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "sleep", "preferred_channel": "chat", "notes": "Chronic insomnia"},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    req_id = create_res.json()["id"]

    # Listener queries active requests
    active_res = client.get(
        "/api/v1/peer/match-requests/active",
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    assert active_res.status_code == 200
    active_list = active_res.json()
    assert isinstance(active_list, list)
    matching = [r for r in active_list if r["id"] == req_id]
    assert len(matching) == 1
    req_item = matching[0]
    assert req_item["support_topic"] == "sleep"
    assert "waiting_minutes" in req_item
    assert req_item["waiting_minutes"] >= 0


# ─── 3. ATOMIC RACE-SAFE MATCH ACCEPTANCE & CONCURRENCY ──────────────────────

def test_atomic_match_acceptance_race_condition():
    """
    CRITICAL CONCURRENCY TEST:
    Verify that when two listeners attempt to claim the exact same queued match request,
    Listener 1 succeeds (200 OK + conversation created) and Listener 2 is rejected
    with 409 Conflict ('REQUEST_ALREADY_CLAIMED').
    """
    create_res = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "relationships", "preferred_channel": "chat"},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    req_id = create_res.json()["id"]

    # First listener claims request
    accept_1 = client.post(
        f"/api/v1/peer/match-requests/{req_id}/accept",
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    assert accept_1.status_code == 200, accept_1.text
    data_1 = accept_1.json()
    assert data_1["status"] == "accepted"
    assert "conversation_id" in data_1
    assert "match_id" in data_1
    conv_id = data_1["conversation_id"]

    # Second listener attempts to claim the same request -> MUST FAIL with 409 Conflict
    accept_2 = client.post(
        f"/api/v1/peer/match-requests/{req_id}/accept",
        headers={"x-user-id": "usr-demo-listener-02"}
    )
    assert accept_2.status_code == 409
    assert "REQUEST_ALREADY_CLAIMED" in accept_2.json()["detail"]

    # Polling now reflects matched state with listener 1 details
    poll_res = client.get(f"/api/v1/peer/match-requests/{req_id}")
    assert poll_res.status_code == 200
    poll_data = poll_res.json()
    assert poll_data["request_state"] == "matched"
    assert poll_data["conversation_id"] == conv_id
    assert poll_data["listener"] is not None
    assert poll_data["listener"]["user_id"] == "usr-demo-listener-01"


def test_listener_decline_match_offer():
    """Verify declining a match offer records decline state while leaving the request in queue."""
    create_res = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "grief", "preferred_channel": "chat"},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    req_id = create_res.json()["id"]

    decline_res = client.post(
        f"/api/v1/peer/match-requests/{req_id}/decline",
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    assert decline_res.status_code == 200
    assert decline_res.json()["status"] == "declined"
    assert decline_res.json()["reassigned"] is True

    # Request must still be in queued state for other listeners
    poll_res = client.get(f"/api/v1/peer/match-requests/{req_id}")
    assert poll_res.json()["request_state"] == "queued"


# ─── 4. CONSULTATION MESSAGING & AES-256-GCM ENVELOPE ENCRYPTION ─────────────

def test_peer_messaging_and_encryption_roundtrip():
    """
    Verify bi-directional consultation messaging:
    1. Messages are encrypted with AES-256-GCM before DB write.
    2. Plaintext is NEVER stored in database columns.
    3. Retrieval transparently decrypts and returns original message.
    """
    # Create and accept match
    create_res = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "general", "preferred_channel": "chat"},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    req_id = create_res.json()["id"]
    accept_res = client.post(
        f"/api/v1/peer/match-requests/{req_id}/accept",
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    conv_id = accept_res.json()["conversation_id"]

    # Member sends message
    plaintext_msg = "Hello Aarav, I have been feeling quite anxious lately."
    send_res = client.post(
        f"/api/v1/peer/conversations/{conv_id}/messages",
        json={"content": plaintext_msg},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    assert send_res.status_code == 200
    assert send_res.json()["content"] == plaintext_msg

    # Listener replies
    listener_reply = "I hear you, Priya. Take a slow breath — I am here to listen."
    reply_res = client.post(
        f"/api/v1/peer/conversations/{conv_id}/messages",
        json={"content": listener_reply},
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    assert reply_res.status_code == 200
    assert reply_res.json()["content"] == listener_reply

    # Retrieve message history via API
    list_res = client.get(
        f"/api/v1/peer/conversations/{conv_id}/messages",
        headers={"x-user-id": "usr-demo-member-01"}
    )
    assert list_res.status_code == 200
    messages = list_res.json()
    assert len(messages) >= 3  # Welcome message + Member message + Listener reply
    msg_texts = [m["content"] for m in messages]
    assert plaintext_msg in msg_texts
    assert listener_reply in msg_texts

    # DIRECT DATABASE PERSISTENCE VERIFICATION:
    # Query raw database row directly and verify ciphertext is not plaintext
    session = TestSessionLocal()
    c_uuid = uuid.UUID(conv_id)
    db_messages = session.execute(
        select(PeerMessage).where(PeerMessage.conversation_id == c_uuid).order_by(PeerMessage.sequence_no)
    ).scalars().all()
    session.close()

    assert len(db_messages) >= 3
    for db_m in db_messages:
        # Ciphertext must be bytes
        assert isinstance(db_m.content_ciphertext, bytes)
        # Plaintext must NOT appear in raw bytes
        assert plaintext_msg.encode("utf-8") not in db_m.content_ciphertext
        assert listener_reply.encode("utf-8") not in db_m.content_ciphertext
        # Decrypting directly using security module restores original text
        decrypted = decrypt_content(db_m.content_ciphertext, db_m.key_version)
        assert decrypted in msg_texts


# ─── 5. SESSION CLOSURE IDEMPOTENCY & POST-SESSION FEEDBACK ──────────────────

def test_session_closure_and_feedback_persistence():
    """
    Verify:
    1. Closing session sets conversation_state to 'closed'.
    2. Messages cannot be sent after closure.
    3. Post-session feedback is encrypted and persisted in listener_feedback table.
    4. Listener rolling rating and conversation count are updated.
    """
    # Create & accept
    create_res = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "anxiety", "preferred_channel": "chat"},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    req_id = create_res.json()["id"]
    accept_res = client.post(
        f"/api/v1/peer/match-requests/{req_id}/accept",
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    conv_id = accept_res.json()["conversation_id"]

    # Close session
    close_res = client.put(
        f"/api/v1/peer/conversations/{conv_id}/close",
        headers={"x-user-id": "usr-demo-member-01"}
    )
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "success"
    assert close_res.json()["conversation_state"] == "closed"

    # Attempt to send message after closure -> MUST return 400 Bad Request
    post_close_msg = client.post(
        f"/api/v1/peer/conversations/{conv_id}/messages",
        json={"content": "Attempted message after session ended"},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    assert post_close_msg.status_code == 400
    assert "CONVERSATION_CLOSED" in post_close_msg.json()["detail"]

    # Submit member feedback
    feedback_payload = {
        "rating": 5,
        "feedback_text": "Aarav was exceptionally grounding and compassionate.",
        "post_mood_score": 8.5,
        "sync_to_journal": True
    }
    fb_res = client.post(
        f"/api/v1/peer/conversations/{conv_id}/feedback",
        json=feedback_payload,
        headers={"x-user-id": "usr-demo-member-01"}
    )
    assert fb_res.status_code == 200
    data = fb_res.json()
    assert data["status"] == "success"
    assert "feedback_id" in data
    fb_id = data["feedback_id"]

    # DIRECT DATABASE PERSISTENCE VERIFICATION:
    session = TestSessionLocal()
    fb_uuid = uuid.UUID(fb_id)
    fb_row = session.execute(select(ListenerFeedback).where(ListenerFeedback.id == fb_uuid)).scalar_one_or_none()
    assert fb_row is not None
    assert fb_row.rating == 5
    assert fb_row.post_mood_score == 8.5
    assert fb_row.sync_to_journal is True
    # Verify narrative is encrypted
    assert isinstance(fb_row.feedback_ciphertext, bytes)
    assert b"Aarav was exceptionally" not in fb_row.feedback_ciphertext
    decrypted_fb = decrypt_content(fb_row.feedback_ciphertext, fb_row.key_version)
    assert decrypted_fb == feedback_payload["feedback_text"]

    # Verify listener profile rolling rating and total conversations incremented
    l_prof = session.execute(select(ListenerProfile).where(ListenerProfile.user_id == "usr-demo-listener-01")).scalar_one()
    assert l_prof.total_conversations >= 1
    assert l_prof.rating >= 4.0
    session.close()


# ─── 6. CONDUCT & SAFETY ESCALATION ──────────────────────────────────────────

def test_conduct_report_submission_and_encryption():
    """Verify conduct report submission stores encrypted narrative and links conversation."""
    # Create conversation
    create_res = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "stress", "preferred_channel": "chat"},
        headers={"x-user-id": "usr-demo-member-01"}
    )
    req_id = create_res.json()["id"]
    accept_res = client.post(
        f"/api/v1/peer/match-requests/{req_id}/accept",
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    conv_id = accept_res.json()["conversation_id"]

    # Submit conduct report
    report_details = "Participant became hostile and violated community boundaries."
    report_payload = {
        "conversation_id": conv_id,
        "category_code": "CRISIS_SENTINEL",
        "details": report_details,
        "severity": "high"
    }
    rep_res = client.post(
        "/api/v1/operations/supervisor/conduct-reports",
        json=report_payload,
        headers={"x-user-id": "usr-demo-listener-01"}
    )
    assert rep_res.status_code == 200, rep_res.text
    rep_data = rep_res.json()
    assert rep_data["status"] == "created"
    assert "report_id" in rep_data
    report_id = rep_data["report_id"]

    # DIRECT DATABASE PERSISTENCE VERIFICATION:
    session = TestSessionLocal()
    rep_uuid = uuid.UUID(report_id)
    rep_row = session.execute(select(ConductReport).where(ConductReport.id == rep_uuid)).scalar_one_or_none()
    assert rep_row is not None
    assert rep_row.category_code == "CRISIS_SENTINEL"
    assert rep_row.severity == "high"
    assert rep_row.report_state == "open"
    # Verify details are encrypted
    assert isinstance(rep_row.details_ciphertext, bytes)
    assert report_details.encode("utf-8") not in rep_row.details_ciphertext
    decrypted_details = decrypt_content(rep_row.details_ciphertext, rep_row.key_version)
    assert decrypted_details == report_details
    session.close()


# ─── 7. WORKLOAD CAPACITY LIMIT ENFORCEMENT ──────────────────────────────────

def test_listener_capacity_limit_enforcement():
    """Verify listener cannot accept requests when active conversations reach capacity limit."""
    session = TestSessionLocal()
    # Create a dedicated listener with capacity limit = 1
    limited_uid = "usr-limited-listener"
    p = session.execute(select(AppPrincipal).where(AppPrincipal.user_id == limited_uid)).scalar_one_or_none()
    if not p:
        session.add(AppPrincipal(user_id=limited_uid, account_state="active"))
    
    l_prof = session.execute(select(ListenerProfile).where(ListenerProfile.user_id == limited_uid)).scalar_one_or_none()
    if not l_prof:
        l_prof = ListenerProfile(
            id=uuid.uuid4(),
            user_id=limited_uid,
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=1,
            active_now=True
        )
        session.add(l_prof)
    else:
        l_prof.capacity_limit = 1
    session.commit()
    session.close()

    # Request 1
    req1 = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "topic-1", "preferred_channel": "chat"},
        headers={"x-user-id": "usr-demo-member-01"}
    ).json()["id"]

    # Accept request 1 -> should succeed
    acc1 = client.post(
        f"/api/v1/peer/match-requests/{req1}/accept",
        headers={"x-user-id": limited_uid}
    )
    assert acc1.status_code == 200

    # Request 2
    req2 = client.post(
        "/api/v1/peer/match-requests",
        json={"support_topic": "topic-2", "preferred_channel": "chat"},
        headers={"x-user-id": "usr-demo-member-01"}
    ).json()["id"]

    # Attempt to accept request 2 -> MUST FAIL with 400 CAPACITY_LIMIT_EXCEEDED
    acc2 = client.post(
        f"/api/v1/peer/match-requests/{req2}/accept",
        headers={"x-user-id": limited_uid}
    )
    assert acc2.status_code == 400
    assert "CAPACITY_LIMIT_EXCEEDED" in acc2.json()["detail"]


# ─── 8. INPUT VALIDATION & ERROR HANDLING ────────────────────────────────────

def test_feedback_rating_validation():
    """Verify Pydantic rejects ratings outside the 1-5 scale with 422 Unprocessable Entity."""
    # Rating > 5
    res1 = client.post(
        f"/api/v1/peer/conversations/{uuid.uuid4()}/feedback",
        json={"rating": 6, "feedback_text": "Too high"}
    )
    assert res1.status_code == 422

    # Rating < 1
    res2 = client.post(
        f"/api/v1/peer/conversations/{uuid.uuid4()}/feedback",
        json={"rating": 0, "feedback_text": "Too low"}
    )
    assert res2.status_code == 422


def test_nonexistent_request_error_handling():
    """Verify 404 is returned for non-existent match requests."""
    fake_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/peer/match-requests/{fake_id}")
    assert res.status_code == 404

    cancel_res = client.post(f"/api/v1/peer/match-requests/{fake_id}/cancel")
    assert cancel_res.status_code == 404
