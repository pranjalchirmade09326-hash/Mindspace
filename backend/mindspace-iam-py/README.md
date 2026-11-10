# MindSpace IAM (Python / FastAPI)

Python port of `../mindspace-iam` (Better Auth). Same schema (`iam`), same contract:
`/api/auth/sign-up/email`, `/sign-in/email`, `/sign-out`, `/get-session`, `/token`, `/jwks`, `/health/*`.
JWTs are EdDSA/Ed25519, 1h, claims `sub,name,email,role,iat,exp,iss,aud`.

```bash
cd backend/mindspace-iam-py
cp ../mindspace-iam/.env.example .env   # DATABASE_URL may keep ?schema=iam
uv sync
uv run python -m app.seed               # demo users (dev only)
uv run uvicorn app.main:app --port 5001 --reload
```

Notes
- Tables are created automatically on startup from `migrations/*.sql` (idempotent, same schema as the old Prisma migration).
- Passwords use Better Auth's scrypt format, so existing hashes still verify.
- Signing keys written by the Node IAM cannot be decrypted here; a new key is generated on first use
  (old tokens stop validating, which is fine for dev).
- Not ported: admin plugin endpoints (set-role, ban, impersonate), OAuth provider, email verification.
