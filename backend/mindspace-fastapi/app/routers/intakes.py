from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.core.database import get_db
from app.core.security import get_current_user_id, encrypt_content, decrypt_content
from app.models.intake import IntakeSession, IntakeResponse, SupportRecommendation
from app.schemas.intake import IntakeCreate, IntakeResponseCreate
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/v1/intakes", tags=["Intakes"])

@router.get("")
async def list_intakes(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(IntakeSession).where(IntakeSession.member_id == user_id).order_by(desc(IntakeSession.created_at))
    result = await db.execute(stmt)
    intakes = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "channel": i.channel,
            "status": i.status,
            "locale": i.locale,
            "started_at": i.started_at.isoformat(),
            "completed_at": i.completed_at.isoformat() if i.completed_at else None,
            "created_at": i.created_at.isoformat()
        }
        for i in intakes
    ]

@router.post("")
@router.post("/sessions")
async def create_intake(
    payload: IntakeCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Normalize channel to meet database check constraint: 'text' or 'voice'
    db_channel = "voice" if payload.channel in ["voice", "phone", "audio"] else "text"

    intake = IntakeSession(
        id=uuid.uuid4(),
        member_id=user_id,
        channel=db_channel,
        status="in_progress",
        locale=payload.locale,
        started_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(intake)
    await db.commit()
    await db.refresh(intake)

    return {
        "id": str(intake.id),
        "member_id": intake.member_id,
        "channel": intake.channel,
        "status": intake.status,
        "started_at": intake.started_at.isoformat()
    }

@router.post("/responses")
async def add_intake_response_direct(
    payload: dict,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    raw_id = payload.get("intake_id") or payload.get("session_id")
    if not raw_id:
        raise HTTPException(status_code=400, detail="Missing intake_id or session_id")
    i_uuid = uuid.UUID(raw_id)
    q_key = payload.get("question_id") or payload.get("question_key") or "general"
    resp_text = payload.get("response") or payload.get("response_text") or ""

    count_stmt = select(func.count(IntakeResponse.id)).where(IntakeResponse.intake_id == i_uuid)
    count_res = await db.execute(count_stmt)
    seq = (count_res.scalar() or 0) + 1

    ct, kv = encrypt_content(resp_text)
    resp = IntakeResponse(
        id=uuid.uuid4(),
        intake_id=i_uuid,
        sequence_no=seq,
        topic_code=q_key,
        response_state="answered",
        source_type="member",
        content_ciphertext=ct,
        key_version=kv,
        created_at=datetime.utcnow()
    )
    db.add(resp)
    await db.commit()
    return {"status": "success", "question_id": q_key, "sequence_no": seq}

@router.get("/{intake_id}")
async def get_intake(
    intake_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(IntakeSession).where(IntakeSession.id == uuid.UUID(intake_id), IntakeSession.member_id == user_id)
    res = await db.execute(stmt)
    intake = res.scalar_one_or_none()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake session not found")
    
    return {
        "id": str(intake.id),
        "channel": intake.channel,
        "status": intake.status,
        "started_at": intake.started_at.isoformat(),
        "completed_at": intake.completed_at.isoformat() if intake.completed_at else None
    }

@router.post("/{intake_id}/responses")
async def add_intake_response(
    intake_id: str,
    payload: IntakeResponseCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    i_uuid = uuid.UUID(intake_id)
    # Get current response count to compute sequence_no
    count_stmt = select(func.count(IntakeResponse.id)).where(IntakeResponse.intake_id == i_uuid)
    count_res = await db.execute(count_stmt)
    seq = (count_res.scalar() or 0) + 1

    ct, kv = encrypt_content(payload.response)
    resp = IntakeResponse(
        id=uuid.uuid4(),
        intake_id=i_uuid,
        sequence_no=seq,
        topic_code=payload.question_id,
        response_state="answered",
        source_type="member",
        content_ciphertext=ct,
        key_version=kv,
        created_at=datetime.utcnow()
    )
    db.add(resp)
    await db.commit()

    return {"status": "success", "question_id": payload.question_id, "sequence_no": seq}

@router.get("/{intake_id}/responses")
async def get_intake_responses(
    intake_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(IntakeResponse).where(IntakeResponse.intake_id == uuid.UUID(intake_id)).order_by(IntakeResponse.sequence_no)
    res = await db.execute(stmt)
    items = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "question_id": r.topic_code or f"q_{r.sequence_no}",
            "response": decrypt_content(r.content_ciphertext, r.key_version) if r.content_ciphertext else None,
            "created_at": r.created_at.isoformat()
        }
        for r in items
    ]
