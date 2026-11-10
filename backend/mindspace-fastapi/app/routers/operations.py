from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update, and_, or_
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.member import AppPrincipal, MemberProfile, RoleAssignment, ConsentRecord
from app.models.peer import ListenerProfile, ListenerAvailability, ListenerMatchRequest, ListenerMatch, PeerConversation
from app.models.operations import (
    PrivacyRequest,
    AuditEvent,
    ListenerTrainingRecord,
    ListenerSupervisorAssignment,
    ConductReport,
    ListenerFeedback,
    SafetyCase,
    SafetyCaseAction,
    CrisisResource,
    Followup,
    Notification,
    SelfHelpContent,
    WorkflowDefinition,
    WorkflowExecution,
    WorkflowTask,
    OutboxEvent,
)
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import uuid

router = APIRouter(prefix="/api/v1", tags=["Operations & Staff Workspaces"])

# ─── LISTENER SELF-SERVICE ───────────────────────────────────────────────────

@router.get("/listeners/me/profile")
async def get_listener_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ListenerProfile).where(ListenerProfile.user_id == user_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        # Default auto-provision for dev
        profile = ListenerProfile(
            user_id=user_id,
            application_state="approved",
            eligibility_state="eligible",
            capacity_limit=2,
            profile_languages=["en", "hi"],
            approved_at=datetime.now(timezone.utc),
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return {
        "id": str(profile.id),
        "userId": profile.user_id,
        "applicationState": profile.application_state,
        "eligibilityState": profile.eligibility_state,
        "approvedAt": profile.approved_at.isoformat() if profile.approved_at else None,
        "eligibilityExpiresAt": profile.eligibility_expires_at.isoformat() if profile.eligibility_expires_at else None,
        "capacityLimit": profile.capacity_limit,
        "profileLanguages": getattr(profile, "profile_languages", ["en"]),
        "createdAt": profile.created_at.isoformat(),
        "updatedAt": profile.updated_at.isoformat(),
    }

@router.post("/listeners/me/profile")
async def update_listener_profile(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ListenerProfile).where(ListenerProfile.user_id == user_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        profile = ListenerProfile(user_id=user_id)
        db.add(profile)

    if "capacityLimit" in payload:
        profile.capacity_limit = payload["capacityLimit"]
    if "profileLanguages" in payload:
        profile.profile_languages = payload["profileLanguages"]
    
    await db.commit()
    await db.refresh(profile)
    return {"status": "success", "profileId": str(profile.id)}

@router.get("/listeners/me/training")
async def get_listener_training(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        return []
    
    stmt = select(ListenerTrainingRecord).where(
        ListenerTrainingRecord.listener_id == profile.id
    ).order_by(desc(ListenerTrainingRecord.completed_at))
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "listenerId": str(r.listener_id),
            "moduleCode": r.module_code,
            "moduleVersion": r.module_version,
            "completionState": r.completion_state,
            "completedAt": r.completed_at.isoformat() if r.completed_at else None,
            "expiresAt": r.expires_at.isoformat() if r.expires_at else None,
            "reviewedByUserId": r.reviewed_by_user_id,
        }
        for r in records
    ]

@router.get("/listeners/me/offers")
async def get_listener_offers(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        return []

    stmt = select(ListenerMatch).where(
        ListenerMatch.listener_id == profile.id,
        ListenerMatch.match_state == "offered"
    ).order_by(desc(ListenerMatch.offered_at))
    res = await db.execute(stmt)
    matches = res.scalars().all()
    
    offers = []
    for m in matches:
        req_res = await db.execute(select(ListenerMatchRequest).where(ListenerMatchRequest.id == m.request_id))
        req = req_res.scalar_one_or_none()
        offers.append({
            "id": str(m.id),
            "requestId": str(m.request_id),
            "listenerId": str(m.listener_id),
            "matchState": m.match_state,
            "offeredAt": m.offered_at.isoformat(),
            "acceptedAt": m.accepted_at.isoformat() if m.accepted_at else None,
            "request": {
                "id": str(req.id) if req else str(m.request_id),
                "memberId": req.member_id if req else "anonymous",
                "requestState": req.request_state if req else "queued",
                "createdAt": req.created_at.isoformat() if req else m.offered_at.isoformat()
            }
        })
    return offers

@router.get("/listeners/me/availability")
async def get_listener_availability(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        return []

    stmt = select(ListenerAvailability).where(
        ListenerAvailability.listener_id == profile.id
    ).order_by(ListenerAvailability.starts_at)
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "listenerId": str(r.listener_id),
            "startsAt": r.starts_at.isoformat(),
            "endsAt": r.ends_at.isoformat(),
            "availabilityState": r.availability_state,
            "timezone": r.timezone,
        }
        for r in records
    ]

@router.post("/listeners/me/availability")
async def add_listener_availability(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(ListenerProfile).where(ListenerProfile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Listener profile not found.")

    starts_at = datetime.fromisoformat(payload["startsAt"].replace("Z", "+00:00"))
    ends_at = datetime.fromisoformat(payload["endsAt"].replace("Z", "+00:00"))
    avail = ListenerAvailability(
        listener_id=profile.id,
        starts_at=starts_at,
        ends_at=ends_at,
        availability_state=payload.get("state", "available"),
        timezone=payload.get("timezone", "UTC"),
    )
    db.add(avail)
    await db.commit()
    await db.refresh(avail)
    return {"status": "created", "id": str(avail.id)}

# ─── SUPERVISOR OPERATIONS ──────────────────────────────────────────────────

@router.get("/operations/supervisor/listeners")
async def get_supervisor_listeners(db: AsyncSession = Depends(get_db)):
    stmt = select(ListenerProfile).order_by(desc(ListenerProfile.created_at)).limit(100)
    res = await db.execute(stmt)
    profiles = res.scalars().all()
    
    results = []
    for p in profiles:
        # Check active conversations
        conv_cnt_res = await db.execute(
            select(func.count(PeerConversation.id)).where(
                PeerConversation.listener_id == p.id,
                PeerConversation.conversation_state == "open"
            )
        )
        open_convs = conv_cnt_res.scalar() or 0

        # Check latest training
        train_res = await db.execute(
            select(ListenerTrainingRecord).where(
                ListenerTrainingRecord.listener_id == p.id
            ).order_by(desc(ListenerTrainingRecord.completed_at)).limit(1)
        )
        latest_train = train_res.scalar_one_or_none()

        # Check member profile display name
        mp_res = await db.execute(select(MemberProfile).where(MemberProfile.user_id == p.user_id))
        mp = mp_res.scalar_one_or_none()

        results.append({
            "listenerProfileId": str(p.id),
            "userId": p.user_id,
            "displayName": mp.display_name if mp else p.user_id,
            "applicationState": p.application_state,
            "eligibilityState": p.eligibility_state,
            "eligibilityExpiresAt": p.eligibility_expires_at.isoformat() if p.eligibility_expires_at else None,
            "capacityLimit": p.capacity_limit,
            "profileLanguages": getattr(p, "profile_languages", ["en"]),
            "approvedAt": p.approved_at.isoformat() if p.approved_at else None,
            "openConversations": open_convs,
            "latestTraining": {
                "id": str(latest_train.id),
                "moduleCode": latest_train.module_code,
                "completionState": latest_train.completion_state,
                "completedAt": latest_train.completed_at.isoformat() if latest_train.completed_at else None
            } if latest_train else None,
            "supervisorUserId": None
        })
    return results

@router.get("/operations/supervisor/training-records")
async def get_supervisor_training_records(db: AsyncSession = Depends(get_db)):
    stmt = select(ListenerTrainingRecord).order_by(desc(ListenerTrainingRecord.completed_at)).limit(100)
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "listenerId": str(r.listener_id),
            "moduleCode": r.module_code,
            "moduleVersion": r.module_version,
            "completionState": r.completion_state,
            "completedAt": r.completed_at.isoformat() if r.completed_at else None,
            "expiresAt": r.expires_at.isoformat() if r.expires_at else None,
            "reviewedByUserId": r.reviewed_by_user_id
        }
        for r in records
    ]

@router.get("/operations/supervisor/conduct-reports")
async def get_supervisor_conduct_reports(db: AsyncSession = Depends(get_db)):
    stmt = select(ConductReport).order_by(desc(ConductReport.createdAt)).limit(100)
    res = await db.execute(stmt)
    reports = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "conversationId": str(r.conversation_id),
            "reporterUserId": r.reporter_user_id,
            "reportedUserId": r.reported_user_id,
            "categoryCode": r.category_code,
            "reportState": r.report_state,
            "assignedToUserId": r.assigned_to_user_id,
            "createdAt": r.createdAt.isoformat(),
            "resolvedAt": r.resolvedAt.isoformat() if r.resolvedAt else None,
        }
        for r in reports
    ]

