from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.member import AppPrincipal, MemberProfile, MemberPreference, RoleAssignment, ConsentRecord
from app.schemas.member import MemberProfileUpdate, MemberPreferencesUpdate
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/v1", tags=["Member"])

@router.post("/members/me/provision")
async def provision_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Ensure AppPrincipal exists
    p_stmt = select(AppPrincipal).where(AppPrincipal.user_id == user_id)
    p_res = await db.execute(p_stmt)
    principal = p_res.scalar_one_or_none()
    if not principal:
        principal = AppPrincipal(user_id=user_id, account_state="active")
        db.add(principal)
        await db.commit()

    # Ensure MemberProfile exists
    prof_stmt = select(MemberProfile).where(MemberProfile.user_id == user_id)
    prof_res = await db.execute(prof_stmt)
    profile = prof_res.scalar_one_or_none()
    if not profile:
        profile = MemberProfile(
            user_id=user_id,
            display_name=user_id.split("@")[0].title() if "@" in user_id else user_id.replace("usr-", "").replace("-", " ").title(),
            eligibility_state="eligible",
            profile_state="active"
        )
        db.add(profile)
        await db.commit()

    # Ensure MemberPreference exists
    pref_stmt = select(MemberPreference).where(MemberPreference.user_id == user_id)
    pref_res = await db.execute(pref_stmt)
    pref = pref_res.scalar_one_or_none()
    if not pref:
        pref = MemberPreference(
            user_id=user_id,
            locale="en",
            timezone="UTC",
            preferred_languages=["en"],
            support_preferences={}
        )
        db.add(pref)
        await db.commit()

    return {
        "status": "provisioned",
        "userId": user_id,
        "displayName": profile.display_name if profile else user_id
    }

@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MemberProfile).where(MemberProfile.user_id == user_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    
    # Roles
    roles_q = await db.execute(
        select(RoleAssignment.role_code).where(
            RoleAssignment.user_id == user_id,
            RoleAssignment.assignment_state == "active"
        )
    )
    roles = [r[0] for r in roles_q.fetchall()] or ["member"]

    display_name = profile.display_name if profile else (user_id.split("@")[0].title() if "@" in user_id else user_id.replace("usr-", "").replace("-", " ").title())

    return {
        "userId": user_id,
        "displayName": display_name,
        "activeRoles": roles
    }

@router.get("/members/me/profile")
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MemberProfile).where(MemberProfile.user_id == user_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    display_name = profile.display_name if profile else (user_id.split("@")[0].title() if "@" in user_id else user_id)
    if not profile:
        return {
            "userId": user_id,
            "displayName": display_name,
            "eligibilityState": "eligible",
            "profileState": "active"
        }
    return {
        "userId": profile.user_id,
        "displayName": profile.display_name,
        "eligibilityState": profile.eligibility_state,
        "profileState": profile.profile_state,
        "createdAt": profile.created_at.isoformat()
    }

@router.put("/members/me/profile")
async def update_profile(
    payload: MemberProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MemberProfile).where(MemberProfile.user_id == user_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        profile = MemberProfile(
            user_id=user_id,
            display_name=payload.display_name,
            eligibility_state="eligible",
            profile_state="active"
        )
        db.add(profile)
    else:
        profile.display_name = payload.display_name
        profile.updated_at = datetime.utcnow()
    
    await db.commit()
    return {"status": "success", "displayName": profile.display_name}

@router.get("/members/me/preferences")
async def get_preferences(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MemberPreference).where(MemberPreference.user_id == user_id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()
    if not pref:
        return {
            "locale": "en",
            "timezone": "UTC",
            "preferredLanguages": ["en"],
            "supportPreferences": {}
        }
    return {
        "locale": pref.locale,
        "timezone": pref.timezone,
        "preferredLanguages": pref.preferred_languages,
        "supportPreferences": pref.support_preferences
    }

@router.put("/members/me/preferences")
async def update_preferences(
    payload: MemberPreferencesUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MemberPreference).where(MemberPreference.user_id == user_id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()
    if not pref:
        pref = MemberPreference(
            user_id=user_id,
            locale=payload.locale or "en",
            timezone=payload.timezone or "UTC",
            preferred_languages=payload.preferred_languages or ["en"],
            support_preferences=payload.support_preferences or {}
        )
        db.add(pref)
    else:
        if payload.locale:
            pref.locale = payload.locale
        if payload.timezone:
            pref.timezone = payload.timezone
        if payload.preferred_languages:
            pref.preferred_languages = payload.preferred_languages
        if payload.support_preferences:
            pref.support_preferences = payload.support_preferences
        pref.updated_at = datetime.utcnow()

    await db.commit()
    return {"status": "success"}

@router.get("/consents")
async def list_consents(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ConsentRecord).where(ConsentRecord.user_id == user_id)
    res = await db.execute(stmt)
    consents = res.scalars().all()
    return [
        {
            "id": str(c.id),
            "purposeCode": c.purpose_code,
            "consentState": c.consent_state,
            "capturedAt": c.captured_at.isoformat()
        }
        for c in consents
    ]

@router.post("/consents")
async def create_consent(
    payload: dict,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    consent_id = str(uuid.uuid4())
    record = ConsentRecord(
        id=consent_id,
        user_id=user_id,
        purpose_code=payload.get("purposeCode", "intake"),
        recipient_user_id=payload.get("recipientUserId"),
        recipient_scope=payload.get("recipientScope", "mindspace"),
        data_scope=payload.get("dataScope", {}),
        policy_version=payload.get("policyVersion", "v1"),
        consent_state=payload.get("consentState", "granted"),
        captured_by="member",
        captured_at=datetime.utcnow()
    )
    db.add(record)
    await db.commit()
    return {
        "id": consent_id,
        "purposeCode": record.purpose_code,
        "consentState": record.consent_state,
        "capturedAt": record.captured_at.isoformat()
    }

@router.get("/notifications")
async def list_notifications(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return [
        {
            "id": "notif-1",
            "notificationType": "peer_session_reminder",
            "channel": "in_app",
            "deliveryState": "delivered",
            "scheduledAt": datetime.utcnow().isoformat(),
            "sentAt": datetime.utcnow().isoformat()
        }
    ]

@router.get("/followups")
async def list_followups(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return []
