from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MatchRequestCreate(BaseModel):
    support_topic: Optional[str] = None
    preferred_channel: str = "text"

class BookSessionRequest(BaseModel):
    listener_id: Optional[str] = None
    listener_name: Optional[str] = "Aarav Sharma"
    channel: str = "voice"  # "voice" | "video" | "chat"
    note: Optional[str] = "Evening reflection and mindfulness check-in"
    scheduled_slot: Optional[str] = None

class PeerMessageCreate(BaseModel):
    content: str

class PeerMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_user_id: str
    content: str
    sent_at: datetime

class PeerConversationResponse(BaseModel):
    id: str
    match_id: str
    member_id: str
    listener_id: str
    listener_name: Optional[str] = None
    channel: str
    conversation_state: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    note: Optional[str] = None