@router.patch("/operations/supervisor/conduct-reports/{report_id}")
async def update_conduct_report(
    report_id: str,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    report_uuid = uuid.UUID(report_id)
    stmt = select(ConductReport).where(ConductReport.id == report_uuid)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Conduct report not found.")
    
    if "reportState" in payload:
        report.report_state = payload["reportState"]
    if "assignedToUserId" in payload:
        report.assigned_to_user_id = payload["assignedToUserId"]
    if payload.get("reportState") == "resolved":
        report.resolvedAt = datetime.now(timezone.utc)

    await db.commit()
    return {"status": "updated", "id": report_id}

@router.get("/operations/supervisor/assignments")
async def get_supervisor_assignments(db: AsyncSession = Depends(get_db)):
    stmt = select(ListenerSupervisorAssignment).where(
        ListenerSupervisorAssignment.assignment_state == "active"
    ).order_by(desc(ListenerSupervisorAssignment.assigned_at))
    res = await db.execute(stmt)
    assignments = res.scalars().all()
    return [
        {
            "id": str(a.id),
            "listenerId": str(a.listener_id),
            "supervisorUserId": a.supervisor_user_id,
            "assignmentState": a.assignment_state,
            "assignedByUserId": a.assigned_by_user_id,
            "assignedAt": a.assigned_at.isoformat(),
            "endedAt": a.ended_at.isoformat() if a.ended_at else None,
            "reasonCode": a.reason_code,
        }
        for a in assignments
    ]

@router.post("/operations/supervisor/assignments")
async def create_supervisor_assignment(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    assignment = ListenerSupervisorAssignment(
        listener_id=uuid.UUID(payload["listenerId"]),
        supervisor_user_id=payload["supervisorUserId"],
        assigned_by_user_id=user_id,
        reason_code=payload.get("reasonCode", "onboarding_supervision")
    )
    db.add(assignment)
    await db.commit()
    return {"status": "assigned", "id": str(assignment.id)}

# ─── SAFETY & CRISIS OPERATIONS ─────────────────────────────────────────────

@router.get("/safety/resources")
async def get_safety_resources(
    regionCode: str = Query("IN"),
    locale: str = Query("en"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CrisisResource).where(
        CrisisResource.region_code == regionCode,
        CrisisResource.locale == locale
    ).order_by(desc(CrisisResource.last_verified_at))
    res = await db.execute(stmt)
    resources = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "regionCode": r.region_code,
            "locale": r.locale,
            "resourceType": r.resource_type,
            "displayName": r.display_name,
            "contactDetails": r.contact_details,
            "sourceUrl": r.source_url,
            "verificationState": r.verification_state,
            "lastVerifiedAt": r.last_verified_at.isoformat() if r.last_verified_at else None,
            "effectiveFrom": r.effective_from.isoformat() if r.effective_from else None,
            "effectiveTo": r.effective_to.isoformat() if r.effective_to else None,
        }
        for r in resources
    ]

@router.get("/operations/safety/cases")
async def get_safety_cases(db: AsyncSession = Depends(get_db)):
    stmt = select(SafetyCase).order_by(desc(SafetyCase.created_at)).limit(100)
    res = await db.execute(stmt)
    cases = res.scalars().all()
    return [
        {
            "id": str(c.id),
            "memberId": c.member_id,
            "sourceType": c.source_type,
            "sourceRecordId": str(c.source_record_id) if c.source_record_id else None,
            "triggerCode": c.trigger_code,
            "policyVersion": c.policy_version,
            "caseState": c.case_state,
            "priorityCode": c.priority_code,
            "jurisdiction": c.jurisdiction,
            "assignedResponderUserId": c.assigned_responder_user_id,
            "createdAt": c.created_at.isoformat(),
            "acknowledgedAt": c.acknowledged_at.isoformat() if c.acknowledged_at else None,
            "closedAt": c.closed_at.isoformat() if c.closed_at else None,
            "resolutionCode": c.resolution_code,
        }
        for c in cases
    ]

@router.post("/operations/safety/cases")
async def create_safety_case(
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    sc = SafetyCase(
        member_id=payload.get("memberId"),
        source_type=payload.get("sourceType", "intake_screener"),
        trigger_code=payload.get("triggerCode", "high_distress_alert"),
        policy_version=payload.get("policyVersion", "v1.0"),
        case_state="new",
        priority_code=payload.get("priorityCode", "p1_urgent"),
        jurisdiction=payload.get("jurisdiction", "IN")
    )
    db.add(sc)
    await db.commit()
    await db.refresh(sc)
    return {"status": "created", "id": str(sc.id)}

@router.get("/operations/safety/cases/{case_id}/actions")
async def get_safety_case_actions(case_id: str, db: AsyncSession = Depends(get_db)):
    case_uuid = uuid.UUID(case_id)
    stmt = select(SafetyCaseAction).where(SafetyCaseAction.case_id == case_uuid).order_by(SafetyCaseAction.occurred_at)
    res = await db.execute(stmt)
    actions = res.scalars().all()
    return [
        {
            "id": str(a.id),
            "caseId": str(a.case_id),
            "actorUserId": a.actor_user_id,
            "actionType": a.action_type,
            "actionState": a.action_state,
            "resourceId": str(a.resource_id) if a.resource_id else None,
            "occurredAt": a.occurred_at.isoformat(),
        }
        for a in actions
    ]

@router.get("/operations/safety/followups")
async def get_safety_followups(db: AsyncSession = Depends(get_db)):
    stmt = select(Followup).order_by(Followup.scheduled_at).limit(100)
    res = await db.execute(stmt)
    followups = res.scalars().all()
    return [
        {
            "id": str(f.id),
            "memberId": f.member_id,
            "sourceType": f.source_type,
            "sourceRecordId": str(f.source_record_id) if f.source_record_id else None,
            "scheduledAt": f.scheduled_at.isoformat(),
            "followupState": f.followup_state,
            "createdAt": f.created_at.isoformat(),
            "completedAt": f.completed_at.isoformat() if f.completed_at else None,
        }
        for f in followups
    ]

# ─── PLATFORM ADMINISTRATION & GOVERNANCE ───────────────────────────────────

@router.get("/admin/roles")
async def get_admin_roles(db: AsyncSession = Depends(get_db)):
    stmt = select(RoleAssignment).order_by(desc(RoleAssignment.granted_at)).limit(100)
    res = await db.execute(stmt)
    roles = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "userId": r.user_id,
            "roleCode": r.role_code,
            "assignmentState": r.assignment_state,
            "grantedByUserId": r.granted_by_user_id,
            "grantedAt": r.granted_at.isoformat(),
            "expiresAt": r.expires_at.isoformat() if r.expires_at else None,
        }
        for r in roles
    ]

