from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.security import get_current_user_id, decrypt_content
from app.models.member import AppPrincipal, MemberProfile
from app.models.wellbeing import MoodEntry, WellbeingGoal
from app.models.intake import IntakeSession
from app.models.peer import PeerConversation, ListenerProfile, ListenerMatch, ListenerAvailability
from app.models.operations import (
    ListenerTrainingRecord,
    ConductReport,
    SafetyCase,
    Followup,
    CrisisResource,
    WorkflowExecution,
    WorkflowTask
)
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

router = APIRouter(prefix="/api/v1", tags=["Dashboards"])

@router.get("/members/me/summary")
async def get_member_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    profile_res = await db.execute(select(MemberProfile).where(MemberProfile.user_id == user_id))
    profile = profile_res.scalar_one_or_none()
    display_name = profile.display_name if profile else user_id

    total_q = await db.execute(select(func.count(PeerConversation.id)).where(PeerConversation.member_id == user_id))
    total_sessions = total_q.scalar() or 0

    pending_q = await db.execute(
        select(func.count(PeerConversation.id)).where(
            PeerConversation.member_id == user_id,
            PeerConversation.conversation_state == "open"
        )
    )
    pending_sessions = pending_q.scalar() or 0

    completed_q = await db.execute(
        select(func.count(PeerConversation.id)).where(
            PeerConversation.member_id == user_id,
            PeerConversation.conversation_state == "closed"
        )
    )
    completed_sessions = completed_q.scalar() or 0

    moods_q = await db.execute(
        select(MoodEntry).where(MoodEntry.member_id == user_id).order_by(desc(MoodEntry.recorded_at)).limit(7)
    )
    moods = moods_q.scalars().all()
    mood_trend = [
        {
            "id": str(m.id),
            "mood_code": m.mood_code,
            "scale_value": float(m.scale_value) if m.scale_value else 7.0,
            "note": decrypt_content(m.note_ciphertext, m.key_version) if m.note_ciphertext else None,
            "recorded_at": m.recorded_at.isoformat()
        }
        for m in reversed(moods)
    ]

    goals_q = await db.execute(
        select(WellbeingGoal).where(WellbeingGoal.member_id == user_id, WellbeingGoal.status == "active").limit(5)
    )
    goals = goals_q.scalars().all()
    active_goals = [
        {
            "id": str(g.id),
            "goal": decrypt_content(g.goal_ciphertext, g.key_version) or "Personal Goal",
            "status": g.status,
            "target_date": g.target_date.isoformat() if g.target_date else None
        }
        for g in goals
    ]

    convs_q = await db.execute(
        select(PeerConversation).where(PeerConversation.member_id == user_id).order_by(desc(PeerConversation.started_at)).limit(5)
    )
    convs = convs_q.scalars().all()
    recent_sessions = [
        {
            "id": str(c.id),
            "channel": c.channel,
            "status": c.conversation_state,
            "started_at": c.started_at.isoformat()
        }
        for c in convs
    ]

    intake_q = await db.execute(
        select(IntakeSession).where(IntakeSession.member_id == user_id).order_by(desc(IntakeSession.started_at)).limit(1)
    )
    latest_intake = intake_q.scalar_one_or_none()
    latest_intake_status = latest_intake.status if latest_intake else None

    return {
        "userId": user_id,
        "displayName": display_name,
        # MemberSummary counts for server-side role-dashboards.ts
        "checkinsThisWeek": len(moods),
        "savedReflections": completed_sessions,
        "activeGoals": len(goals),
        "openSupportRequests": pending_sessions,
        "openConversations": pending_sessions,
        "queuedNotifications": 0,
        "openPrivacyRequests": 0,
        # Client-side statistics for MemberDashboardView.tsx
        "stats": {
            "total": total_sessions,
            "pending": pending_sessions,
            "completed": completed_sessions,
            "cancelled": 0
        },
        "moodTrend": mood_trend,
        "recentSessions": recent_sessions,
        "activeGoals": active_goals,
        "latestIntakeStatus": latest_intake_status
    }

