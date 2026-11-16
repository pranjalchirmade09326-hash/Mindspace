from enum import Enum


class CoverageStatus(str, Enum):
    """FHIR R4 Coverage.status."""
    active = "active"
    cancelled = "cancelled"
    draft = "draft"
    entered_in_error = "entered-in-error"


class CoveragePolicyHolderReferenceType(str, Enum):
    Patient = "Patient"
    RelatedPerson = "RelatedPerson"
    Organization = "Organization"


class CoverageSubscriberReferenceType(str, Enum):
    Patient = "Patient"
    RelatedPerson = "RelatedPerson"


class CoverageBeneficiaryReferenceType(str, Enum):
    Patient = "Patient"


class CoveragePayorReferenceType(str, Enum):
    Organization = "Organization"
    Patient = "Patient"
    RelatedPerson = "RelatedPerson"


class CoverageContractReferenceType(str, Enum):
    Contract = "Contract"