@router.get("/admin/workflow-definitions")
async def get_workflow_definitions(db: AsyncSession = Depends(get_db)):
    stmt = select(WorkflowDefinition).order_by(WorkflowDefinition.created_at).limit(50)
    res = await db.execute(stmt)
    defs = res.scalars().all()
    return [
        {
            "id": str(d.id),
            "processCode": d.process_code,
            "version": d.version,
            "status": d.status,
            "policyVersion": d.policy_version,
            "createdAt": d.created_at.isoformat(),
        }
        for d in defs
    ]

@router.get("/admin/workflow-executions")
async def get_workflow_executions(db: AsyncSession = Depends(get_db)):
    stmt = select(WorkflowExecution).order_by(desc(WorkflowExecution.started_at)).limit(50)
    res = await db.execute(stmt)
    execs = res.scalars().all()
    return [
        {
            "id": str(e.id),
            "definitionId": str(e.definition_id),
            "temporalWorkflowId": e.temporal_workflow_id,
            "subjectType": e.subject_type,
            "subjectId": e.subject_id,
            "status": e.status,
            "startedAt": e.started_at.isoformat(),
            "closedAt": e.closed_at.isoformat() if e.closed_at else None,
        }
        for e in execs
    ]

@router.get("/admin/workflow-tasks")
async def get_workflow_tasks(db: AsyncSession = Depends(get_db)):
    stmt = select(WorkflowTask).order_by(desc(WorkflowTask.due_at)).limit(50)
    res = await db.execute(stmt)
    tasks = res.scalars().all()
    return [
        {
            "id": str(t.id),
            "executionId": str(t.execution_id),
            "taskCode": t.task_code,
            "assigneeUserId": t.assignee_user_id,
            "requiredRole": t.required_role,
            "status": t.status,
            "dueAt": t.due_at.isoformat() if t.due_at else None,
            "completedAt": t.completed_at.isoformat() if t.completed_at else None,
        }
        for t in tasks
    ]

