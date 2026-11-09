# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl \
 && npm install --global pnpm@9.7.1
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm build

FROM builder AS runner
ENV NODE_ENV=production
RUN addgroup -S nodejs \
 && adduser -S -G nodejs -u 1001 mindspace \
 && chown -R mindspace:nodejs /app
USER mindspace
EXPOSE 5001
CMD ["node", "dist/server.js"]
