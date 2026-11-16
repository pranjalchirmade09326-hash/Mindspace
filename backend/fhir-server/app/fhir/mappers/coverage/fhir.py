from __future__ import annotations

from app.fhir.datatypes import fhir_enum, fhir_identifier


def _fhir_cc(system, code, display, text) -> dict:
    coding = {k: v for k, v in {"system": system, "code": code, "display": display}.items() if v}
    entry: dict = {}
    if coding:
        entry["coding"] = [coding]
    if text:
        entry["text"] = text
    return entry


def _fhir_ref(ref_type, ref_id, display=None) -> dict:
    entry: dict = {}
    t = fhir_enum(ref_type) if ref_type else None
    if t and ref_id is not None:
        entry["reference"] = f"{t}/{ref_id}"
    if display:
        entry["display"] = display
    return entry


def _fhir_money(value, currency):
    if value is None and not currency:
        return None
    m: dict = {}
    if value is not None:
        m["value"] = float(value)
    if currency:
        m["currency"] = currency
    return m or None


def _fhir_quantity(value, unit, system, code):
    if value is None:
        return None
    q: dict = {"value": float(value)}
    if unit:
        q["unit"] = unit
    if system:
        q["system"] = system
    if code:
        q["code"] = code
    return q


def fhir_coverage_class(c) -> dict:
    entry: dict = {"value": c.value}
    type_cc = _fhir_cc(c.type_system, c.type_code, c.type_display, c.type_text)
    if type_cc:
        entry["type"] = type_cc
    if c.name:
        entry["name"] = c.name
    return entry


def fhir_coverage_cost_exception(e) -> dict:
    entry: dict = {}
    type_cc = _fhir_cc(e.type_system, e.type_code, e.type_display, e.type_text)
    if type_cc:
        entry["type"] = type_cc
    if e.period_start or e.period_end:
        entry["period"] = {k: v for k, v in {
            "start": e.period_start.isoformat() if e.period_start else None,
            "end": e.period_end.isoformat() if e.period_end else None,
        }.items() if v}
    return entry


def fhir_coverage_cost_to_beneficiary(ctb) -> dict:
    entry: dict = {}
    type_cc = _fhir_cc(ctb.type_system, ctb.type_code, ctb.type_display, ctb.type_text)
    if type_cc:
        entry["type"] = type_cc
    qty = _fhir_quantity(ctb.value_quantity_value, ctb.value_quantity_unit, ctb.value_quantity_system, ctb.value_quantity_code)
    if qty:
        entry["valueQuantity"] = qty
    money = _fhir_money(ctb.value_money_value, ctb.value_money_currency)
    if money:
        entry["valueMoney"] = money
    if ctb.exceptions:
        entry["exception"] = [fhir_coverage_cost_exception(ex) for ex in ctb.exceptions]
    return entry


def to_fhir_coverage(model) -> dict:
    result: dict = {
        "resourceType": "Coverage",
        "id": str(model.coverage_id),
        "status": fhir_enum(model.status),
    }

    if model.identifiers:
        result["identifier"] = [fhir_identifier(i) for i in model.identifiers]

    type_cc = _fhir_cc(model.type_system, model.type_code, model.type_display, model.type_text)
    if type_cc:
        result["type"] = type_cc

    pol_ref = _fhir_ref(model.policy_holder_type, model.policy_holder_id, model.policy_holder_display)
    if pol_ref:
        result["policyHolder"] = pol_ref

    sub_ref = _fhir_ref(model.subscriber_type, model.subscriber_id, model.subscriber_display)
    if sub_ref:
        result["subscriber"] = sub_ref

    if model.subscriber_id_value:
        result["subscriberId"] = model.subscriber_id_value

    ben_ref = _fhir_ref(model.beneficiary_type, model.beneficiary_id, model.beneficiary_display)
    if ben_ref:
        result["beneficiary"] = ben_ref

    if model.dependent:
        result["dependent"] = model.dependent

    rel_cc = _fhir_cc(model.relationship_system, model.relationship_code, model.relationship_display, model.relationship_text)
    if rel_cc:
        result["relationship"] = rel_cc

    if model.period_start or model.period_end:
        result["period"] = {k: v for k, v in {
            "start": model.period_start.isoformat() if model.period_start else None,
            "end": model.period_end.isoformat() if model.period_end else None,
        }.items() if v}

    if model.payors:
        payor_list = []
        for p in model.payors:
            pref = _fhir_ref(p.reference_type, p.reference_id, p.reference_display)
            if pref:
                payor_list.append(pref)
        if payor_list:
            result["payor"] = payor_list

    if model.classes:
        result["class"] = [fhir_coverage_class(c) for c in model.classes]

    if model.order is not None:
        result["order"] = model.order

    if model.network:
        result["network"] = model.network

    if model.cost_to_beneficiaries:
        result["costToBeneficiary"] = [fhir_coverage_cost_to_beneficiary(ctb) for ctb in model.cost_to_beneficiaries]

    if model.subrogation is not None:
        result["subrogation"] = model.subrogation

    if model.contracts:
        contract_list = []
        for c in model.contracts:
            cref = _fhir_ref(c.reference_type, c.reference_id, c.reference_display)
            if cref:
                contract_list.append(cref)
        if contract_list:
            result["contract"] = contract_list

    return {k: v for k, v in result.items() if v is not None}
