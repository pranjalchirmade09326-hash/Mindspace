from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class MatchRequestCreate(BaseModel):
    support_topic: Optional[str] = None
    preferred_channel: str = "chat"
    preferred_languages: Optional[List[str]] = Field(default_factory=lambda: ["en"])
    notes: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class MatchRequestResponse(BaseModel):
    id: str
    member_id: str
    request_state: str
    status: Optional[str] = None
    support_topic: Optional[str] = None
    preferred_channel: Optional[str] = "chat"
    preferred_languages: Optional[List[str]] = None
    notes: Optional[str] = None
    created_at: datetime
    conversation_id: Optional[str] = None
    listener: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class ActiveMatchRequestItem(BaseModel):
    id: str
    member_id: str
    member_name: Optional[str] = None
    support_topic: Optional[str] = None
    preferred_channel: str = "chat"
    created_at: datetime
    waiting_minutes: int = 0
    urgency: Optional[str] = "routine"

class OfferActionResponse(BaseModel):
    status: str
    match_id: Optional[str] = None
    conversation_id: Optional[str] = None
    channel: Optional[str] = None
    reassigned: Optional[bool] = None

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None
    post_mood_score: Optional[float] = None
    post_mood_label: Optional[str] = None
    sync_to_journal: bool = False

class FeedbackResponse(BaseModel):
    status: str = "success"
    feedback_id: str

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

class SoapNoteCreate(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str

class ListenerProfileUpdate(BaseModel):
    capacity_limit: Optional[int] = None
    profile_languages: Optional[List[str]] = None
    display_name: Optional[str] = None
    active_now: Optional[bool] = None
