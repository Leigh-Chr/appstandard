# syntax=docker/dockerfile:1
# ===================================
# AppStandard Contacts Backend - Dockerfile
# Optimized multi-stage build with turbo prune + BuildKit cache
# ===================================

# Stage 1: Prune monorepo to only include needed packages
FROM oven/bun:1.3.5-alpine AS pruner

WORKDIR /app

# Install turbo globally for pruning
RUN bun add -g turbo

# Copy entire monorepo for pruning
COPY . .

# Prune to only contacts-server and its dependencies
# This creates out/json (package.json files) and out/full (source files)
RUN turbo prune contacts-server --docker

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
RUN mkdir -p apps/contacts-server && touch apps/contacts-server/.env

# Generate Prisma client
RUN cd packages/db && bun x prisma generate

# Build server and ALL its dependencies with Turbo
# Remote cache will be used if TURBO_TOKEN is provided
RUN ./node_modules/.bin/turbo build --filter=contacts-server...

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

# Install production dependencies without lockfile (turbo prune subset may differ)
RUN bun install --production --ignore-scripts

# Copy config package (no dist, just tsconfig)
COPY --chown=bunjs:nodejs --from=builder /app/packages/config ./packages/config

# Copy built packages needed by server
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/dist ./packages/db/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --chown=bunjs:nodejs --from=builder /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY --chown=bunjs:nodejs --from=builder /app/packages/auth/dist ./packages/auth/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/api-core/dist ./packages/api-core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/server-core/dist ./packages/server-core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/appstandard-contacts/api/dist ./packages/appstandard-contacts/api/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/appstandard-contacts/core/dist ./packages/appstandard-contacts/core/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/appstandard-contacts/schemas/dist ./packages/appstandard-contacts/schemas/dist
COPY --chown=bunjs:nodejs --from=builder /app/packages/appstandard-contacts/vcard-utils/dist ./packages/appstandard-contacts/vcard-utils/dist

# Copy built server
COPY --chown=bunjs:nodejs --from=builder /app/apps/contacts-server/dist ./apps/contacts-server/dist

# Create workspace links for packages used at runtime
RUN mkdir -p node_modules/@appstandard && \
    ln -s /app/packages/config node_modules/@appstandard/config && \
    ln -s /app/packages/db node_modules/@appstandard/db && \
    ln -s /app/packages/auth node_modules/@appstandard/auth && \
    ln -s /app/packages/api-core node_modules/@appstandard/api-core && \
    ln -s /app/packages/server-core node_modules/@appstandard/server-core && \
    mkdir -p node_modules/@appstandard-contacts && \
    ln -s /app/packages/appstandard-contacts/api node_modules/@appstandard-contacts/api && \
    ln -s /app/packages/appstandard-contacts/core node_modules/@appstandard-contacts/core && \
    ln -s /app/packages/appstandard-contacts/schemas node_modules/@appstandard-contacts/schemas && \
    ln -s /app/packages/appstandard-contacts/vcard-utils node_modules/@appstandard-contacts/vcard-utils

# Change ownership of symlinks only (much faster than chown -R /app)
RUN chown -R bunjs:nodejs node_modules/@appstandard node_modules/@appstandard-contacts

ENV NODE_ENV=production
ENV PORT=3003

# Switch to non-root user for security
USER bunjs
WORKDIR /app/apps/contacts-server

EXPOSE 3003

# Healthcheck with proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Start the server
CMD ["bun", "run", "start"]
