# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @plal/api prisma:generate
RUN pnpm --filter @plal/api build

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

COPY --from=build /app ./

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
