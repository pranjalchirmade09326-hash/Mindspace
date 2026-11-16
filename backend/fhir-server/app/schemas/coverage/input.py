from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CoverageIdentifierInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    use: Optional[str] = None
    type_system: Optional[str] = None
    type_code: Optional[str] = None
    type_display: Optional[str] = None
    type_text: Optional[str] = None
    system: Optional[str] = None
    value: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    assigner: Optional[str] = None


class CoveragePayorInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reference: str = Field(..., description="Payor reference, e.g. 'Organization/10001'.")
    reference_display: Optional[str] = None


class CoverageClassInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type_system: Optional[str] = None
    type_code: Optional[str] = None
    type_display: Optional[str] = None
    type_text: Optional[str] = None
    value: str = Field(...)
    name: Optional[str] = None


class CoverageCostToBeneficiaryExceptionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type_system: Optional[str] = None
    type_code: Optional[str] = None
    type_display: Optional[str] = None
    type_text: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class CoverageCostToBeneficiaryInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type_system: Optional[str] = None
    type_code: Optional[str] = None
    type_display: Optional[str] = None
    type_text: Optional[str] = None
    value_quantity_value: Optional[Decimal] = None
    value_quantity_unit: Optional[str] = None
    value_quantity_system: Optional[str] = None
    value_quantity_code: Optional[str] = None
    value_money_value: Optional[Decimal] = None
    value_money_currency: Optional[str] = None
    exceptions: Optional[List[CoverageCostToBeneficiaryExceptionInput]] = None


class CoverageContractInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reference: str = Field(..., description="Contract reference, e.g. 'Contract/10001'.")
    reference_display: Optional[str] = None


class CoverageCreateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "status": "active",
                "beneficiary": "Patient/10001",
                "payor": [{"reference": "Organization/190001", "reference_display": "Acme Insurance"}],
            }
        },
    )

    user_id: Optional[str] = None
    org_id: Optional[str] = None
    created_by: Optional[str] = None

    status: str = Field(..., description="active | cancelled | draft | entered-in-error")
    beneficiary: str = Field(..., description="Patient reference, e.g. 'Patient/10001'.")
    beneficiary_display: Optional[str] = None

    payor: Optional[List[CoveragePayorInput]] = None

    type_system: Optional[str] = None
    type_code: Optional[str] = None
    type_display: Optional[str] = None
    type_text: Optional[str] = None

    policy_holder: Optional[str] = Field(None, description="e.g. 'Patient/10001' or 'Organization/10001'.")
    policy_holder_display: Optional[str] = None

    subscriber: Optional[str] = Field(None, description="e.g. 'Patient/10001'.")
    subscriber_display: Optional[str] = None
    subscriber_id_value: Optional[str] = None

    dependent: Optional[str] = None

    relationship_system: Optional[str] = None
    relationship_code: Optional[str] = None
    relationship_display: Optional[str] = None
    relationship_text: Optional[str] = None

    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    order: Optional[int] = None
    network: Optional[str] = None
    subrogation: Optional[bool] = None

    identifiers: Optional[List[CoverageIdentifierInput]] = None
    classes: Optional[List[CoverageClassInput]] = None
    cost_to_beneficiary: Optional[List[CoverageCostToBeneficiaryInput]] = None
    contract: Optional[List[CoverageContractInput]] = None


class CoveragePatchSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Optional[str] = None
    type_system: Optional[str] = None
    type_code: Optional[str] = None
    type_display: Optional[str] = None
    type_text: Optional[str] = None

    policy_holder: Optional[str] = None
    policy_holder_display: Optional[str] = None
    subscriber: Optional[str] = None
    subscriber_display: Optional[str] = None
    subscriber_id_value: Optional[str] = None
    beneficiary_display: Optional[str] = None
    dependent: Optional[str] = None

    relationship_system: Optional[str] = None
    relationship_code: Optional[str] = None
    relationship_display: Optional[str] = None
    relationship_text: Optional[str] = None

    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    order: Optional[int] = None
    network: Optional[str] = None
    subrogation: Optional[bool] = None
    updated_by: Optional[str] = None