@router.get("/admin/notifications")
async def get_admin_notifications(db: AsyncSession = Depends(get_db)):
    stmt = select(Notification).order_by(desc(Notification.created_at)).limit(50)
    res = await db.execute(stmt)
    notifs = res.scalars().all()
    return [
        {
            "id": str(n.id),
            "userId": n.user_id,
            "notificationType": n.notification_type,
            "channel": n.channel,
            "deliveryState": n.delivery_state,
            "scheduledAt": n.scheduled_at.isoformat(),
            "sentAt": n.sent_at.isoformat() if n.sent_at else None,
            "createdAt": n.created_at.isoformat(),
        }
        for n in notifs
    ]

@router.get("/admin/self-help/content")
async def get_admin_self_help_content(db: AsyncSession = Depends(get_db)):
    stmt = select(SelfHelpContent).order_by(SelfHelpContent.created_at).limit(50)
    res = await db.execute(stmt)
    items = res.scalars().all()
    return [
        {
            "id": str(i.id),
            "contentCode": i.content_code,
            "contentType": i.content_type,
            "title": i.title,
            "locale": i.locale,
            "contentVersion": i.content_version,
            "body": i.body,
            "reviewState": i.review_state,
            "createdAt": i.created_at.isoformat(),
        }
        for i in items
    ]

