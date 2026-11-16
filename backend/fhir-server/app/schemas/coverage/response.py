from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common.fhir import FHIRBundle, FHIRCodeableConcept, FHIRReference


# FHIR representation
class FHIRCoverageSchema(BaseModel):
    resourceType: str = Field("Coverage", description="Always 'Coverage'.")
    id: str = Field(..., description="Public coverage_id as string.")
    identifier: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    type: Optional[FHIRCodeableConcept] = None
    policyHolder: Optional[FHIRReference] = None
    subscriber: Optional[FHIRReference] = None
    subscriberId: Optional[str] = None
    beneficiary: Optional[FHIRReference] = None
    dependent: Optional[str] = None
    relationship: Optional[FHIRCodeableConcept] = None
    period: Optional[Dict[str, Any]] = None
    payor: Optional[List[FHIRReference]] = None
    class_: Optional[List[Dict[str, Any]]] = Field(None, alias="class")
    order: Optional[int] = None
    network: Optional[str] = None
    costToBeneficiary: Optional[List[Dict[str, Any]]] = None
    subrogation: Optional[bool] = None
    contract: Optional[List[FHIRReference]] = None


class FHIRCoverageBundleEntry(BaseModel):
    resource: FHIRCoverageSchema


class FHIRCoverageBundle(FHIRBundle):
    entry: Optional[List[FHIRCoverageBundleEntry]] = None


# Plain representation
class PlainCoverageIdentifier(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    use: Optional[str] = None
    system: Optional[str] = None
    value: Optional[str] = None


class PlainCoveragePayor(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    reference_display: Optional[str] = None


class PlainCoverageClass(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    type_code: Optional[str] = None
    value: str
    name: Optional[str] = None


class PlainCoverageCostToBeneficiary(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    type_code: Optional[str] = None
    value_money_value: Optional[Decimal] = None
    value_money_currency: Optional[str] = None


class PlainCoverageContract(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None


class PlainCoverageResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: int
    status: Optional[str] = None
    type_system: Optional[str] = None
    type_code: Optional[str] = None
    type_display: Optional[str] = None
    type_text: Optional[str] = None
    policy_holder_type: Optional[str] = None
    policy_holder_id: Optional[int] = None
    policy_holder_display: Optional[str] = None
    subscriber_type: Optional[str] = None
    subscriber_id: Optional[int] = None
    subscriber_display: Optional[str] = None
    subscriber_id_value: Optional[str] = None
    beneficiary_type: Optional[str] = None
    beneficiary_id: Optional[int] = None
    beneficiary_display: Optional[str] = None
    dependent: Optional[str] = None
    relationship_system: Optional[str] = None
    relationship_code: Optional[str] = None
    relationship_display: Optional[str] = None
    relationship_text: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    order: Optional[int] = None
    network: Optional[str] = None
    subrogation: Optional[bool] = None
    user_id: Optional[str] = None
    org_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    identifier: Optional[List[PlainCoverageIdentifier]] = None
    payor: Optional[List[PlainCoveragePayor]] = None
    classes: Optional[List[PlainCoverageClass]] = None
    cost_to_beneficiary: Optional[List[PlainCoverageCostToBeneficiary]] = None
    contract: Optional[List[PlainCoverageContract]] = None


class PaginatedCoverageResponse(BaseModel):
    total: int
    limit: int
    offset: int
    data: List[PlainCoverageResponse]
