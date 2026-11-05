FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@12 --activate
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat netcat-openbsd

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate

EXPOSE 8080

CMD ["sh", "-c", "until nc -z mindspace-postgres 5432; do echo 'Waiting for Database...'; sleep 1; done; pnpm prisma migrate deploy && pnpm dev"]