@router.get("/admin/outbox-events")
async def get_admin_outbox_events(db: AsyncSession = Depends(get_db)):
    stmt = select(OutboxEvent).order_by(desc(OutboxEvent.created_at)).limit(50)
    res = await db.execute(stmt)
    events = res.scalars().all()
    return [
        {
            "id": str(e.id),
            "aggregateType": e.aggregate_type,
            "aggregateId": e.aggregate_id,
            "eventType": e.event_type,
            "payload": e.payload,
            "publishedAt": e.published_at.isoformat() if e.published_at else None,
            "createdAt": e.created_at.isoformat(),
        }
        for e in events
    ]

@router.get("/admin/audit-events")
async def get_admin_audit_events(db: AsyncSession = Depends(get_db)):
    stmt = select(AuditEvent).order_by(desc(AuditEvent.occurred_at)).limit(50)
    res = await db.execute(stmt)
    audits = res.scalars().all()
    return [
        {
            "id": str(a.id),
            "occurredAt": a.occurred_at.isoformat(),
            "actorUserId": a.actor_user_id,
            "actionCode": a.action_code,
            "resourceType": a.resource_type,
            "resourceId": a.resource_id,
            "outcome": a.outcome,
            "details": a.details,
        }
        for a in audits
    ]

@router.get("/privacy-requests")
async def get_privacy_requests(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PrivacyRequest).where(PrivacyRequest.member_id == user_id).order_by(desc(PrivacyRequest.requested_at))
    res = await db.execute(stmt)
    requests = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "memberId": r.member_id,
            "requestType": r.request_type,
            "requestState": r.request_state,
            "requestedAt": r.requested_at.isoformat(),
            "fulfilledAt": r.fulfilled_at.isoformat() if r.fulfilled_at else None,
            "decisionReason": r.decision_reason,
        }
        for r in requests
    ]

@router.post("/privacy-requests")
async def create_privacy_request(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    pr = PrivacyRequest(
        member_id=user_id,
        request_type=payload.get("requestType", "export_data"),
        request_state="submitted"
    )
    db.add(pr)
    await db.commit()
    await db.refresh(pr)
    return {"status": "submitted", "id": str(pr.id)}

@router.get("/auth/session-policy")
async def get_session_policy():
    return {
        "maxSessionAgeMinutes": 480,
        "idleTimeoutMinutes": 60,
        "requireMfa": False,
        "tokenRotationEnabled": True,
    }
