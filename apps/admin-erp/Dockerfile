# Build from the repo root:
#   docker build -f apps/admin-erp/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api -t staygrid-admin .
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

FROM base AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/admin-erp/package.json apps/admin-erp/
COPY apps/mobile/package.json apps/mobile/
COPY apps/sites/package.json apps/sites/
RUN pnpm install --frozen-lockfile --filter admin-erp
COPY apps/admin-erp apps/admin-erp
# NEXT_PUBLIC_* values are baked into the browser bundle at build time.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITES_ROOT_DOMAIN
ARG NEXT_PUBLIC_SUPPORT_PHONE
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
WORKDIR /repo/apps/admin-erp
RUN pnpm build

FROM node:22-alpine
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/admin-erp/.next/standalone ./
COPY --from=build /repo/apps/admin-erp/.next/static ./apps/admin-erp/.next/static
COPY --from=build /repo/apps/admin-erp/public ./apps/admin-erp/public
USER node
EXPOSE 3001
CMD ["node", "apps/admin-erp/server.js"]
