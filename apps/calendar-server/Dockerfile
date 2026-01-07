# syntax=docker/dockerfile:1
# ===================================
# AppStandard Calendar Backend - Dockerfile
# Optimized multi-stage build with turbo prune + BuildKit cache
# ===================================

# Stage 1: Prune monorepo to only include needed packages
FROM oven/bun:1.3.5-alpine AS pruner

WORKDIR /app

# Install turbo globally for pruning
RUN bun add -g turbo

# Copy entire monorepo for pruning
COPY . .

# Prune to only calendar-server and its dependencies
# This creates out/json (package.json files) and out/full (source files)
RUN turbo prune calendar-server --docker

# -----------------------------------
# Stage 2: Install dependencies
FROM oven/bun:1.3.5-alpine AS installer

WORKDIR /app

# Copy pruned package.json files
COPY --from=pruner /app/out/json/ .
# Use original lockfile from build context (turbo prune lockfile may have minor diffs)
COPY bun.lock ./bun.lock

# Install dependencies with BuildKit cache mount for faster rebuilds
# Note: No --frozen-lockfile because turbo prune creates subset package.json files
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install

# -----------------------------------
# Stage 3: Build
FROM oven/bun:1.3.5-alpine AS builder

WORKDIR /app

# Copy installed node_modules from installer
COPY --from=installer /app/ .

# Copy pruned source files
COPY --from=pruner /app/out/full/ .

# Turbo Remote Cache configuration (optional - speeds up CI/CD builds)
ARG TURBO_TOKEN
ARG TURBO_TEAM
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TURBO_TEAM=$TURBO_TEAM

# Create empty .env for Prisma config (prisma.config.ts reads from apps/calendar-server/.env)
RUN mkdir -p apps/calendar-server && touch apps/calendar-server/.env

# Generate Prisma client
RUN cd packages/db && bun x prisma generate

# Build server and ALL its dependencies with Turbo
# Remote cache will be used if TURBO_TOKEN is provided
RUN ./node_modules/.bin/turbo build --filter=calendar-server...

# -----------------------------------
# Stage 4: Production runtime
FROM oven/bun:1.3.5-alpine AS runner

WORKDIR /app

# Create non-root user FIRST (before any file operations)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy pruned package.json files for production install
COPY --from=pruner /app/out/json/ .
# Use pruned lockfile from turbo (matches pruned package.json files)
COPY --from=pruner /app/out/bun.lock ./bun.lock

# Install production dependencies only (allow lockfile updates for pruned subset)
RUN bun install --production --ignore-scripts --no-save

# Copy config package (no dist, just tsconfig)
COPY --chown=bunjs:nodejs --from=builder /app/packages/config ./packages/config

# Copy built packages needed by server (api -> auth, core, db, schemas, api-core, server-core)
COPY --chown=bunjs:nodejs --from=builder /app/packages/core/dist ./packages/core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/schemas/dist ./packages/schemas/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/dist ./packages/db/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY --chown=bunjs:nodejs --from=builder /app/packages/auth/dist ./packages/auth/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/api/dist ./packages/api/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/api-core/dist ./packages/api-core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/server-core/dist ./packages/server-core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/ics-utils/dist ./packages/ics-utils/dist

# Copy built server
COPY --chown=bunjs:nodejs --from=builder /app/apps/calendar-server/dist ./apps/calendar-server/dist

# Create workspace links for packages used at runtime
RUN mkdir -p node_modules/@appstandard && \
    ln -s /app/packages/config node_modules/@appstandard/config && \
    ln -s /app/packages/core node_modules/@appstandard/core && \
    ln -s /app/packages/schemas node_modules/@appstandard/schemas && \
    ln -s /app/packages/db node_modules/@appstandard/db && \
    ln -s /app/packages/auth node_modules/@appstandard/auth && \
    ln -s /app/packages/api node_modules/@appstandard/api && \
    ln -s /app/packages/api-core node_modules/@appstandard/api-core && \
    ln -s /app/packages/server-core node_modules/@appstandard/server-core && \
    ln -s /app/packages/ics-utils node_modules/@appstandard/ics-utils

# Change ownership of symlinks and runtime directories only (much faster than chown -R /app)
RUN chown -R bunjs:nodejs node_modules/@appstandard

ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user for security
USER bunjs
WORKDIR /app/apps/calendar-server

EXPOSE 3000

# Healthcheck with proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the server
CMD ["bun", "run", "start"]
