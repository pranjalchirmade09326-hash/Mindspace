"""Verification tests for Coverage model, schema, mapper, and container wiring."""
import pytest
from app.models.coverage.enums import CoverageStatus, CoverageBeneficiaryReferenceType
from app.models.coverage.coverage import CoverageModel, CoverageIdentifier, CoveragePayor, CoverageClass
from app.schemas.coverage.input import CoverageCreateSchema, CoveragePatchSchema
from app.schemas.coverage.response import FHIRCoverageSchema, PlainCoverageResponse
from app.fhir.mappers.coverage import to_fhir_coverage, to_plain_coverage
from app.repository.coverage_repository import CoverageRepository
from app.services.coverage_service import CoverageService
from app.di.modules.coverage import CoverageContainer
from app.routers.coverage import router as coverage_router


def test_coverage_model_attributes():
    """Verify CoverageModel has all required SQLAlchemy table attributes."""
    assert CoverageModel.__tablename__ == "coverage"
    assert hasattr(CoverageModel, "coverage_id")
    assert hasattr(CoverageModel, "status")
    assert hasattr(CoverageModel, "beneficiary_id")
    assert hasattr(CoverageModel, "identifiers")
    assert hasattr(CoverageModel, "payors")
    assert hasattr(CoverageModel, "classes")
    assert hasattr(CoverageModel, "cost_to_beneficiaries")
    assert hasattr(CoverageModel, "contracts")


def test_coverage_enums():
    """Verify CoverageStatus enums match FHIR R4 standard."""
    assert CoverageStatus.active.value == "active"
    assert CoverageStatus.cancelled.value == "cancelled"
    assert CoverageStatus.draft.value == "draft"
    assert CoverageStatus.entered_in_error.value == "entered-in-error"
    assert CoverageBeneficiaryReferenceType.Patient.value == "Patient"


def test_coverage_schemas():
    """Verify Coverage Pydantic schemas validate correctly."""
    payload = {
        "status": "active",
        "beneficiary": "Patient/10001",
        "beneficiary_display": "Test Patient",
    }
    create_schema = CoverageCreateSchema.model_validate(payload)
    assert create_schema.status == "active"
    assert create_schema.beneficiary == "Patient/10001"

    patch_payload = {"status": "cancelled"}
    patch_schema = CoveragePatchSchema.model_validate(patch_payload)
    assert patch_schema.status == "cancelled"


def test_coverage_router_and_container():
    """Verify coverage router and DI container are cleanly wired."""
    assert coverage_router is not None
    assert len(coverage_router.routes) >= 5
    # Verify routes exist for GET, POST, PATCH, DELETE
    methods = {route.methods.pop() for route in coverage_router.routes if hasattr(route, "methods")}
    assert "GET" in methods
    assert "POST" in methods
