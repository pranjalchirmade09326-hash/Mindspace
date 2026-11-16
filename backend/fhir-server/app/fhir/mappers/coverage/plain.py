from __future__ import annotations

from app.fhir.datatypes import fhir_enum


def plain_coverage_identifier(i) -> dict:
    return {
        "id": i.id,
        "use": i.use,
        "type_system": i.type_system,
        "type_code": i.type_code,
        "type_display": i.type_display,
        "type_text": i.type_text,
        "system": i.system,
        "value": i.value,
        "period_start": i.period_start.isoformat() if i.period_start else None,
        "period_end": i.period_end.isoformat() if i.period_end else None,
        "assigner": i.assigner,
    }


def plain_coverage_payor(p) -> dict:
    return {
        "id": p.id,
        "reference_type": fhir_enum(p.reference_type),
        "reference_id": p.reference_id,
        "reference_display": p.reference_display,
    }


def plain_coverage_class(c) -> dict:
    return {
        "id": c.id,
        "type_system": c.type_system,
        "type_code": c.type_code,
        "type_display": c.type_display,
        "type_text": c.type_text,
        "value": c.value,
        "name": c.name,
    }


def plain_coverage_cost_to_beneficiary(ctb) -> dict:
    return {
        "id": ctb.id,
        "type_system": ctb.type_system,
        "type_code": ctb.type_code,
        "type_display": ctb.type_display,
        "type_text": ctb.type_text,
        "value_quantity_value": ctb.value_quantity_value,
        "value_quantity_unit": ctb.value_quantity_unit,
        "value_quantity_system": ctb.value_quantity_system,
        "value_quantity_code": ctb.value_quantity_code,
        "value_money_value": ctb.value_money_value,
        "value_money_currency": ctb.value_money_currency,
    }


def plain_coverage_contract(c) -> dict:
    return {
        "id": c.id,
        "reference_type": fhir_enum(c.reference_type),
        "reference_id": c.reference_id,
        "reference_display": c.reference_display,
    }


def to_plain_coverage(model) -> dict:
    return {
        "id": model.coverage_id,
        "status": fhir_enum(model.status),
        "type_system": model.type_system,
        "type_code": model.type_code,
        "type_display": model.type_display,
        "type_text": model.type_text,
        "policy_holder_type": fhir_enum(model.policy_holder_type),
        "policy_holder_id": model.policy_holder_id,
        "policy_holder_display": model.policy_holder_display,
        "subscriber_type": fhir_enum(model.subscriber_type),
        "subscriber_id": model.subscriber_id,
        "subscriber_display": model.subscriber_display,
        "subscriber_id_value": model.subscriber_id_value,
        "beneficiary_type": fhir_enum(model.beneficiary_type),
        "beneficiary_id": model.beneficiary_id,
        "beneficiary_display": model.beneficiary_display,
        "dependent": model.dependent,
        "relationship_system": model.relationship_system,
        "relationship_code": model.relationship_code,
        "relationship_display": model.relationship_display,
        "relationship_text": model.relationship_text,
        "period_start": model.period_start.isoformat() if model.period_start else None,
        "period_end": model.period_end.isoformat() if model.period_end else None,
        "order": model.order,
        "network": model.network,
        "subrogation": model.subrogation,
        "user_id": model.user_id,
        "org_id": model.org_id,
        "created_at": model.created_at.isoformat() if model.created_at else None,
        "updated_at": model.updated_at.isoformat() if model.updated_at else None,
        "created_by": model.created_by,
        "updated_by": model.updated_by,
        "identifier": [plain_coverage_identifier(i) for i in model.identifiers] if model.identifiers else [],
        "payor": [plain_coverage_payor(p) for p in model.payors] if model.payors else [],
        "classes": [plain_coverage_class(c) for c in model.classes] if model.classes else [],
        "cost_to_beneficiary": [plain_coverage_cost_to_beneficiary(ctb) for ctb in model.cost_to_beneficiaries] if model.cost_to_beneficiaries else [],
        "contract": [plain_coverage_contract(c) for c in model.contracts] if model.contracts else [],
    }
