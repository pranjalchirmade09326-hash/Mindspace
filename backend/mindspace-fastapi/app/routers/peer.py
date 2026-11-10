from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.core.database import get_db
from app.core.security import get_current_user_id, encrypt_content, decrypt_content
from app.models.peer import ListenerMatchRequest, ListenerMatch, PeerConversation, PeerMessage, ListenerProfile
from app.models.member import AppPrincipal, MemberProfile
from app.schemas.peer import MatchRequestCreate, BookSessionRequest, PeerMessageCreate
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/v1", tags=["Peer Support"])

@router.get("/peer/listeners")
async def list_available_listeners(
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ListenerProfile, MemberProfile.display_name)
        .outerjoin(MemberProfile, ListenerProfile.user_id == MemberProfile.user_id)
        .where(ListenerProfile.application_state == "approved")
    )
    res = await db.execute(stmt)
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

@router.get("/peer/match-requests")
async def list_match_requests(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ListenerMatchRequest).where(ListenerMatchRequest.member_id == user_id).order_by(desc(ListenerMatchRequest.created_at))
    res = await db.execute(stmt)
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

@router.post("/peer/match-requests")
async def create_match_request(
    payload: MatchRequestCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    req = ListenerMatchRequest(
        id=uuid.uuid4(),
        member_id=user_id,
        request_state="queued",
        created_at=datetime.utcnow()
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)

    return {
        "id": str(req.id),
        "member_id": req.member_id,
        "status": req.request_state,
        "created_at": req.created_at.isoformat()
    }

@router.get("/peer/conversations")
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(PeerConversation, ListenerProfile.user_id.label("listener_user_id"), MemberProfile.display_name.label("listener_name"))
        .join(ListenerProfile, PeerConversation.listener_id == ListenerProfile.id)
        .outerjoin(MemberProfile, ListenerProfile.user_id == MemberProfile.user_id)
        .where(
            (PeerConversation.member_id == user_id) | (PeerConversation.closed_by_user_id == user_id)
        )
        .order_by(desc(PeerConversation.started_at))
    )
    res = await db.execute(stmt)
    rows = res.all()
    result = []
    for conv, l_user_id, l_name in rows:
        display = l_name or (l_user_id.replace("usr-demo-", "").replace("-", " ").title() if l_user_id else "Verified Peer Listener")
        result.append({
            "id": str(conv.id),
            "member_id": conv.member_id,
            "listener_id": str(conv.listener_id),
            "listener_name": display,
            "channel": conv.channel,
            "status": "completed" if conv.conversation_state == "closed" else ("active" if conv.conversation_state == "open" else conv.conversation_state),
            "started_at": conv.started_at.isoformat(),
            "ended_at": conv.ended_at.isoformat() if conv.ended_at else None,
            "note": "Peer reflection & support session"
        })
    return result

@router.post("/peer/conversations")
@router.post("/peer/book-session")
async def book_peer_session(
    payload: BookSessionRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Ensure current member exists in app_principals
    p_res = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == user_id))
    if not p_res.scalar_one_or_none():
        new_principal = AppPrincipal(user_id=user_id, account_state="active")
        db.add(new_principal)
        await db.commit()

    # Find an eligible listener or fallback to demo listener
    listener = None
    if payload.listener_id:
        try:
            l_uuid = uuid.UUID(payload.listener_id)
            l_res = await db.execute(select(ListenerProfile).where(ListenerProfile.id == l_uuid))
            listener = l_res.scalar_one_or_none()
        except ValueError:
            pass

    if not listener:
        l_res = await db.execute(select(ListenerProfile).where(ListenerProfile.application_state == "approved").limit(1))
        listener = l_res.scalar_one_or_none()

    if not listener:
        # Create default demo listener if missing
        demo_l_id = "usr-demo-listener-01"
        l_principal = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == demo_l_id))
        if not l_principal.scalar_one_or_none():
            db.add(AppPrincipal(user_id=demo_l_id, account_state="active"))
            await db.commit()
        
        listener = ListenerProfile(
            id=uuid.uuid4(),
            user_id=demo_l_id,
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=3
        )
        db.add(listener)
        await db.commit()
        await db.refresh(listener)

    # 1. Create ListenerMatchRequest
    match_req = ListenerMatchRequest(
        id=uuid.uuid4(),
        member_id=user_id,
        request_state="matched",
        created_at=datetime.utcnow()
    )
    db.add(match_req)
    await db.flush()

    # 2. Create ListenerMatch
    match = ListenerMatch(
        id=uuid.uuid4(),
        request_id=match_req.id,
        listener_id=listener.id,
        match_state="accepted",
        offered_at=datetime.utcnow(),
        accepted_at=datetime.utcnow()
    )
    db.add(match)
    await db.flush()

    # DB channel check constraint: 'text' or 'voice'
    db_channel = "voice" if payload.channel in ["voice", "video"] else "text"

    # 3. Create PeerConversation
    conversation = PeerConversation(
        id=uuid.uuid4(),
        match_id=match.id,
        member_id=user_id,
        listener_id=listener.id,
        channel=db_channel,
        conversation_state="open",
        started_at=datetime.utcnow()
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    # Initial welcome message encrypted into PostgreSQL with sequence_no=1
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
    db.add(msg)
    await db.commit()

    return {
        "id": str(conversation.id),
        "date": conversation.started_at.isoformat(),
        "listenerName": payload.listener_name or "Aarav Sharma (Verified Peer Listener)",
        "channel": payload.channel,
        "status": "active",
        "note": payload.note or "Evening reflection & mindfulness check-in"
    }

@router.get("/peer/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PeerMessage).where(PeerMessage.conversation_id == uuid.UUID(conversation_id)).order_by(PeerMessage.sequence_no)
    res = await db.execute(stmt)
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

@router.post("/peer/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    payload: PeerMessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    c_uuid = uuid.UUID(conversation_id)
    seq_q = await db.execute(select(func.coalesce(func.max(PeerMessage.sequence_no), 0)).where(PeerMessage.conversation_id == c_uuid))
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
    db.add(msg)
    await db.commit()

    return {
        "id": str(msg.id),
        "conversation_id": str(msg.conversation_id),
        "content": payload.content,
        "sent_at": msg.sent_at.isoformat()
    }

@router.put("/peer/conversations/{conversation_id}/close")
async def close_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    c_uuid = uuid.UUID(conversation_id)
    stmt = select(PeerConversation).where(PeerConversation.id == c_uuid)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conv.conversation_state = "closed"
    conv.ended_at = datetime.utcnow()
    conv.closed_by_user_id = user_id
    await db.commit()

    return {"status": "success", "conversation_id": conversation_id, "state": "closed"}
