from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AdminRoleEnum(str, Enum):
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    MODERATOR = "moderator"


class AdminStatsResponse(BaseModel):
    id: str
    admin_id: str
    total_users: int
    active_listeners: int
    pending_reports: int
    system_health_percent: float
    response_time_ms: float
    avg_quality_score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminResponse(BaseModel):
    id: str
    user_id: str
    role: AdminRoleEnum
    permissions: List[str]
    department: Optional[str]
    email: str
    phone: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    stats: Optional[AdminStatsResponse] = None

    class Config:
        from_attributes = True


class AdminCreatedResponse(BaseModel):
    id: str
    user_id: str
    email: str
    role: AdminRoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminCreateRequest(BaseModel):
    user_id: str
    role: AdminRoleEnum = AdminRoleEnum.ADMIN
    permissions: List[str] = Field(default_factory=list)
    department: Optional[str] = None
    email: str
    phone: Optional[str] = None
    is_active: bool = True


class AdminUpdateRequest(BaseModel):
    role: Optional[AdminRoleEnum] = None
    permissions: Optional[List[str]] = None
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class AdminStatsUpdateRequest(BaseModel):
    total_users: Optional[int] = None
    active_listeners: Optional[int] = None
    pending_reports: Optional[int] = None
    system_health_percent: Optional[float] = None
    response_time_ms: Optional[float] = None
    avg_quality_score: Optional[float] = None


class AdminSearchRequest(BaseModel):
    email: Optional[str] = None
    department: Optional[str] = None
    role: Optional[AdminRoleEnum] = None
    is_active: Optional[bool] = None
    limit: int = 50
    offset: int = 0

    class Config:
        validate_default = True
