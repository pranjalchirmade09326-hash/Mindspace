# MindSpace IAM

Standalone MindSpace-owned identity provider. It stores accounts, password hashes,
sessions, and signing keys in its own PostgreSQL schema (`iam`) and issues the
JWT/JWKS contract the MindSpace API verifies.

This service is a **development-oriented, self-contained IAM** built on
[Better Auth](https://www.better-auth.com/) 1.7.16. No accounts are imported
from any other project.

## Responsibilities

| Concern | Owner |
| --- | --- |
| Sign up, sign in, sign out, session cookies | This service (`/api/auth/*`) |
| Password hashing and session storage | PostgreSQL schema `iam` |
| JWT signing keys and JWKS | This service (`/api/auth/jwks`) |
| JWT verification and authorization | `backend/mindspace-api` |
| Role-aware application authorization | `backend/mindspace-api` (`app_principals`, `role_assignments`) |

Authentication is not authorization. The API does not trust the `role` claim for
access decisions; it loads `app_principals` and active `role_assignments` from its
own schema for every request. The IAM role is what the web app uses to open the
correct role workspace.

## Contract

| Setting | Value |
| --- | --- |
| Base URL | `http://localhost:5001` |
| Base path | `/api/auth` |
| Session endpoint | `GET /api/auth/get-session` |
| Token endpoint | `GET /api/auth/token` (JWT, 1 hour) |
| JWKS | `http://localhost:5001/api/auth/jwks` |
| JWT issuer | `http://localhost:5001` |
| JWT audience | `mindspace-api` |
| JWT subject | Better Auth user id (copied to `app_principals.user_id`) |
| JWT claims | `sub`, `name`, `email`, `role`, `iat`, `exp`, `iss`, `aud` |
| Signing algorithm | EdDSA / Ed25519 (key stored encrypted in `jwks`) |

The MindSpace API `.env` must contain:

```dotenv
AUTH_ISSUER=http://localhost:5001
AUTH_AUDIENCE=mindspace-api
AUTH_JWKS_URL=http://localhost:5001/api/auth/jwks
```

## Local setup

The IAM shares the local PostgreSQL cluster with the MindSpace API but keeps its
tables in a separate `iam` schema, as recommended by the architecture guidance.

```bash
cd backend/mindspace-iam
cp .env.example .env
# set BETTER_AUTH_SECRET to a generated value, e.g. openssl rand -base64 48

# Start the shared local PostgreSQL (skip if already running from mindspace-api)
docker compose up -d

pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Health checks: `GET /health/live` and `GET /health/ready`.

### Database schema

Better Auth tables live in schema `iam`:

- `user` – identity, name, email, role (admin plugin fields included)
- `session` – server-side sessions (`httpOnly` cookie)
- `account` – email/password credential (scrypt hash) and provider links
- `verification` – short-lived verification tokens
- `jwks` – Ed25519 signing keys

The connection string uses Prisma's `?schema=iam` parameter:

```dotenv
DATABASE_URL=postgresql://mindspace:dev-only-change-me@localhost:5433/mindspace?schema=iam
```

`db:push` is suitable for local development. Generate and review versioned
migrations with `pnpm db:migrate:dev --name init` before any shared or
production environment.

## Demo identities

`pnpm db:seed` creates synthetic accounts. Passwords are **development-only**.

| Email | Password | MindSpace role | Workspace |
| --- | --- | --- | --- |
| `member@mindspace.test` | `MindspaceDemo123!` | `member` | `/mindspace/member` |
| `listener@mindspace.test` | `MindspaceDemo123!` | `listener` | `/mindspace/listener` |
| `supervisor@mindspace.test` | `MindspaceDemo123!` | `listener_supervisor` | `/mindspace/listener-supervisor` |
| `safety@mindspace.test` | `MindspaceDemo123!` | `safety_operations_specialist` | `/mindspace/safety-operations` |
| `admin@mindspace.test` | `MindspaceDemo123!` | `platform_administrator` | `/mindspace/platform-administrator` |
| `agent@mindspace.test` | `MindspaceDemo123!` | `ai_agent_service` | `/mindspace/ai-agent` |

The seed also writes matching `app_principals`, `role_assignments`, member
profiles, and a small set of synthetic peer-support / safety / workflow records
into the MindSpace API schema so the operational endpoints return data. Set
`SEED_MINDSPACE_API=false` to seed identities only.

Demo user ids are deterministic (`usr-demo-*`) through a `databaseHooks.user.create.before`
hook. Any other sign-up receives a random `usr_<uuid>` id. If a demo account was
changed outside this seed and its id no longer matches, delete that demo account
and reseed.

## New user flow

1. The browser signs up/signs in against this service.
2. The Next.js server reads the Better Auth session and calls
   `GET /api/auth/token` to obtain a JWT.
3. It calls `POST /api/v1/members/me/provision` on `mindspace-api`, which creates
   the principal and the base `member` role for that `sub`.
4. Privileged roles (`listener`, `listener_supervisor`,
   `safety_operations_specialist`, `platform_administrator`, `ai_agent_service`)
   are only granted by an administrator through the API. They are never
   self-granted from a signup or token claim.

## Security notes

- Replace `BETTER_AUTH_SECRET` with a generated secret; production requires HTTPS.
- Cookies are `httpOnly`, `SameSite=Lax`, and `Secure` in production.
- Sessions expire after 7 days and slide daily; JWTs expire after 1 hour.
- The seed is explicitly synthetic demo data. Do not run it against a real pilot
  database that contains member information.
