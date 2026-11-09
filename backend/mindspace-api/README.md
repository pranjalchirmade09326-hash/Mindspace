# MindSpace API

A standalone TypeScript API for MindSpace identity-linked member data and wellbeing intake. It uses Fastify, PostgreSQL, Prisma, JWT verification against a MindSpace-owned JWKS endpoint, and Swagger UI. It does not import the existing FHIR or legacy IAM services, their schemas, or their user records.

The API persists encrypted intake responses and enforces owner-based access. Voice recordings are accepted in memory and sent to a configured speech-to-text provider; only the encrypted transcript is persisted. Audio is not stored. Clinical care, EMR, diagnosis, appointments, and FHIR are out of scope.

## Stack

| Area | Choice |
|---|---|
| Runtime | Node.js 22+ / TypeScript |
| HTTP | Fastify 5 |
| Database | PostgreSQL 16 |
| ORM/migrations | Prisma 6 |
| API docs/testing | OpenAPI 3 + Swagger UI at `/api-docs` |
| Authentication | MindSpace-issued JWTs validated with the configured issuer, audience, and remote JWKS |
| Sensitive response storage | AES-256-GCM application encryption; key version stored per response |
| Voice transcription | Configurable OpenAI-compatible transcription endpoint; no provider is enabled by default |

## Local setup

1. Install Node.js 22 or later, pnpm, and Docker Desktop.
2. From this directory, copy `.env.example` to `.env`. Change the local PostgreSQL password and replace the encryption-key placeholder with a valid key. For example, generate a development key with:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

   Put the resulting value in the `v1` entry in `INTAKE_ENCRYPTION_KEYS_JSON`. Do not use this development key in production.
3. Configure `AUTH_ISSUER`, `AUTH_AUDIENCE`, and `AUTH_JWKS_URL` for the **MindSpace** identity provider. The issuer must sign JWTs with a `sub` matching `app_principals.user_id`. Never point these settings at the legacy IAM service. The in-repo development issuer is [`backend/mindspace-iam`](../mindspace-iam/README.md), which serves `http://localhost:5001` with issuer `http://localhost:5001` and audience `mindspace-api`.
4. Configure `TRANSCRIPTION_API_URL`, `TRANSCRIPTION_API_KEY`, and `TRANSCRIPTION_MODEL` for a provider that implements the OpenAI-compatible audio transcription contract (typically `POST /v1/audio/transcriptions`). The endpoint must be HTTPS in production. Leave these unset to disable voice transcription until a provider is approved.
5. Start the isolated local database and install packages:

   ```powershell
   docker compose up -d mindspace-postgres
   pnpm install
   ```
6. Apply the migration and generate the ORM client:

   ```powershell
   pnpm db:migrate
   pnpm db:generate
   ```
7. Run the unit tests:

   ```powershell
   pnpm test
   ```
8. Start the API:

   ```powershell
   pnpm dev
   ```
9. Open Swagger UI at `http://localhost:8080/api-docs`; the OpenAPI document is at `http://localhost:8080/api-docs/json`. Readiness is available at `http://localhost:8080/health/ready`.

The identity/onboarding service must provision the matching `app_principals` row and an active `member` role assignment before a user can call member routes. A valid token alone does not grant member access. Provisioning must be performed by a trusted MindSpace identity integration; do not expose role assignment to members. The sample `.env.example` issuer is a placeholder: protected endpoints cannot be used until a MindSpace-owned JWT issuer/JWKS is configured. Do not point it at the legacy IAM service.

For browser calls from the local MindSpace frontend (`http://localhost:4000`), set `CORS_ORIGINS=http://localhost:4000` in `.env` and configure the frontend API base URL separately. Swagger UI on port 8080 can be opened without an access token; select **Authorize** only after MindSpace authentication is configured.

## API

Health probes are public. All `/api/v1` routes require a verified MindSpace bearer token and an active role appropriate to the operation. Member ownership is taken from the verified JWT subject; clients cannot choose another owner. OpenAPI/Swagger is served at `/api-docs`.

