from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SupervisorStatsResponse(BaseModel):
    id: str
    supervisor_id: str
    team_members: int
    active_sessions: int
    avg_quality_score: float
    total_workload: float
    team_productivity_percent: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SupervisorResponse(BaseModel):
    id: str
    user_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    team_size: int
    performance_rating: float
    department: Optional[str]
    experience_level: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    stats: Optional[SupervisorStatsResponse] = None

    class Config:
        from_attributes = True


class SupervisorCreatedResponse(BaseModel):
    id: str
    user_id: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SupervisorCreateRequest(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    team_size: int = 0
    performance_rating: float = 0.0
    department: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: bool = True


class SupervisorUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    team_size: Optional[int] = None
    performance_rating: Optional[float] = None
    department: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: Optional[bool] = None


class SupervisorStatsUpdateRequest(BaseModel):
    team_members: Optional[int] = None
    active_sessions: Optional[int] = None
    avg_quality_score: Optional[float] = None
    total_workload: Optional[float] = None
    team_productivity_percent: Optional[float] = None


class SupervisorSearchRequest(BaseModel):
    email: Optional[str] = None
    department: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: Optional[bool] = None
    limit: int = 50
    offset: int = 0

    class Config:
        validate_default = True
