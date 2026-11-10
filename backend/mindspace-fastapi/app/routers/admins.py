from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.admin import AdminDB, AdminStatsDB, AdminRoleEnum
from app.schemas.admin import (
    AdminResponse,
    AdminCreatedResponse,
    AdminCreateRequest,
    AdminUpdateRequest,
    AdminSearchRequest,
    AdminStatsResponse,
    AdminStatsUpdateRequest,
)

router = APIRouter(prefix="/api/v1/admins", tags=["admins"])


async def get_admin_or_404(admin_id: str, db: AsyncSession) -> AdminDB:
    """Helper to fetch admin by ID or raise 404"""
    stmt = select(AdminDB).where(AdminDB.id == admin_id).options(selectinload(AdminDB.stats))
    result = await db.execute(stmt)
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail=f"Admin with ID {admin_id} not found")
    return admin


@router.get("/{id}", response_model=AdminResponse)
async def get_admin_by_id(id: str, db: AsyncSession = Depends(get_db)):
    """Fetch admin by ID with stats"""
    admin = await get_admin_or_404(id, db)
    return AdminResponse.model_validate(admin)


@router.get("/{id}/stats", response_model=AdminStatsResponse)
async def get_admin_stats(id: str, db: AsyncSession = Depends(get_db)):
    """Fetch admin statistics"""
    admin = await get_admin_or_404(id, db)
    if not admin.stats:
        raise HTTPException(status_code=404, detail=f"Stats not found for admin {id}")
    return AdminStatsResponse.model_validate(admin.stats)


@router.get("", response_model=List[AdminResponse])
async def list_admins(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all admins with pagination"""
    stmt = (
        select(AdminDB)
        .options(selectinload(AdminDB.stats))
        .limit(limit)
        .offset(offset)
        .order_by(AdminDB.created_at.desc())
    )
    result = await db.execute(stmt)
    admins = result.scalars().all()
    return [AdminResponse.model_validate(admin) for admin in admins]


@router.post("/search", response_model=List[AdminResponse])
async def search_admins(search: AdminSearchRequest, db: AsyncSession = Depends(get_db)):
    """Search admins with filters"""
    filters = []
    
    if search.email:
        filters.append(AdminDB.email.ilike(f"%{search.email}%"))
    if search.department:
        filters.append(AdminDB.department == search.department)
    if search.role:
        filters.append(AdminDB.role == search.role)
    if search.is_active is not None:
        filters.append(AdminDB.is_active == search.is_active)

    stmt = (
        select(AdminDB)
        .options(selectinload(AdminDB.stats))
        .where(and_(*filters) if filters else True)
        .limit(search.limit)
        .offset(search.offset)
        .order_by(AdminDB.created_at.desc())
    )
    result = await db.execute(stmt)
    admins = result.scalars().all()
    return [AdminResponse.model_validate(admin) for admin in admins]


@router.post("", response_model=AdminCreatedResponse, status_code=201)
async def create_admin(admin: AdminCreateRequest, db: AsyncSession = Depends(get_db)):
    """Create a new admin"""
    # Check if user_id already exists
    stmt = select(AdminDB).where(AdminDB.user_id == admin.user_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Admin with user_id {admin.user_id} already exists")

    new_admin = AdminDB(
        id=str(uuid.uuid4()),
        user_id=admin.user_id,
        role=admin.role,
        permissions=admin.permissions,
        department=admin.department,
        email=admin.email,
        phone=admin.phone,
        is_active=admin.is_active,
    )
    
    # Create associated stats record
    stats = AdminStatsDB(
        id=str(uuid.uuid4()),
        admin_id=new_admin.id,
        total_users=0,
        active_listeners=0,
        pending_reports=0,
        system_health_percent=100.0,
        response_time_ms=0.0,
        avg_quality_score=0.0,
    )
    
    db.add(new_admin)
    db.add(stats)
    await db.commit()
    await db.refresh(new_admin)
    
    return AdminCreatedResponse.model_validate(new_admin)


@router.post("/{id}", response_model=AdminResponse)
async def update_admin(id: str, update: AdminUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update admin information"""
    admin = await get_admin_or_404(id, db)
    
    # Update only provided fields
    if update.role is not None:
        admin.role = update.role
    if update.permissions is not None:
        admin.permissions = update.permissions
    if update.department is not None:
        admin.department = update.department
    if update.email is not None:
        admin.email = update.email
    if update.phone is not None:
        admin.phone = update.phone
    if update.is_active is not None:
        admin.is_active = update.is_active
    
    admin.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(admin, ["stats"])
    
    return AdminResponse.model_validate(admin)


@router.post("/{id}/stats", response_model=AdminStatsResponse)
async def update_admin_stats(
    id: str,
    stats_update: AdminStatsUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update admin statistics"""
    admin = await get_admin_or_404(id, db)
    
    if not admin.stats:
        raise HTTPException(status_code=404, detail=f"Stats not found for admin {id}")
    
    stats = admin.stats
    
    # Update only provided fields
    if stats_update.total_users is not None:
        stats.total_users = stats_update.total_users
    if stats_update.active_listeners is not None:
        stats.active_listeners = stats_update.active_listeners
    if stats_update.pending_reports is not None:
        stats.pending_reports = stats_update.pending_reports
    if stats_update.system_health_percent is not None:
        stats.system_health_percent = stats_update.system_health_percent
    if stats_update.response_time_ms is not None:
        stats.response_time_ms = stats_update.response_time_ms
    if stats_update.avg_quality_score is not None:
        stats.avg_quality_score = stats_update.avg_quality_score
    
    stats.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(stats)
    
    return AdminStatsResponse.model_validate(stats)


@router.delete("/{id}", status_code=204)
async def delete_admin(id: str, db: AsyncSession = Depends(get_db)):
    """Delete an admin and associated stats"""
    admin = await get_admin_or_404(id, db)
    await db.delete(admin)
    await db.commit()
    return None


@router.get("/health", tags=["health"])
async def admin_health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint for admin module"""
    try:
        stmt = select(AdminDB).limit(1)
        await db.execute(stmt)
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "module": "admins",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")