### Identity, member, consent, privacy, and intake

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/me` | Read the authenticated principal and active roles |
| `GET`, `PUT` | `/api/v1/members/me/profile` | Read or update the member profile |
| `GET`, `PUT` | `/api/v1/members/me/preferences` | Read or replace member preferences |
| `GET`, `POST` | `/api/v1/consents` | Read append-only consent history or capture a decision |
| `GET`, `POST` | `/api/v1/privacy-requests` | Read or submit a member privacy request |
| `POST`, `GET` | `/api/v1/intakes` | Create or list member intakes |
| `GET`, `PATCH`, `DELETE` | `/api/v1/intakes/{intakeId}` | Read, update, or soft-delete an owned intake |
| `POST`, `GET` | `/api/v1/intakes/{intakeId}/responses` | Add or read intake responses |
| `POST` | `/api/v1/intakes/{intakeId}/transcription` | Upload consented audio for configured transcription |
| `GET`, `POST` | `/api/v1/intakes/{intakeId}/summaries` | Read or save encrypted, member-authored non-diagnostic summaries |
| `GET` | `/api/v1/intakes/{intakeId}/recommendations` | Read member-visible support options |
| `POST` | `/api/v1/intakes/{intakeId}/recommendations/{recommendationId}/select` | Select an available support option |

### Wellbeing and self-help

| Method | Path | Purpose |
|---|---|---|
| `GET`, `POST` | `/api/v1/wellbeing/moods` | Read or record self-reported mood entries |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/wellbeing/journal` and `/api/v1/wellbeing/journal/{id}` | Encrypted private journal operations; deletion is soft |
| `GET`, `POST` | `/api/v1/wellbeing/goals` | Read or create encrypted member goals |
| `POST` | `/api/v1/wellbeing/goals/{id}/checkins` | Add a check-in to an owned goal |
| `GET`, `POST`, `PATCH` | `/api/v1/wellbeing/sessions` | Store session metadata and member messages; AI companion calls fail explicitly while no AI provider is configured |
| `GET`, `POST`, `PATCH` | `/api/v1/wellbeing/reflections` | Create and complete non-clinical reflections |
| `GET` | `/api/v1/self-help/content` | List currently approved content |
| `POST`, `PATCH` | `/api/v1/self-help/content/{id}/sessions`, `/api/v1/self-help/sessions/{id}` | Start or update an exercise with encrypted reflections |
| `GET`, `POST` | `/api/v1/followups` | Read or schedule member-requested follow-up records; no notification is sent |

### Peer support and listener operations

| Method | Path | Purpose |
|---|---|---|
| `GET`, `POST` | `/api/v1/peer/match-requests` | Read or create consent-backed peer-support requests |
| `POST` | `/api/v1/peer/match-requests/{id}/cancel` | Cancel a queued request and its pending offers |
| `POST` | `/api/v1/operations/matches` | Offer a request to an approved, trained, available listener with capacity |
| `GET` | `/api/v1/listeners/me/offers` | List offers assigned to the listener |
| `POST` | `/api/v1/peer/matches/{id}/accept` or `/decline` | Accept or decline an assigned offer |
| `GET` | `/api/v1/peer/conversations` | List conversations for a participant |
| `GET`, `POST` | `/api/v1/peer/conversations/{id}/messages` | Read or send encrypted participant messages |
| `POST` | `/api/v1/peer/conversations/{id}/close`, `/reports`, `/feedback` | Close, report, or submit optional feedback |
| `POST` | `/api/v1/listeners/me/profile` | Submit/retrieve listener application |
| `GET`, `POST` | `/api/v1/listeners/me/availability` | Read or set availability |
| `POST` | `/api/v1/operations/listeners/{id}/decision` and `/training` | Record a human listener decision or training record |

