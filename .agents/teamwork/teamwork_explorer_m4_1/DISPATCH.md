# Task Assignment: Explorer 1 (Milestone 4 — Fast Session & Service Timeouts)

## Role and Identity
- **Agent Type**: `teamwork_explorer`
- **Assigned Identity**: `explorer_m4_1`
- **Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_1\`
- **Parent Orchestrator ID**: `9c79083f-30f1-4b3f-83d0-f404b182ce44`

## Mandatory Context Files (Read FIRST)
1. `d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md` (Verbatim user requirements)
2. `d:\Mindspace\PROJECT.md` (Architecture, Feature Inventory, contracts, and layout)
3. `d:\Mindspace\TEST_READY.md` (E2E test suite definition and criteria)

## Investigation Scope
Investigate:
1. `frontend/src/modules/server/auth/get-session.ts`:
   - Current implementation of `getServerSession()`.
   - Wrapping `getServerSession()` with `React.cache()` from `"react"`.
   - Reducing external fetch timeout from 1200ms to <= 250ms (e.g., 200ms) with `AbortController`.
   - How `getDevSession` and `getServerSession` interact with cookie resolution.
2. `frontend/src/modules/server/core/organization/infrastructure/services/organization.rest.service.ts`:
   - Current Axios timeout (line 58: 10_000ms).
   - Recommended bound (<= 2000ms, e.g., 1000ms or 1500ms) and fallback handling if timeout occurs or backend is offline.
3. Review corresponding test expectations in `tests/e2e/suites/tier1-features.ts` (F9) and `tests/e2e/suites/tier2-boundaries.ts` (`T2.F9.3`, `T2.F9.4`).

## Deliverables
- Write `handoff.md` in your working directory (`d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_1\handoff.md`) with concrete, code-level analysis, line references, and recommended implementation strategy.
- Do NOT implement any changes directly. You are read-only.
- Notify the orchestrator via `send_message` with your report path.


## 2026-11-02T17:20:58Z
You are explorer_m4_1. Your working directory is d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_1\. Read d:\Mindspace\.agents\teamwork\teamwork_explorer_m4_1\DISPATCH.md and all mandatory context files listed within it (especially d:\Mindspace\.agents\teamwork\ORIGINAL_REQUEST.md). Investigate get-session.ts (React.cache memoization, external probe timeout <= 250ms) and organization.rest.service.ts (Axios timeout <= 2000ms). Produce a structured handoff.md with code-level findings and recommendations, and notify the orchestrator (9c79083f-30f1-4b3f-83d0-f404b182ce44) via send_message. You are read-only. Do not edit source files directly.
