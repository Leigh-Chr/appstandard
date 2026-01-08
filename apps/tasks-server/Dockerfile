# syntax=docker/dockerfile:1
# ===================================
# AppStandard Tasks Backend - Dockerfile
# Optimized multi-stage build with turbo prune + BuildKit cache
# ===================================

# Stage 1: Prune monorepo to only include needed packages
FROM oven/bun:1.3.5-alpine AS pruner

WORKDIR /app

# Install turbo globally for pruning
RUN bun add -g turbo

# Copy entire monorepo for pruning
COPY . .

# Prune to only tasks-server and its dependencies
# This creates out/json (package.json files) and out/full (source files)
RUN turbo prune tasks-server --docker

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

# Create empty .env for Prisma config
RUN mkdir -p apps/tasks-server && touch apps/tasks-server/.env

# Generate Prisma client (use node_modules binary to avoid bun x crash in Alpine)
RUN cd packages/db && ./node_modules/.bin/prisma generate

# Build server and ALL its dependencies with Turbo
# Remote cache will be used if TURBO_TOKEN is provided
RUN ./node_modules/.bin/turbo build --filter=tasks-server...

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

# Install production dependencies (delete any existing lockfile first)
RUN rm -f bun.lock && bun install --production --ignore-scripts

# Copy config package (no dist, just tsconfig)
COPY --chown=bunjs:nodejs --from=builder /app/packages/config ./packages/config

# Copy built packages needed by server
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/dist ./packages/db/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY --chown=bunjs:nodejs --from=builder /app/packages/auth/dist ./packages/auth/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/api-core/dist ./packages/api-core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/server-core/dist ./packages/server-core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/appstandard-tasks/api/dist ./packages/appstandard-tasks/api/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/appstandard-tasks/core/dist ./packages/appstandard-tasks/core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/appstandard-tasks/schemas/dist ./packages/appstandard-tasks/schemas/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/appstandard-tasks/todo-utils/dist ./packages/appstandard-tasks/todo-utils/dist

# Copy built server
COPY --chown=bunjs:nodejs --from=builder /app/apps/tasks-server/dist ./apps/tasks-server/dist

# Create workspace links for packages used at runtime
RUN mkdir -p node_modules/@appstandard && \
    ln -s /app/packages/config node_modules/@appstandard/config && \
    ln -s /app/packages/db node_modules/@appstandard/db && \
    ln -s /app/packages/auth node_modules/@appstandard/auth && \
    ln -s /app/packages/api-core node_modules/@appstandard/api-core && \
    ln -s /app/packages/server-core node_modules/@appstandard/server-core && \
    mkdir -p node_modules/@appstandard-tasks && \
    ln -s /app/packages/appstandard-tasks/api node_modules/@appstandard-tasks/api && \
    ln -s /app/packages/appstandard-tasks/core node_modules/@appstandard-tasks/core && \
    ln -s /app/packages/appstandard-tasks/schemas node_modules/@appstandard-tasks/schemas && \
    ln -s /app/packages/appstandard-tasks/todo-utils node_modules/@appstandard-tasks/todo-utils

# Change ownership of symlinks only (much faster than chown -R /app)
RUN chown -R bunjs:nodejs node_modules/@appstandard node_modules/@appstandard-tasks

ENV NODE_ENV=production
ENV PORT=3002

# Switch to non-root user for security
USER bunjs
WORKDIR /app/apps/tasks-server

EXPOSE 3002

# Healthcheck with proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start the server
CMD ["bun", "run", "start"]
