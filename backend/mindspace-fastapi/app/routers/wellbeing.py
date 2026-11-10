from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.core.security import get_current_user_id, encrypt_content, decrypt_content
from app.models.wellbeing import MoodEntry, JournalEntry, WellbeingGoal, GoalCheckin
from app.schemas.wellbeing import (
    MoodEntryCreate, MoodEntryResponse,
    JournalEntryCreate, JournalEntryResponse,
    GoalCreate, GoalResponse, GoalCheckinCreate
)
from datetime import datetime
from typing import List
import uuid

router = APIRouter(prefix="/api/v1/wellbeing", tags=["Wellbeing"])

# --- MOOD TRACKING ---

@router.get("/moods")
async def list_moods(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MoodEntry).where(MoodEntry.member_id == user_id).order_by(desc(MoodEntry.recorded_at)).limit(30)
    result = await db.execute(stmt)
    entries = result.scalars().all()
    
    return [
        {
            "id": str(m.id),
            "member_id": m.member_id,
            "mood_code": m.mood_code,
            "scale_code": m.scale_code,
            "scale_value": float(m.scale_value) if m.scale_value is not None else None,
            "note": decrypt_content(m.note_ciphertext, m.key_version) if m.note_ciphertext else None,
            "recorded_at": m.recorded_at.isoformat(),
            "created_at": m.created_at.isoformat()
        }
        for m in entries
    ]

@router.post("/moods")
async def create_mood(
    payload: MoodEntryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    ct, kv = (None, None)
    if payload.note:
        ct, kv = encrypt_content(payload.note)

    entry = MoodEntry(
        id=uuid.uuid4(),
        member_id=user_id,
        mood_code=payload.mood_code,
        scale_code=payload.scale_code,
        scale_value=payload.scale_value,
        note_ciphertext=ct,
        key_version=kv,
        recorded_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return {
        "id": str(entry.id),
        "member_id": entry.member_id,
        "mood_code": entry.mood_code,
        "scale_value": float(entry.scale_value) if entry.scale_value is not None else None,
        "note": payload.note,
        "recorded_at": entry.recorded_at.isoformat()
    }

# --- JOURNAL ENTRIES ---

@router.get("/journal")
@router.get("/journals")
async def list_journal_entries(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(JournalEntry).where(
        JournalEntry.member_id == user_id,
        JournalEntry.deleted_at.is_(None)
    ).order_by(desc(JournalEntry.created_at))
    result = await db.execute(stmt)
    entries = result.scalars().all()

    return [
        {
            "id": str(e.id),
            "member_id": e.member_id,
            "title": decrypt_content(e.title_ciphertext, e.key_version) if e.title_ciphertext else "Journal Entry",
            "body": decrypt_content(e.body_ciphertext, e.key_version),
            "visibility": e.visibility,
            "created_at": e.created_at.isoformat(),
            "updated_at": e.updated_at.isoformat()
        }
        for e in entries
    ]

@router.post("/journal")
@router.post("/journals")
async def create_journal_entry(
    payload: JournalEntryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    body_ct, body_kv = encrypt_content(payload.body)
    title_ct, title_kv = (None, body_kv)
    if payload.title:
        title_ct, title_kv = encrypt_content(payload.title)

    entry = JournalEntry(
        id=uuid.uuid4(),
        member_id=user_id,
        title_ciphertext=title_ct,
        body_ciphertext=body_ct,
        key_version=body_kv,
        visibility=payload.visibility,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return {
        "id": str(entry.id),
        "title": payload.title,
        "body": payload.body,
        "visibility": entry.visibility,
        "created_at": entry.created_at.isoformat()
    }

# --- GOALS & CHECK-INS ---

@router.get("/goals")
async def list_goals(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(WellbeingGoal).where(WellbeingGoal.member_id == user_id).order_by(desc(WellbeingGoal.created_at))
    result = await db.execute(stmt)
    goals = result.scalars().all()

    return [
        {
            "id": str(g.id),
            "member_id": g.member_id,
            "goal": decrypt_content(g.goal_ciphertext, g.key_version),
            "status": g.status,
            "target_date": g.target_date.isoformat() if g.target_date else None,
            "created_at": g.created_at.isoformat()
        }
        for g in goals
    ]

@router.post("/goals")
async def create_goal(
    payload: GoalCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    goal_ct, goal_kv = encrypt_content(payload.goal)
    entry = WellbeingGoal(
        id=uuid.uuid4(),
        member_id=user_id,
        goal_ciphertext=goal_ct,
        key_version=goal_kv,
        status="active",
        target_date=payload.target_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return {
        "id": str(entry.id),
        "goal": payload.goal,
        "status": entry.status,
        "target_date": entry.target_date.isoformat() if entry.target_date else None,
        "created_at": entry.created_at.isoformat()
    }

@router.post("/goals/{goal_id}/checkins")
async def add_goal_checkin(
    goal_id: str,
    payload: GoalCheckinCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    note_ct, note_kv = (None, None)
    if payload.note:
        note_ct, note_kv = encrypt_content(payload.note)

    checkin = GoalCheckin(
        id=uuid.uuid4(),
        goal_id=uuid.UUID(goal_id),
        status=payload.status,
        note_ciphertext=note_ct,
        key_version=note_kv,
        checkin_at=datetime.utcnow()
    )
    db.add(checkin)
    await db.commit()

    return {"status": "success", "goal_id": goal_id}

@router.put("/goals/{goal_id}/toggle")
async def toggle_goal_status(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(WellbeingGoal).where(WellbeingGoal.id == uuid.UUID(goal_id), WellbeingGoal.member_id == user_id)
    res = await db.execute(stmt)
    goal = res.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal.status = "completed" if goal.status == "active" else "active"
    goal.updated_at = datetime.utcnow()
    if goal.status == "completed":
        goal.closed_at = datetime.utcnow()
    else:
        goal.closed_at = None

    await db.commit()
    await db.refresh(goal)

    return {
        "id": str(goal.id),
        "status": goal.status,
        "goal": decrypt_content(goal.goal_ciphertext, goal.key_version)
    }

@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(WellbeingGoal).where(WellbeingGoal.id == uuid.UUID(goal_id), WellbeingGoal.member_id == user_id)
    res = await db.execute(stmt)
    goal = res.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    await db.delete(goal)
    await db.commit()
    return {"status": "deleted", "id": goal_id}

@router.get("/reflections")
async def list_reflections(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return []

