from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.schemas.peer import (
    MatchRequestCreate,
    BookSessionRequest,
    PeerMessageCreate,
    SoapNoteCreate,
    ListenerProfileUpdate,
)
from app.services.peer_service import PeerService, get_peer_service

router = APIRouter(prefix="/api/v1", tags=["Peer Support"])


@router.get("/peer/listeners")
async def list_available_listeners(
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_available_listeners()


@router.get("/peer/match-requests")
async def list_match_requests(
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_match_requests(user_id)


@router.post("/peer/match-requests")
async def create_match_request(
    payload: MatchRequestCreate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.create_match_request(user_id, payload)


@router.get("/peer/conversations")
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_conversations(user_id)


@router.post("/peer/conversations")
@router.post("/peer/book-session")
async def book_peer_session(
    payload: BookSessionRequest,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.book_peer_session(user_id, payload)


@router.get("/peer/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_messages(conversation_id, user_id)


@router.post("/peer/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    payload: PeerMessageCreate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.send_message(user_id, conversation_id, payload)


@router.put("/peer/conversations/{conversation_id}/close")
async def close_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.close_conversation(user_id, conversation_id)


@router.post("/peer/conversations/{conversation_id}/soap")
async def save_soap_note(
    conversation_id: str,
    payload: SoapNoteCreate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.save_soap_note(user_id, conversation_id, payload)


@router.put("/peer/listeners/me")
async def update_listener_profile(
    payload: ListenerProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.update_listener_profile(user_id, payload)