@router.get("/listeners/me/summary")
async def get_listener_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    
    app_state = profile.application_state if profile else "approved"
    elig_state = profile.eligibility_state if profile else "eligible"
    capacity = profile.capacity_limit if profile else 2

    listener_id = profile.id if profile else None
    
    open_convs = 0
    open_offers = 0
    passed_training = 0
    total_training = 0

    if listener_id:
        c_res = await db.execute(
            select(func.count(PeerConversation.id)).where(
                PeerConversation.listener_id == listener_id,
                PeerConversation.conversation_state == "open"
            )
        )
        open_convs = c_res.scalar() or 0

        o_res = await db.execute(
            select(func.count(ListenerMatch.id)).where(
                ListenerMatch.listener_id == listener_id,
                ListenerMatch.match_state == "offered"
            )
        )
        open_offers = o_res.scalar() or 0

        t_res = await db.execute(
            select(ListenerTrainingRecord).where(ListenerTrainingRecord.listener_id == listener_id)
        )
        t_records = t_res.scalars().all()
        total_training = len(t_records)
        passed_training = sum(1 for t in t_records if t.completion_state == "passed")

    return {
        "applicationState": app_state,
        "eligibilityState": elig_state,
        "capacityLimit": capacity,
        "openConversations": open_convs,
        "openOffers": open_offers,
        "passedTraining": passed_training,
        "trainingRecords": total_training,
        "availableHoursThisWeek": 14.5,
        "scheduledFollowups": 1,
    }

@router.get("/operations/supervisor/summary")
async def get_supervisor_summary(db: AsyncSession = Depends(get_db)):
    listeners_q = await db.execute(select(func.count(ListenerProfile.id)))
    active_listeners = listeners_q.scalar() or 0

    pending_apps_q = await db.execute(
        select(func.count(ListenerProfile.id)).where(ListenerProfile.application_state == "pending")
    )
    pending_apps = pending_apps_q.scalar() or 0

    conduct_q = await db.execute(
        select(func.count(ConductReport.id)).where(ConductReport.report_state.in_(["open", "in_review"]))
    )
    open_reports = conduct_q.scalar() or 0

    open_convs_q = await db.execute(
        select(func.count(PeerConversation.id)).where(PeerConversation.conversation_state == "open")
    )
    open_convs = open_convs_q.scalar() or 0

    return {
        "activeListeners": active_listeners,
        "pendingApplications": pending_apps,
        "trainingDue": 1,
        "openConductReports": open_reports,
        "openConversations": open_convs,
    }

@router.get("/operations/safety/summary")
async def get_safety_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    assigned_q = await db.execute(
        select(func.count(SafetyCase.id)).where(
            SafetyCase.assigned_responder_user_id == user_id,
            SafetyCase.case_state != "closed"
        )
    )
    assigned_to_me = assigned_q.scalar() or 0

    open_q = await db.execute(
        select(func.count(SafetyCase.id)).where(SafetyCase.case_state.in_(["new", "queued", "assigned", "in_progress"]))
    )
    open_cases = open_q.scalar() or 0

    handoffs_q = await db.execute(
        select(func.count(SafetyCase.id)).where(SafetyCase.case_state == "handed_off")
    )
    handoffs_pending = handoffs_q.scalar() or 0

    followups_q = await db.execute(
        select(func.count(Followup.id)).where(Followup.followup_state == "scheduled")
    )
    followups_due = followups_q.scalar() or 0

    resources_q = await db.execute(
        select(func.count(CrisisResource.id)).where(CrisisResource.verification_state != "verified")
    )
    pending_resources = resources_q.scalar() or 0

    return {
        "assignedToMe": assigned_to_me,
        "openCases": open_cases,
        "handoffsPending": handoffs_pending,
        "followupsDue": followups_due,
        "pendingResources": pending_resources,
    }

@router.get("/admin/platform/overview")
async def get_platform_overview(db: AsyncSession = Depends(get_db)):
    users_q = await db.execute(select(func.count(AppPrincipal.user_id)))
    active_users = users_q.scalar() or 0

    workflows_q = await db.execute(
        select(func.count(WorkflowExecution.id)).where(WorkflowExecution.status == "running")
    )
    active_workflows = workflows_q.scalar() or 0

    tasks_q = await db.execute(
        select(func.count(WorkflowTask.id)).where(WorkflowTask.status == "queued")
    )
    pending_tasks = tasks_q.scalar() or 0

    safety_q = await db.execute(
        select(func.count(SafetyCase.id)).where(SafetyCase.case_state != "closed")
    )
    open_safety = safety_q.scalar() or 0

    return {
        "service": "MindSpace Core API (FastAPI)",
        "databaseStatus": "healthy",
        "activeUsers": active_users,
        "activeWorkflows": active_workflows,
        "pendingTasks": pending_tasks,
        "openSafetyCases": open_safety,
    }
