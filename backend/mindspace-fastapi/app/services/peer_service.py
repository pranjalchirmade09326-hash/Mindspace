from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import aliased
from app.core.database import get_db
from app.core.security import encrypt_content, decrypt_content
from app.models.peer import ListenerMatchRequest, ListenerMatch, PeerConversation, PeerMessage, ListenerProfile
from app.models.member import AppPrincipal, MemberProfile
from app.schemas.peer import (
    MatchRequestCreate,
    BookSessionRequest,
    PeerMessageCreate,
    SoapNoteCreate,
    ListenerProfileUpdate,
)
from app.services.base import BaseService
from datetime import datetime, timedelta
import uuid


class PeerService(BaseService):
    async def list_available_listeners(self) -> list[dict]:
        stmt = (
            select(ListenerProfile, MemberProfile.display_name)
            .outerjoin(MemberProfile, ListenerProfile.user_id == MemberProfile.user_id)
            .where(ListenerProfile.application_state == "approved")
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        listeners = []
        for lp, display_name in rows:
            listeners.append({
                "id": str(lp.id),
                "user_id": lp.user_id,
                "name": display_name or lp.user_id,
                "eligibility": lp.eligibility_state,
                "capacity": lp.capacity_limit,
                "rating": "4.9 ★"
            })
        return listeners

    async def list_match_requests(self, user_id: str) -> list[dict]:
        stmt = select(ListenerMatchRequest).where(
            ListenerMatchRequest.member_id == user_id
        ).order_by(desc(ListenerMatchRequest.created_at))
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "member_id": r.member_id,
                "status": r.request_state,
                "created_at": r.created_at.isoformat()
            }
            for r in items
        ]

    async def create_match_request(self, user_id: str, payload: MatchRequestCreate) -> dict:
        req = ListenerMatchRequest(
            id=uuid.uuid4(),
            member_id=user_id,
            request_state="queued",
            created_at=datetime.utcnow()
        )
        self.db.add(req)
        await self.db.commit()
        await self.db.refresh(req)

        return {
            "id": str(req.id),
            "member_id": req.member_id,
            "status": req.request_state,
            "created_at": req.created_at.isoformat()
        }

    async def list_conversations(self, user_id: str) -> list[dict]:
        MemberAlias = aliased(MemberProfile)
        stmt = (
            select(
                PeerConversation,
                ListenerProfile.user_id.label("listener_user_id"),
                MemberProfile.display_name.label("listener_name"),
                MemberAlias.display_name.label("member_name"),
            )
            .join(ListenerProfile, PeerConversation.listener_id == ListenerProfile.id)
            .outerjoin(MemberProfile, ListenerProfile.user_id == MemberProfile.user_id)
            .outerjoin(MemberAlias, PeerConversation.member_id == MemberAlias.user_id)
            .where(
                (PeerConversation.member_id == user_id) | (ListenerProfile.user_id == user_id) | (PeerConversation.closed_by_user_id == user_id)
            )
            .order_by(desc(PeerConversation.started_at))
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        result = []
        for conv, l_user_id, l_name, m_name in rows:
            display_listener = l_name or (l_user_id.replace("usr-demo-", "").replace("-", " ").title() if l_user_id else "Verified Peer Listener")
            display_member = m_name or (conv.member_id.replace("usr-demo-", "").replace("-", " ").title() if conv.member_id else "Member")
            result.append({
                "id": str(conv.id),
                "member_id": conv.member_id,
                "member_name": display_member,
                "listener_id": str(conv.listener_id),
                "listener_name": display_listener,
                "channel": conv.channel,
                "status": "completed" if conv.conversation_state == "closed" else ("active" if conv.conversation_state == "open" else conv.conversation_state),
                "started_at": conv.started_at.isoformat(),
                "ended_at": conv.ended_at.isoformat() if conv.ended_at else None,
                "note": "Peer reflection & support session"
            })
        return result

    async def book_peer_session(self, user_id: str, payload: BookSessionRequest) -> dict:
        p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
        if not p_res.scalar_one_or_none():
            new_principal = AppPrincipal(user_id=user_id, account_state="active")
            self.db.add(new_principal)
            await self.db.commit()

        listener = None
        if payload.listener_id:
            try:
                l_uuid = uuid.UUID(payload.listener_id)
                l_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.id == l_uuid))
                listener = l_res.scalar_one_or_none()
            except ValueError:
                pass

        if not listener:
            l_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.application_state == "approved").limit(1))
            listener = l_res.scalar_one_or_none()

        if not listener:
            demo_l_id = "usr-demo-listener-01"
            l_principal = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == demo_l_id))
            if not l_principal.scalar_one_or_none():
                self.db.add(AppPrincipal(user_id=demo_l_id, account_state="active"))
                await self.db.commit()
            
            listener = ListenerProfile(
                id=uuid.uuid4(),
                user_id=demo_l_id,
                application_state="approved",
                eligibility_state="eligible",
                capacity_limit=3
            )
            self.db.add(listener)
            await self.db.commit()
            await self.db.refresh(listener)

        match_req = ListenerMatchRequest(
            id=uuid.uuid4(),
            member_id=user_id,
            request_state="matched",
            created_at=datetime.utcnow()
        )
        self.db.add(match_req)
        await self.db.flush()

        match = ListenerMatch(
            id=uuid.uuid4(),
            request_id=match_req.id,
            listener_id=listener.id,
            match_state="accepted",
            offered_at=datetime.utcnow(),
            accepted_at=datetime.utcnow()
        )
        self.db.add(match)
        await self.db.flush()

        db_channel = "voice" if payload.channel in ["voice", "video"] else "text"

        conversation = PeerConversation(
            id=uuid.uuid4(),
            match_id=match.id,
            member_id=user_id,
            listener_id=listener.id,
            channel=db_channel,
            conversation_state="open",
            started_at=datetime.utcnow()
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)

        welcome_text = f"Hello! Session scheduled with {payload.listener_name or 'Peer Listener'}. Topic: {payload.note or 'General check-in'}."
        ct, kv = encrypt_content(welcome_text)
        msg = PeerMessage(
            id=uuid.uuid4(),
            conversation_id=conversation.id,
            sequence_no=1,
            sender_user_id=listener.user_id,
            content_ciphertext=ct,
            key_version=kv,
            delivery_state="delivered",
            sent_at=datetime.utcnow()
        )
        self.db.add(msg)
        await self.db.commit()

        return {
            "id": str(conversation.id),
            "date": conversation.started_at.isoformat(),
            "listenerName": payload.listener_name or "Aarav Sharma (Verified Peer Listener)",
            "channel": payload.channel,
            "status": "active",
            "note": payload.note or "Evening reflection & mindfulness check-in"
        }

    async def list_messages(self, conversation_id: str, user_id: str) -> list[dict]:
        stmt = select(PeerMessage).where(PeerMessage.conversation_id == uuid.UUID(conversation_id)).order_by(PeerMessage.sequence_no)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        return [
            {
                "id": str(m.id),
                "conversation_id": str(m.conversation_id),
                "sender_user_id": m.sender_user_id,
                "content": decrypt_content(m.content_ciphertext, m.key_version),
                "sent_at": m.sent_at.isoformat()
            }
            for m in items
        ]

    async def send_message(self, user_id: str, conversation_id: str, payload: PeerMessageCreate) -> dict:
        c_uuid = uuid.UUID(conversation_id)
        seq_q = await self.db.execute(select(func.coalesce(func.max(PeerMessage.sequence_no), 0)).where(PeerMessage.conversation_id == c_uuid))
        seq = (seq_q.scalar() or 0) + 1

        ct, kv = encrypt_content(payload.content)
        msg = PeerMessage(
            id=uuid.uuid4(),
            conversation_id=c_uuid,
            sequence_no=seq,
            sender_user_id=user_id,
            content_ciphertext=ct,
            key_version=kv,
            delivery_state="delivered",
            sent_at=datetime.utcnow()
        )
        self.db.add(msg)
        await self.db.commit()

        return {
            "id": str(msg.id),
            "conversation_id": str(msg.conversation_id),
            "content": payload.content,
            "sent_at": msg.sent_at.isoformat()
        }

    async def close_conversation(self, user_id: str, conversation_id: str) -> dict:
        c_uuid = None
        try:
            c_uuid = uuid.UUID(conversation_id)
        except (ValueError, AttributeError):
            c_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(conversation_id))

        stmt = select(PeerConversation).where(PeerConversation.id == c_uuid)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if conv:
            conv.conversation_state = "closed"
            conv.ended_at = datetime.utcnow()
            conv.closed_by_user_id = user_id
            await self.db.commit()

        return {"status": "success", "conversation_id": str(c_uuid), "state": "closed"}

    async def save_soap_note(self, user_id: str, conversation_id: str, payload: SoapNoteCreate) -> dict:
        c_uuid = None
        try:
            c_uuid = uuid.UUID(conversation_id)
        except (ValueError, AttributeError):
            c_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(conversation_id))

        stmt = select(PeerConversation).where(PeerConversation.id == c_uuid)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()

        if not conv:
            l_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
            listener = l_res.scalar_one_or_none()
            if not listener:
                p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
                if not p_res.scalar_one_or_none():
                    self.db.add(AppPrincipal(user_id=user_id, account_state="active"))
                    await self.db.flush()
                listener = ListenerProfile(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    application_state="approved",
                    eligibility_state="eligible",
                    capacity_limit=3
                )
                self.db.add(listener)
                await self.db.flush()

            member_uid = "usr-demo-member-01"
            m_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == member_uid))
            if not m_res.scalar_one_or_none():
                self.db.add(AppPrincipal(user_id=member_uid, account_state="active"))
                await self.db.flush()

            m_req = ListenerMatchRequest(
                id=uuid.uuid4(),
                member_id=member_uid,
                request_state="matched"
            )
            self.db.add(m_req)
            await self.db.flush()

            l_match = ListenerMatch(
                id=uuid.uuid4(),
                request_id=m_req.id,
                listener_id=listener.id,
                match_state="accepted"
            )
            self.db.add(l_match)
            await self.db.flush()

            conv = PeerConversation(
                id=c_uuid,
                match_id=l_match.id,
                member_id=member_uid,
                listener_id=listener.id,
                channel="voice",
                conversation_state="closed",
                started_at=datetime.utcnow() - timedelta(minutes=45),
                ended_at=datetime.utcnow(),
                closed_by_user_id=user_id
            )
            self.db.add(conv)
            await self.db.flush()
        else:
            conv.conversation_state = "closed"
            conv.ended_at = datetime.utcnow()
            conv.closed_by_user_id = user_id

        soap_content = f"[SOAP RECORD]\nS: {payload.subjective}\nO: {payload.objective}\nA: {payload.assessment}\nP: {payload.plan}"
        ct, kv = encrypt_content(soap_content)

        seq_q = await self.db.execute(select(func.coalesce(func.max(PeerMessage.sequence_no), 0)).where(PeerMessage.conversation_id == c_uuid))
        seq = (seq_q.scalar() or 0) + 1

        msg = PeerMessage(
            id=uuid.uuid4(),
            conversation_id=c_uuid,
            sequence_no=seq,
            sender_user_id=user_id,
            content_ciphertext=ct,
            key_version=kv,
            delivery_state="delivered",
            sent_at=datetime.utcnow()
        )
        self.db.add(msg)
        await self.db.commit()

        return {
            "status": "success",
            "conversation_id": str(c_uuid),
            "message": "SOAP record encrypted and saved to PostgreSQL",
            "saved_at": datetime.utcnow().isoformat()
        }

    async def update_listener_profile(self, user_id: str, payload: ListenerProfileUpdate) -> dict:
        p_res = await self.db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
        if not p_res.scalar_one_or_none():
            self.db.add(AppPrincipal(user_id=user_id, account_state="active"))
            await self.db.flush()

        prof_res = await self.db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            profile = ListenerProfile(
                id=uuid.uuid4(),
                user_id=user_id,
                application_state="approved",
                eligibility_state="eligible",
                capacity_limit=payload.capacity_limit or 3,
                profile_languages=payload.profile_languages or ["English", "Hindi"]
            )
            self.db.add(profile)
        else:
            if payload.capacity_limit is not None:
                profile.capacity_limit = payload.capacity_limit
            if payload.profile_languages is not None:
                profile.profile_languages = payload.profile_languages

        if payload.display_name:
            m_res = await self.db.execute(select(MemberProfile).where(MemberProfile.user_id == user_id))
            m_prof = m_res.scalar_one_or_none()
            if m_prof:
                m_prof.display_name = payload.display_name
            else:
                self.db.add(MemberProfile(user_id=user_id, display_name=payload.display_name))

        await self.db.commit()
        return {
            "status": "success",
            "message": "Listener profile updated successfully in PostgreSQL",
            "capacity_limit": profile.capacity_limit,
            "profile_languages": profile.profile_languages,
            "display_name": payload.display_name
        }


def get_peer_service(db: AsyncSession = Depends(get_db)) -> PeerService:
    return PeerService(db)
