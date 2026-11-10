from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.safety import SafetyDB, SafetyStatsDB, SafetyStatusEnum
from app.schemas.safety import (
    SafetyResponse,
    SafetyCreatedResponse,
    SafetyCreateRequest,
    SafetyUpdateRequest,
    SafetySearchRequest,
    SafetyStatsResponse,
    SafetyStatsUpdateRequest,
)

router = APIRouter(prefix="/api/v1/safetys", tags=["safetys"])


async def get_safety_or_404(safety_id: str, db: AsyncSession) -> SafetyDB:
    """Helper to fetch safety officer by ID or raise 404"""
    stmt = select(SafetyDB).where(SafetyDB.id == safety_id).options(selectinload(SafetyDB.stats))
    result = await db.execute(stmt)
    safety = result.scalar_one_or_none()
    if not safety:
        raise HTTPException(status_code=404, detail=f"Safety officer with ID {safety_id} not found")
    return safety


@router.get("/{id}", response_model=SafetyResponse)
async def get_safety_by_id(id: str, db: AsyncSession = Depends(get_db)):
    """Fetch safety officer by ID with stats"""
    safety = await get_safety_or_404(id, db)
    return SafetyResponse.model_validate(safety)


@router.get("/{id}/stats", response_model=SafetyStatsResponse)
async def get_safety_stats(id: str, db: AsyncSession = Depends(get_db)):
    """Fetch safety officer statistics"""
    safety = await get_safety_or_404(id, db)
    if not safety.stats:
        raise HTTPException(status_code=404, detail=f"Stats not found for safety officer {id}")
    return SafetyStatsResponse.model_validate(safety.stats)


@router.get("", response_model=List[SafetyResponse])
async def list_safety_officers(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all safety officers with pagination"""
    stmt = (
        select(SafetyDB)
        .options(selectinload(SafetyDB.stats))
        .limit(limit)
        .offset(offset)
        .order_by(SafetyDB.created_at.desc())
    )
    result = await db.execute(stmt)
    safety_officers = result.scalars().all()
    return [SafetyResponse.model_validate(safety) for safety in safety_officers]


@router.post("/search", response_model=List[SafetyResponse])
async def search_safety_officers(search: SafetySearchRequest, db: AsyncSession = Depends(get_db)):
    """Search safety officers with filters"""
    filters = []
    
    if search.email:
        filters.append(SafetyDB.email.ilike(f"%{search.email}%"))
    if search.status:
        filters.append(SafetyDB.status == search.status)
    if search.needs_intervention is not None:
        filters.append(SafetyDB.needs_intervention == search.needs_intervention)
    if search.is_active is not None:
        filters.append(SafetyDB.is_active == search.is_active)

    stmt = (
        select(SafetyDB)
        .options(selectinload(SafetyDB.stats))
        .where(and_(*filters) if filters else True)
        .limit(search.limit)
        .offset(search.offset)
        .order_by(SafetyDB.created_at.desc())
    )
    result = await db.execute(stmt)
    safety_officers = result.scalars().all()
    return [SafetyResponse.model_validate(safety) for safety in safety_officers]


@router.post("", response_model=SafetyCreatedResponse, status_code=201)
async def create_safety_officer(safety: SafetyCreateRequest, db: AsyncSession = Depends(get_db)):
    """Create a new safety officer"""
    # Check if user_id already exists
    stmt = select(SafetyDB).where(SafetyDB.user_id == safety.user_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Safety officer with user_id {safety.user_id} already exists")

    new_safety = SafetyDB(
        id=str(uuid.uuid4()),
        user_id=safety.user_id,
        first_name=safety.first_name,
        last_name=safety.last_name,
        email=safety.email,
        phone=safety.phone,
        risk_score=safety.risk_score,
        status=safety.status,
        last_assessment_date=safety.last_assessment_date,
        needs_intervention=safety.needs_intervention,
        is_active=safety.is_active,
    )
    
    # Create associated stats record
    stats = SafetyStatsDB(
        id=str(uuid.uuid4()),
        safety_id=new_safety.id,
        high_risk_users=0,
        alerts_active=0,
        incidents_reported=0,
        avg_response_time_minutes=0.0,
        escalations_made=0,
        assessment_completion_rate=0.0,
        critical_cases=0,
    )
    
    db.add(new_safety)
    db.add(stats)
    await db.commit()
    await db.refresh(new_safety)
    
    return SafetyCreatedResponse.model_validate(new_safety)


@router.post("/{id}", response_model=SafetyResponse)
async def update_safety_officer(id: str, update: SafetyUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update safety officer information"""
    safety = await get_safety_or_404(id, db)
    
    # Update only provided fields
    if update.first_name is not None:
        safety.first_name = update.first_name
    if update.last_name is not None:
        safety.last_name = update.last_name
    if update.email is not None:
        safety.email = update.email
    if update.phone is not None:
        safety.phone = update.phone
    if update.risk_score is not None:
        safety.risk_score = update.risk_score
    if update.status is not None:
        safety.status = update.status
    if update.last_assessment_date is not None:
        safety.last_assessment_date = update.last_assessment_date
    if update.needs_intervention is not None:
        safety.needs_intervention = update.needs_intervention
    if update.is_active is not None:
        safety.is_active = update.is_active
    
    safety.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(safety, ["stats"])
    
    return SafetyResponse.model_validate(safety)


@router.post("/{id}/stats", response_model=SafetyStatsResponse)
async def update_safety_stats(
    id: str,
    stats_update: SafetyStatsUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update safety officer statistics"""
    safety = await get_safety_or_404(id, db)
    
    if not safety.stats:
        raise HTTPException(status_code=404, detail=f"Stats not found for safety officer {id}")
    
    stats = safety.stats
    
    # Update only provided fields
    if stats_update.high_risk_users is not None:
        stats.high_risk_users = stats_update.high_risk_users
    if stats_update.alerts_active is not None:
        stats.alerts_active = stats_update.alerts_active
    if stats_update.incidents_reported is not None:
        stats.incidents_reported = stats_update.incidents_reported
    if stats_update.avg_response_time_minutes is not None:
        stats.avg_response_time_minutes = stats_update.avg_response_time_minutes
    if stats_update.escalations_made is not None:
        stats.escalations_made = stats_update.escalations_made
    if stats_update.assessment_completion_rate is not None:
        stats.assessment_completion_rate = stats_update.assessment_completion_rate
    if stats_update.critical_cases is not None:
        stats.critical_cases = stats_update.critical_cases
    
    stats.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(stats)
    
    return SafetyStatsResponse.model_validate(stats)


@router.delete("/{id}", status_code=204)
async def delete_safety_officer(id: str, db: AsyncSession = Depends(get_db)):
    """Delete a safety officer and associated stats"""
    safety = await get_safety_or_404(id, db)
    await db.delete(safety)
    await db.commit()
    return None


@router.get("/health", tags=["health"])
async def safety_health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint for safety module"""
    try:
        stmt = select(SafetyDB).limit(1)
        await db.execute(stmt)
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "module": "safetys",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")