### Safety, administration, workflow, and eventing

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/safety/resources` | List verified resources by region and locale |
| `POST` | `/api/v1/operations/safety/resources` and `/{id}/verify` | Add a pending resource or record a human verification |
| `GET`, `POST`, `PATCH` | `/api/v1/operations/safety/cases` and `/{id}` | Create, list, and update human-operated case records |
| `POST` | `/api/v1/operations/safety/cases/{id}/actions` | Record an action with an optional encrypted note |
| `GET`, `POST` | `/api/v1/admin/roles` | List or grant role assignments |
| `POST` | `/api/v1/admin/roles/{id}/revoke` | Revoke a role assignment |
| `POST` | `/api/v1/admin/self-help/content` and `/{id}/approve` | Create or review self-help content |
| `GET` | `/api/v1/notifications` | Read notification delivery status |
| `POST` | `/api/v1/admin/notifications` | Queue a notification reference; does not send it |
| `POST` | `/api/v1/admin/workflow-definitions`, `/workflow-executions`, `/workflow-tasks` | Maintain a workflow registry/projection |
| `GET`, `POST` | `/api/v1/operations/workflow-tasks` and `/{id}/acknowledge`, `/{id}/decision` | List, acknowledge, and record human task decisions |
| `POST` | `/api/v1/agent/tool-invocations` | Record agent invocation metadata; does not authorize or execute tools |
| `POST` | `/api/v1/admin/outbox-events` and `/api/v1/admin/event-consumer-receipts/{id}` | Write minimized outbox metadata and idempotent consumer receipts |

### Dashboard read models

These endpoints back the role dashboards. They are read-only projections over the same tables, scoped by the caller's active role, and never widen ownership beyond the verified JWT subject.

| Role | Method | Path | Purpose |
|---|---|---|---|
| Member | `GET` | `/api/v1/members/me/summary` | Weekly check-ins, saved reflections, active goals, support requests, conversations, notifications, privacy requests |
| Listener | `GET` | `/api/v1/listeners/me/profile`, `/training`, `/summary` | Listener profile state, training records, open conversations/offers, availability, scheduled follow-ups |
| Supervisor | `GET` | `/api/v1/operations/supervisor/summary` | Listener roster counts, open conduct reports, pending assignments |
| Supervisor | `GET` | `/api/v1/operations/supervisor/listeners` | Listener roster with name, training state, open conversations, supervisor |
| Supervisor | `GET` | `/api/v1/operations/supervisor/training-records` | Training records with member-visible fields only |
| Supervisor | `GET`, `PATCH` | `/api/v1/operations/supervisor/conduct-reports`, `/conduct-reports/{id}` | List reports (never ciphertext) and record an `open`/`in_review`/`resolved`/`closed` transition |
| Supervisor | `GET`, `POST` | `/api/v1/operations/supervisor/assignments` | List or create listener-to-supervisor assignments |
| Safety | `GET` | `/api/v1/operations/safety/summary` | Cases assigned to me, open cases, pending handoffs/follow-ups/resources |
| Safety | `GET` | `/api/v1/operations/safety/cases/{id}/actions` | Case action history without encrypted notes |
| Safety | `GET` | `/api/v1/operations/safety/followups` | Follow-ups in safety scope |
| Admin | `GET` | `/api/v1/admin/platform/overview` | Principal/role counts, cases, tasks, notifications, outbox, AI runs, audit events, DB status (`503` when the database is unreachable) |
| Admin | `GET` | `/api/v1/admin/audit-events` | Filter audit events by `actionCode`, `actorUserId`, `resourceType`, `limit` |
| Admin | `GET` | `/api/v1/admin/workflow-definitions`, `/workflow-executions`, `/workflow-tasks` | Workflow registry projections |
| Admin | `GET` | `/api/v1/admin/notifications` | Notification queue with delivery status |
| Admin | `GET` | `/api/v1/admin/self-help/content` | All content revisions with approval state |
| Admin | `GET` | `/api/v1/admin/outbox-events` | Minimized outbox metadata |
| Agent | `POST`, `GET` | `/api/v1/agent/runs` | Create or list agent runs; creation requires an active member and granted `intake` consent |
| Agent | `PATCH` | `/api/v1/agent/runs/{id}` | Update run status |
| Agent | `GET`, `PATCH` | `/api/v1/agent/tool-invocations`, `/{id}` | Read invocation metadata (never digests) or record status/output digest |
| Agent | `GET` | `/api/v1/agent/summary` | Registered identities, authorized tools, run/invocation counts, failures, running runs |

The dashboards in the frontend currently render static demo rows from `frontend/src/modules/client/mindspace-dashboard/dashboard-data.ts`. Wiring each page to these endpoints is a separate step and does not change their authorization model.

### Scope and integration boundaries

This delivery adds schema/migration and route coverage for the wellbeing, peer-support, safety-operations, administration, workflow-registry, AI metadata, and eventing domains. It is an API/storage foundation, not a fully integrated production service: some conceptual entities still need purpose-specific endpoints, validation against the approved product policy, and end-to-end tests with a real MindSpace identity provider.

Authentication is external. There are no password registration/login or token-issuer routes here. The external MindSpace identity provider is responsible for current-session logout; the API does not revoke JWTs or implement logout-all.

No AI companion, Temporal worker, notification delivery provider, event broker, automatic crisis classification, emergency dispatch, or staffed responder service is configured. The API never reports those actions as completed; AI companion processing explicitly returns unavailable. Safety routes record human-entered cases/actions and verified resources only. They do not promise monitoring, response times, or dispatch. Eligibility, age, retention, jurisdiction, safety staffing, and listener training policy must be approved before production use.

Example request (the `consentId` must refer to the member's latest granted `intake` consent):

```http
POST /api/v1/intakes
Authorization: Bearer <MindSpace-access-token>
Content-Type: application/json

