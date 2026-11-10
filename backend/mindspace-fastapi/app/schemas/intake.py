from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IntakeCreate(BaseModel):
    channel: str = "text"
    locale: str = "en"

class IntakeResponseCreate(BaseModel):
    question_id: str
    response: str

class IntakeSessionResponse(BaseModel):
    id: str
    member_id: str
    channel: str
    status: str
    locale: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

