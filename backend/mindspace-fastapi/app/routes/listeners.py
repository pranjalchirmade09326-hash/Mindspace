"""
FastAPI Routes: Listener Module
Endpoints for listener profile and statistics management
Backend for MindSpace Listener Module
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# Pydantic Models (Request/Response)

class ListenerSpecializationInput(BaseModel):
    specialization: str

class ListenerProfileResponse(BaseModel):
    id: str
    user_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    specializations: List[str]
    license_number: str
    years_of_experience: int
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_active: bool
    verification_status: str  # 'pending', 'verified', 'rejected'
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ListenerStatsResponse(BaseModel):
    listener_id: str
    total_clients: int
    active_clients: int
    completed_sessions: int
    total_session_hours: float
    average_rating: float
    total_reviews: int
    response_time_minutes: int
    available_slots: int
    upcoming_appointments: int
    cancellation_rate: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AvailabilityResponse(BaseModel):
    available: bool
    available_slots: int
    next_available_slot: Optional[datetime] = None

class SearchListenersResponse(BaseModel):
    listeners: List[ListenerProfileResponse]
    total: int
    has_more: bool

# Database Models (SQLAlchemy)

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ARRAY, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class ListenerDB(Base):
    """Listener database model"""
    __tablename__ = "listeners"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone_number = Column(String(20), nullable=True)
    specializations = Column(ARRAY(String), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)
    years_of_experience = Column(Integer, nullable=False)
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    verification_status = Column(String(20), default="pending")  # pending, verified, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    stats = relationship("ListenerStatsDB", back_populates="listener", cascade="all, delete-orphan")

class ListenerStatsDB(Base):
    """Listener statistics database model"""
    __tablename__ = "listener_stats"

    id = Column(String(50), primary_key=True)
    listener_id = Column(String(50), ForeignKey("listeners.id"), unique=True, nullable=False)
    total_clients = Column(Integer, default=0)
    active_clients = Column(Integer, default=0)
    completed_sessions = Column(Integer, default=0)
    total_session_hours = Column(Float, default=0.0)
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    response_time_minutes = Column(Integer, default=0)
    available_slots = Column(Integer, default=0)
    upcoming_appointments = Column(Integer, default=0)
    cancellation_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    listener = relationship("ListenerDB", back_populates="stats")

# FastAPI Router

router = APIRouter(prefix="/api/v1/listeners", tags=["listeners"])

# Dependencies

async def get_db() -> Session:
    """Dependency for database session"""
    # In production, use your actual database session
    pass

# Routes

@router.get("/{listener_id}", response_model=ListenerProfileResponse)
async def get_listener_profile(
    listener_id: str,
    db: Session = Depends(get_db)
):
    """
    Get listener profile by ID
    
    - **listener_id**: Unique listener identifier
    
    Returns listener profile with all details
    """
    listener = db.query(ListenerDB).filter(ListenerDB.id == listener_id).first()
    
    if not listener:
        raise HTTPException(status_code=404, detail="Listener not found")
    
    return ListenerProfileResponse.from_orm(listener)

@router.get("/{listener_id}/stats", response_model=ListenerStatsResponse)
async def get_listener_stats(
    listener_id: str,
    db: Session = Depends(get_db)
):
    """
    Get listener statistics and metrics
    
    - **listener_id**: Unique listener identifier
    
    Returns performance metrics and statistics
    """
    listener = db.query(ListenerDB).filter(ListenerDB.id == listener_id).first()
    
    if not listener:
        raise HTTPException(status_code=404, detail="Listener not found")
    
    stats = db.query(ListenerStatsDB).filter(ListenerStatsDB.listener_id == listener_id).first()
    
    if not stats:
        raise HTTPException(status_code=404, detail="Statistics not found")
    
    return ListenerStatsResponse.from_orm(stats)

@router.get("/search", response_model=SearchListenersResponse)
async def search_listeners(
    specialization: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    verified_only: bool = Query(False),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Search listeners by criteria
    
    - **specialization**: Filter by specialization (e.g., "Therapy")
    - **min_rating**: Minimum average rating (0-5)
    - **verified_only**: Only return verified listeners
    - **limit**: Number of results (1-100)
    - **offset**: Pagination offset
    
    Returns matching listeners with pagination info
    """
    query = db.query(ListenerDB)
    
    if verified_only:
        query = query.filter(ListenerDB.verification_status == "verified")
    
    if specialization:
        query = query.filter(ListenerDB.specializations.contains([specialization]))
    
    if min_rating is not None:
        query = query.join(ListenerStatsDB).filter(ListenerStatsDB.average_rating >= min_rating)
    
    total = query.count()
    listeners = query.offset(offset).limit(limit).all()
    
    return SearchListenersResponse(
        listeners=[ListenerProfileResponse.from_orm(l) for l in listeners],
        total=total,
        has_more=offset + limit < total
    )

@router.get("/available", response_model=List[ListenerProfileResponse])
async def get_available_listeners(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get available listeners
    
    - **limit**: Maximum number of listeners to return
    
    Returns listeners with available appointment slots
    """
    listeners = db.query(ListenerDB).join(ListenerStatsDB).filter(
        ListenerDB.is_active == True,
        ListenerDB.verification_status == "verified",
        ListenerStatsDB.available_slots > 0
    ).limit(limit).all()
    
    return [ListenerProfileResponse.from_orm(l) for l in listeners]

@router.get("/{listener_id}/availability", response_model=AvailabilityResponse)
async def check_listener_availability(
    listener_id: str,
    db: Session = Depends(get_db)
):
    """
    Check listener availability
    
    - **listener_id**: Unique listener identifier
    
    Returns availability status and next available slot
    """
    listener = db.query(ListenerDB).filter(ListenerDB.id == listener_id).first()
    
    if not listener:
        raise HTTPException(status_code=404, detail="Listener not found")
    
    stats = db.query(ListenerStatsDB).filter(ListenerStatsDB.listener_id == listener_id).first()
    
    if not stats:
        raise HTTPException(status_code=404, detail="Statistics not found")
    
    available = listener.is_active and stats.available_slots > 0
    
    return AvailabilityResponse(
        available=available,
        available_slots=stats.available_slots,
        next_available_slot=None  # In production, fetch from availability calendar
    )

@router.post("/{listener_id}/stats", response_model=ListenerStatsResponse)
async def update_listener_stats(
    listener_id: str,
    stats_update: dict,
    db: Session = Depends(get_db)
):
    """
    Update listener statistics
    
    - **listener_id**: Unique listener identifier
    - **stats_update**: Updated statistics fields
    
    Returns updated statistics
    """
    listener = db.query(ListenerDB).filter(ListenerDB.id == listener_id).first()
    
    if not listener:
        raise HTTPException(status_code=404, detail="Listener not found")
    
    stats = db.query(ListenerStatsDB).filter(ListenerStatsDB.listener_id == listener_id).first()
    
    if not stats:
        raise HTTPException(status_code=404, detail="Statistics not found")
    
    # Update fields
    for key, value in stats_update.items():
        if hasattr(stats, key):
            setattr(stats, key, value)
    
    stats.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(stats)
    
    return ListenerStatsResponse.from_orm(stats)

# Health check endpoint

@router.get("/health", tags=["health"])
async def listener_health_check():
    """Health check for listener service"""
    return {
        "status": "healthy",
        "service": "listener",
        "timestamp": datetime.utcnow().isoformat()
    }

# Error handlers

@router.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return HTTPException(status_code=400, detail=str(exc))

# Include router in main FastAPI app
# app.include_router(router)
