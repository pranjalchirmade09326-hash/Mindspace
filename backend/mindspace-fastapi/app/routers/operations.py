from fastapi import APIRouter, Depends, Query, Body
from app.core.security import get_current_user_id
from app.services.operations_service import OperationsService, get_operations_service
from typing import Dict, Any

router = APIRouter(prefix="/api/v1", tags=["Operations & Staff Workspaces"])


# ─── LISTENER SELF-SERVICE ───────────────────────────────────────────────────

@router.get("/listeners/me/profile")
async def get_listener_profile(
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_listener_profile(user_id)


@router.post("/listeners/me/profile")
async def update_listener_profile(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.update_listener_profile(user_id, payload)


@router.get("/listeners/me/training")
async def get_listener_training(
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_listener_training(user_id)


@router.get("/listeners/me/offers")
async def get_listener_offers(
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_listener_offers(user_id)


@router.get("/listeners/me/availability")
async def get_listener_availability(
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_listener_availability(user_id)


@router.post("/listeners/me/availability")
async def add_listener_availability(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.add_listener_availability(user_id, payload)


# ─── SUPERVISOR OPERATIONS ──────────────────────────────────────────────────

@router.get("/operations/supervisor/listeners")
async def get_supervisor_listeners(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_supervisor_listeners()


@router.get("/operations/supervisor/training-records")
async def get_supervisor_training_records(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_supervisor_training_records()


@router.get("/operations/supervisor/conduct-reports")
async def get_supervisor_conduct_reports(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_supervisor_conduct_reports()


@router.patch("/operations/supervisor/conduct-reports/{report_id}")
async def update_conduct_report(
    report_id: str,
    payload: Dict[str, Any] = Body(...),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.update_conduct_report(report_id, payload)


@router.get("/operations/supervisor/assignments")
async def get_supervisor_assignments(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_supervisor_assignments()


@router.post("/operations/supervisor/assignments")
async def create_supervisor_assignment(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.create_supervisor_assignment(user_id, payload)


# ─── SAFETY & CRISIS OPERATIONS ─────────────────────────────────────────────

@router.get("/safety/resources")
async def get_safety_resources(
    regionCode: str = Query("IN"),
    locale: str = Query("en"),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_safety_resources(region_code=regionCode, locale=locale)


@router.get("/operations/safety/cases")
async def get_safety_cases(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_safety_cases()


@router.post("/operations/safety/cases")
async def create_safety_case(
    payload: Dict[str, Any] = Body(...),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.create_safety_case(payload)


@router.get("/operations/safety/cases/{case_id}/actions")
async def get_safety_case_actions(
    case_id: str,
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_safety_case_actions(case_id)


@router.get("/operations/safety/followups")
async def get_safety_followups(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_safety_followups()


# ─── PLATFORM ADMINISTRATION & GOVERNANCE ───────────────────────────────────

@router.get("/admin/roles")
async def get_admin_roles(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_admin_roles()


@router.get("/admin/workflow-definitions")
async def get_workflow_definitions(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_workflow_definitions()


@router.get("/admin/workflow-executions")
async def get_workflow_executions(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_workflow_executions()


@router.get("/admin/workflow-tasks")
async def get_workflow_tasks(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_workflow_tasks()


@router.get("/admin/notifications")
async def get_admin_notifications(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_admin_notifications()


@router.get("/admin/self-help/content")
async def get_admin_self_help_content(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_admin_self_help_content()


@router.get("/admin/outbox-events")
async def get_admin_outbox_events(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_admin_outbox_events()


@router.get("/admin/audit-events")
async def get_admin_audit_events(
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_admin_audit_events()


@router.get("/privacy-requests")
async def get_privacy_requests(
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.get_privacy_requests(user_id)


@router.post("/privacy-requests")
async def create_privacy_request(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    service: OperationsService = Depends(get_operations_service),
):
    return await service.create_privacy_request(user_id, payload)


@router.get("/auth/session-policy")
async def get_session_policy(
    service: OperationsService = Depends(get_operations_service),
):
    return service.get_session_policy()
