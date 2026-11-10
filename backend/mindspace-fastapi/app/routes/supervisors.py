from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.supervisor import SupervisorDB, SupervisorStatsDB
from app.schemas.supervisor import (
    SupervisorResponse,
    SupervisorCreatedResponse,
    SupervisorCreateRequest,
    SupervisorUpdateRequest,
    SupervisorSearchRequest,
    SupervisorStatsResponse,
    SupervisorStatsUpdateRequest,
)

router = APIRouter(prefix="/api/v1/supervisors", tags=["supervisors"])


async def get_supervisor_or_404(supervisor_id: str, db: AsyncSession) -> SupervisorDB:
    """Helper to fetch supervisor by ID or raise 404"""
    stmt = select(SupervisorDB).where(SupervisorDB.id == supervisor_id).options(selectinload(SupervisorDB.stats))
    result = await db.execute(stmt)
    supervisor = result.scalar_one_or_none()
    if not supervisor:
        raise HTTPException(status_code=404, detail=f"Supervisor with ID {supervisor_id} not found")
    return supervisor


@router.get("/{id}", response_model=SupervisorResponse)
async def get_supervisor_by_id(id: str, db: AsyncSession = Depends(get_db)):
    """Fetch supervisor by ID with stats"""
    supervisor = await get_supervisor_or_404(id, db)
    return SupervisorResponse.model_validate(supervisor)


@router.get("/{id}/stats", response_model=SupervisorStatsResponse)
async def get_supervisor_stats(id: str, db: AsyncSession = Depends(get_db)):
    """Fetch supervisor statistics"""
    supervisor = await get_supervisor_or_404(id, db)
    if not supervisor.stats:
        raise HTTPException(status_code=404, detail=f"Stats not found for supervisor {id}")
    return SupervisorStatsResponse.model_validate(supervisor.stats)


@router.get("", response_model=List[SupervisorResponse])
async def list_supervisors(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all supervisors with pagination"""
    stmt = (
        select(SupervisorDB)
        .options(selectinload(SupervisorDB.stats))
        .limit(limit)
        .offset(offset)
        .order_by(SupervisorDB.created_at.desc())
    )
    result = await db.execute(stmt)
    supervisors = result.scalars().all()
    return [SupervisorResponse.model_validate(supervisor) for supervisor in supervisors]


@router.post("/search", response_model=List[SupervisorResponse])
async def search_supervisors(search: SupervisorSearchRequest, db: AsyncSession = Depends(get_db)):
    """Search supervisors with filters"""
    filters = []
    
    if search.email:
        filters.append(SupervisorDB.email.ilike(f"%{search.email}%"))
    if search.department:
        filters.append(SupervisorDB.department == search.department)
    if search.experience_level:
        filters.append(SupervisorDB.experience_level == search.experience_level)
    if search.is_active is not None:
        filters.append(SupervisorDB.is_active == search.is_active)

    stmt = (
        select(SupervisorDB)
        .options(selectinload(SupervisorDB.stats))
        .where(and_(*filters) if filters else True)
        .limit(search.limit)
        .offset(search.offset)
        .order_by(SupervisorDB.created_at.desc())
    )
    result = await db.execute(stmt)
    supervisors = result.scalars().all()
    return [SupervisorResponse.model_validate(supervisor) for supervisor in supervisors]


@router.post("", response_model=SupervisorCreatedResponse, status_code=201)
async def create_supervisor(supervisor: SupervisorCreateRequest, db: AsyncSession = Depends(get_db)):
    """Create a new supervisor"""
    # Check if user_id already exists
    stmt = select(SupervisorDB).where(SupervisorDB.user_id == supervisor.user_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Supervisor with user_id {supervisor.user_id} already exists")

    new_supervisor = SupervisorDB(
        id=str(uuid.uuid4()),
        user_id=supervisor.user_id,
        first_name=supervisor.first_name,
        last_name=supervisor.last_name,
        email=supervisor.email,
        phone=supervisor.phone,
        team_size=supervisor.team_size,
        performance_rating=supervisor.performance_rating,
        department=supervisor.department,
        experience_level=supervisor.experience_level,
        is_active=supervisor.is_active,
    )
    
    # Create associated stats record
    stats = SupervisorStatsDB(
        id=str(uuid.uuid4()),
        supervisor_id=new_supervisor.id,
        team_members=0,
        active_sessions=0,
        avg_quality_score=0.0,
        total_workload=0.0,
        team_productivity_percent=0.0,
    )
    
    db.add(new_supervisor)
    db.add(stats)
    await db.commit()
    await db.refresh(new_supervisor)
    
    return SupervisorCreatedResponse.model_validate(new_supervisor)


@router.post("/{id}", response_model=SupervisorResponse)
async def update_supervisor(id: str, update: SupervisorUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update supervisor information"""
    supervisor = await get_supervisor_or_404(id, db)
    
    # Update only provided fields
    if update.first_name is not None:
        supervisor.first_name = update.first_name
    if update.last_name is not None:
        supervisor.last_name = update.last_name
    if update.email is not None:
        supervisor.email = update.email
    if update.phone is not None:
        supervisor.phone = update.phone
    if update.team_size is not None:
        supervisor.team_size = update.team_size
    if update.performance_rating is not None:
        supervisor.performance_rating = update.performance_rating
    if update.department is not None:
        supervisor.department = update.department
    if update.experience_level is not None:
        supervisor.experience_level = update.experience_level
    if update.is_active is not None:
        supervisor.is_active = update.is_active
    
    supervisor.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(supervisor, ["stats"])
    
    return SupervisorResponse.model_validate(supervisor)


@router.post("/{id}/stats", response_model=SupervisorStatsResponse)
async def update_supervisor_stats(
    id: str,
    stats_update: SupervisorStatsUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update supervisor statistics"""
    supervisor = await get_supervisor_or_404(id, db)
    
    if not supervisor.stats:
        raise HTTPException(status_code=404, detail=f"Stats not found for supervisor {id}")
    
    stats = supervisor.stats
    
    # Update only provided fields
    if stats_update.team_members is not None:
        stats.team_members = stats_update.team_members
    if stats_update.active_sessions is not None:
        stats.active_sessions = stats_update.active_sessions
    if stats_update.avg_quality_score is not None:
        stats.avg_quality_score = stats_update.avg_quality_score
    if stats_update.total_workload is not None:
        stats.total_workload = stats_update.total_workload
    if stats_update.team_productivity_percent is not None:
        stats.team_productivity_percent = stats_update.team_productivity_percent
    
    stats.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(stats)
    
    return SupervisorStatsResponse.model_validate(stats)


@router.delete("/{id}", status_code=204)
async def delete_supervisor(id: str, db: AsyncSession = Depends(get_db)):
    """Delete a supervisor and associated stats"""
    supervisor = await get_supervisor_or_404(id, db)
    await db.delete(supervisor)
    await db.commit()
    return None


@router.get("/health", tags=["health"])
async def supervisor_health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint for supervisor module"""
    try:
        stmt = select(SupervisorDB).limit(1)
        await db.execute(stmt)
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "module": "supervisors",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")
