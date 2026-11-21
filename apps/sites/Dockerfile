# Build from the repo root:  docker build -f apps/sites/Dockerfile -t staygrid-sites .
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

FROM base AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/admin-erp/package.json apps/admin-erp/
COPY apps/mobile/package.json apps/mobile/
COPY apps/sites/package.json apps/sites/
RUN pnpm install --frozen-lockfile --filter sites
COPY apps/sites apps/sites
WORKDIR /repo/apps/sites
RUN pnpm build

FROM node:22-alpine
ENV NODE_ENV=production PORT=3002 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/sites/.next/standalone ./
COPY --from=build /repo/apps/sites/.next/static ./apps/sites/.next/static
USER node
EXPOSE 3002
# HOSTNAME=0.0.0.0 is required: Next's proxy forwards rewrites to localhost (IPv4 and IPv6).
CMD ["node", "apps/sites/server.js"]
