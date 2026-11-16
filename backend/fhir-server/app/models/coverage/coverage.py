from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    Sequence,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import FHIRBase as Base
from app.models.coverage.enums import (
    CoverageBeneficiaryReferenceType,
    CoverageContractReferenceType,
    CoveragePayorReferenceType,
    CoveragePolicyHolderReferenceType,
    CoverageStatus,
    CoverageSubscriberReferenceType,
)

coverage_id_seq = Sequence("coverage_pub_seq", start=240000, increment=1, metadata=Base.metadata)


class CoverageModel(Base):
    __tablename__ = "coverage"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    coverage_id = Column(
        Integer,
        coverage_id_seq,
        server_default=coverage_id_seq.next_value(),
        unique=True,
        index=True,
        nullable=False,
    )
    user_id = Column(String, nullable=True, index=True)
    org_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)

    status = Column(Enum(CoverageStatus, name="coverage_status"), nullable=False)

    type_system = Column(String, nullable=True)
    type_code = Column(String, nullable=True)
    type_display = Column(String, nullable=True)
    type_text = Column(String, nullable=True)

    policy_holder_type = Column(
        Enum(CoveragePolicyHolderReferenceType, name="coverage_policy_holder_reference_type"),
        nullable=True,
    )
    policy_holder_id = Column(Integer, nullable=True)
    policy_holder_display = Column(String, nullable=True)

    subscriber_type = Column(
        Enum(CoverageSubscriberReferenceType, name="coverage_subscriber_reference_type"),
        nullable=True,
    )
    subscriber_id = Column(Integer, nullable=True)
    subscriber_display = Column(String, nullable=True)
    subscriber_id_value = Column(String, nullable=True)

    beneficiary_type = Column(
        Enum(CoverageBeneficiaryReferenceType, name="coverage_beneficiary_reference_type"),
        nullable=False,
        default=CoverageBeneficiaryReferenceType.Patient,
    )
    beneficiary_id = Column(Integer, nullable=False)
    beneficiary_display = Column(String, nullable=True)

    dependent = Column(String, nullable=True)

    relationship_system = Column(String, nullable=True)
    relationship_code = Column(String, nullable=True)
    relationship_display = Column(String, nullable=True)
    relationship_text = Column(String, nullable=True)

    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)
    order = Column(Integer, nullable=True)
    network = Column(String, nullable=True)
    subrogation = Column(Boolean, nullable=True)

    # Relationships
    identifiers = relationship("CoverageIdentifier", back_populates="coverage", cascade="all, delete-orphan")
    payors = relationship("CoveragePayor", back_populates="coverage", cascade="all, delete-orphan")
    classes = relationship("CoverageClass", back_populates="coverage", cascade="all, delete-orphan")
    cost_to_beneficiaries = relationship("CoverageCostToBeneficiary", back_populates="coverage", cascade="all, delete-orphan")
    contracts = relationship("CoverageContract", back_populates="coverage", cascade="all, delete-orphan")


class CoverageIdentifier(Base):
    __tablename__ = "coverage_identifier"

    id = Column(Integer, primary_key=True, autoincrement=True)
    coverage_id = Column(Integer, ForeignKey("coverage.id"), nullable=False, index=True)
    org_id = Column(String, nullable=True)
    use = Column(String, nullable=True)
    type_system = Column(String, nullable=True)
    type_code = Column(String, nullable=True)
    type_display = Column(String, nullable=True)
    type_text = Column(String, nullable=True)
    system = Column(String, nullable=True)
    value = Column(String, nullable=True)
    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)
    assigner = Column(String, nullable=True)

    coverage = relationship("CoverageModel", back_populates="identifiers")


class CoveragePayor(Base):
    __tablename__ = "coverage_payor"

    id = Column(Integer, primary_key=True, autoincrement=True)
    coverage_id = Column(Integer, ForeignKey("coverage.id"), nullable=False, index=True)
    org_id = Column(String, nullable=True)
    reference_type = Column(
        Enum(CoveragePayorReferenceType, name="coverage_payor_reference_type"),
        nullable=True,
    )
    reference_id = Column(Integer, nullable=True)
    reference_display = Column(String, nullable=True)

    coverage = relationship("CoverageModel", back_populates="payors")


class CoverageClass(Base):
    __tablename__ = "coverage_class"

    id = Column(Integer, primary_key=True, autoincrement=True)
    coverage_id = Column(Integer, ForeignKey("coverage.id"), nullable=False, index=True)
    org_id = Column(String, nullable=True)
    type_system = Column(String, nullable=True)
    type_code = Column(String, nullable=True)
    type_display = Column(String, nullable=True)
    type_text = Column(String, nullable=True)
    value = Column(String, nullable=False)
    name = Column(String, nullable=True)

    coverage = relationship("CoverageModel", back_populates="classes")


class CoverageCostToBeneficiary(Base):
    __tablename__ = "coverage_cost_to_beneficiary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    coverage_id = Column(Integer, ForeignKey("coverage.id"), nullable=False, index=True)
    org_id = Column(String, nullable=True)
    type_system = Column(String, nullable=True)
    type_code = Column(String, nullable=True)
    type_display = Column(String, nullable=True)
    type_text = Column(String, nullable=True)
    value_quantity_value = Column(Numeric(18, 4), nullable=True)
    value_quantity_unit = Column(String, nullable=True)
    value_quantity_system = Column(String, nullable=True)
    value_quantity_code = Column(String, nullable=True)
    value_money_value = Column(Numeric(18, 4), nullable=True)
    value_money_currency = Column(String, nullable=True)

    coverage = relationship("CoverageModel", back_populates="cost_to_beneficiaries")
    exceptions = relationship("CoverageCostToBeneficiaryException", back_populates="cost_to_beneficiary", cascade="all, delete-orphan")


class CoverageCostToBeneficiaryException(Base):
    __tablename__ = "coverage_cost_to_beneficiary_exception"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cost_to_beneficiary_id = Column(Integer, ForeignKey("coverage_cost_to_beneficiary.id"), nullable=False, index=True)
    org_id = Column(String, nullable=True)
    type_system = Column(String, nullable=True)
    type_code = Column(String, nullable=True)
    type_display = Column(String, nullable=True)
    type_text = Column(String, nullable=True)
    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)

    cost_to_beneficiary = relationship("CoverageCostToBeneficiary", back_populates="exceptions")


class CoverageContract(Base):
    __tablename__ = "coverage_contract"

    id = Column(Integer, primary_key=True, autoincrement=True)
    coverage_id = Column(Integer, ForeignKey("coverage.id"), nullable=False, index=True)
    org_id = Column(String, nullable=True)
    reference_type = Column(
        Enum(CoverageContractReferenceType, name="coverage_contract_reference_type"),
        nullable=True,
    )
    reference_id = Column(Integer, nullable=True)
    reference_display = Column(String, nullable=True)

    coverage = relationship("CoverageModel", back_populates="contracts")