{
  "channel": "text",
  "locale": "en",
  "consentId": "f29d39ad-b2a7-4e16-a1c3-10ed80c00826"
}
```

Add a response:

```http
POST /api/v1/intakes/{intakeId}/responses
Authorization: Bearer <MindSpace-access-token>
Content-Type: application/json

{
  "sequenceNo": 1,
  "topicCode": "reason_for_visit",
  "responseState": "answered",
  "content": "I have been feeling overwhelmed lately."
}
```

Upload a voice recording (audio is sent to the configured provider and not retained by MindSpace):

```powershell
curl.exe -X POST "http://localhost:8080/api/v1/intakes/{intakeId}/transcription" `
  -H "Authorization: Bearer <MindSpace-access-token>" `
  -F "audio=@C:\path\to\recording.webm;type=audio/webm"
```

Allowed audio formats are WebM, Ogg, WAV, MPEG, and MP4, with a 10 MiB upload limit. The transcript is encrypted and stored as an `intake_responses` row with topic `voice_transcription`. The response returns the transcript to the authenticated member. When no provider is configured, this route returns `503 TRANSCRIPTION_UNAVAILABLE`.

The `DELETE` operation is intentionally a soft-delete. It does not imply immediate physical erasure; implement and approve the retention/purge workflow before processing real member data.

## Identity service (in-repo, development)

[`backend/mindspace-iam`](../mindspace-iam/README.md) is the MindSpace-owned Better Auth service used for local sign-in and sign-up. It stores users, sessions, accounts, verification tokens, and JWKS keys in the `iam` schema of the same PostgreSQL cluster this API uses, and issues Ed25519 JWTs at `/api/auth/token` with `sub` equal to the Better Auth user id.

Sign-up creates a Better Auth user with the base `member` role; privileged roles are only granted through the admin API. The API never trusts the role claim in the JWT — it reads `app_principals` and `role_assignments`, so the frontend calls `POST /api/v1/members/me/provision` after login to create the member principal.

Development run order:

```powershell
# 1. shared PostgreSQL (port 5433)
docker compose up -d mindspace-postgres        # from backend/mindspace-api

# 2. API schema
pnpm db:migrate && pnpm db:generate            # from backend/mindspace-api

# 3. IAM schema, demo identities, and synthetic API rows
pnpm install && pnpm db:push && pnpm db:seed   # from backend/mindspace-iam

# 4. services
pnpm dev                                        # backend/mindspace-iam  -> :5001
pnpm dev                                        # backend/mindspace-api  -> :8080
pnpm dev                                        # frontend               -> :4000
```

Demo identities (password `MindspaceDemo123!`): `member@mindspace.test`, `listener@mindspace.test`, `supervisor@mindspace.test`, `safety@mindspace.test`, `admin@mindspace.test`, `agent@mindspace.test`. Verify sign-in persistence with `SELECT id, email, role FROM iam."user";` and `SELECT id, "userId", "expiresAt" FROM iam.session;`.

## Swagger verification

1. Sign in through the configured MindSpace identity provider and obtain a JWT whose `iss`, `aud`, and `sub` match this API's configuration and MindSpace principal record.
2. Ensure that account has an active `member` role and current `intake` consent. Voice intake also needs current `transcription` consent and an approved provider configured.
3. Start the API and open `/api-docs`.
4. Select **Authorize**, enter the token, then try the documented create, list, read, update, and soft-delete calls. Add text responses or upload a voice recording through the transcription endpoint.
5. Verify an unauthenticated request returns `401`, a non-member returns `403`, a request for another member's ID returns `404`, and invalid request bodies return `400`.

Swagger is an interactive API client for development; it does not replace automated integration tests. Do not paste production member data into a development environment.

## Production requirements before launch

- Replace local PostgreSQL credentials and the environment-based encryption key with managed secrets and a KMS/envelope-encryption setup. Keep old key versions available until encrypted records are re-encrypted or purged.
- Use separate migration and runtime database roles; the runtime role must not own tables or run DDL.
- Deploy only with the approved MindSpace identity issuer/JWKS, TLS, restricted CORS origins, database backups, restore tests, monitoring, and incident procedures.
- Define idempotency for retried write requests, retention/purge execution, audit-event protection, consent copy/versioning, and identity provisioning.
- Use only a transcription provider approved for the intended sensitive data, region, retention, and processing terms. The API does not provide live spoken AI responses; this endpoint only transcribes member audio.
- Use synthetic data until privacy, security, safety, and legal launch reviews are complete.
