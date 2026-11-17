from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.core.security import get_current_user_id
from app.core.websocket_manager import manager
from app.schemas.peer import (
    MatchRequestCreate,
    BookSessionRequest,
    PeerMessageCreate,
    SoapNoteCreate,
    ListenerProfileUpdate,
    FeedbackCreate,
)
from app.services.peer_service import PeerService, get_peer_service
from typing import Dict, Any

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


# NOTE: /active must precede /{request_id} so "active" is not treated as a request ID path parameter
@router.get("/peer/match-requests/active")
async def list_active_match_requests(
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.list_active_match_requests(user_id)


@router.get("/peer/match-requests/{request_id}")
async def get_match_request_status(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.get_match_request_status(user_id, request_id)


@router.post("/peer/match-requests/{request_id}/cancel")
async def cancel_match_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.cancel_match_request(user_id, request_id)


@router.post("/peer/match-requests/{request_id}/accept")
@router.post("/listeners/me/offers/{request_id}/accept")
async def accept_match_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.accept_match_request(user_id, request_id)


@router.post("/peer/match-requests/{request_id}/decline")
@router.post("/listeners/me/offers/{request_id}/decline")
async def decline_match_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.decline_match_request(user_id, request_id)


@router.post("/listeners/me/toggle-active")
async def toggle_listener_active(
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.toggle_listener_active(user_id)


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


@router.post("/peer/conversations/{conversation_id}/feedback")
async def submit_feedback(
    conversation_id: str,
    payload: FeedbackCreate,
    user_id: str = Depends(get_current_user_id),
    service: PeerService = Depends(get_peer_service),
):
    return await service.submit_feedback(user_id, conversation_id, payload)


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


# WebSocket consultation channel
@router.websocket("/peer/ws/{conversation_id}")
async def websocket_peer_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    service: PeerService = Depends(get_peer_service),
):
    await manager.connect(conversation_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif msg_type in ("webrtc_signal", "offer", "answer", "candidate", "ice_candidate") or "signal" in data:
                signal = data.get("signal")
                if signal is None and msg_type in ("offer", "answer", "candidate", "ice_candidate"):
                    signal = data
                from_user = (
                    data.get("from_user_id")
                    or data.get("sender_id")
                    or data.get("sender_user_id")
                    or "usr-demo-peer"
                )
                await manager.broadcast(
                    str(conversation_id),
                    {
                        "type": "webrtc_signal",
                        "signal": signal,
                        "from_user_id": from_user,
                    },
                    exclude=websocket,
                )
            elif msg_type == "session_closed":
                from_user = (
                    data.get("from_user_id")
                    or data.get("sender_id")
                    or data.get("sender_user_id")
                    or "usr-demo-member-01"
                )
                await service.close_conversation(from_user, conversation_id)
            else:
                content = data.get("content") or data.get("text")
                sender_id = (
                    data.get("sender_id")
                    or data.get("sender_user_id")
                    or data.get("from_user_id")
                    or "usr-demo-member-01"
                )
                if content:
                    msg_payload = PeerMessageCreate(content=content)
                    await service.send_message(sender_id, conversation_id, msg_payload)
    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)
    except Exception:
        manager.disconnect(conversation_id, websocket)
