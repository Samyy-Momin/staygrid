# Build from the repo root:  docker build -f apps/backend/Dockerfile -t staygrid-backend .
FROM node:22-alpine AS base
# Fetch pnpm once in its own cached layer (avoids a registry download on every install step).
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

FROM base AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Every workspace manifest must exist for the lockfile check; only backend deps are installed.
COPY apps/backend/package.json apps/backend/
COPY apps/admin-erp/package.json apps/admin-erp/
COPY apps/mobile/package.json apps/mobile/
COPY apps/sites/package.json apps/sites/
RUN pnpm install --frozen-lockfile --filter backend
COPY apps/backend apps/backend
WORKDIR /repo/apps/backend
# generate needs no real DB; the URL only satisfies prisma.config.ts
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm exec prisma generate && pnpm build
# Production-only dependency tree (no TypeScript/Jest/ESLint), then regenerate the client inside it.
WORKDIR /repo
RUN pnpm --filter backend deploy --prod --legacy /out \
 && cd /out && ./node_modules/.bin/prisma generate \
 && cp -r /repo/apps/backend/dist /out/dist

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3000
# Apply pending migrations, then start. Safe to run on every boot.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/src/main"]
