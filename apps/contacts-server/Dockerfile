# syntax=docker/dockerfile:1
# ===================================
# AppStandard Contacts Backend - Dockerfile
# Optimized multi-stage build for production
# ===================================

# Stage 1: Build
# Using specific version tag instead of :latest for reproducibility
FROM oven/bun:1.3.5-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lock ./
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json ./packages/core/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/ics-utils/package.json ./packages/ics-utils/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/api/package.json ./packages/api/
COPY packages/api-core/package.json ./packages/api-core/
COPY packages/server-core/package.json ./packages/server-core/
COPY packages/react-utils/package.json ./packages/react-utils/
COPY packages/ui/package.json ./packages/ui/
COPY packages/appstandard-contacts/api/package.json ./packages/appstandard-contacts/api/
COPY packages/appstandard-contacts/core/package.json ./packages/appstandard-contacts/core/
COPY packages/appstandard-contacts/schemas/package.json ./packages/appstandard-contacts/schemas/
COPY packages/appstandard-contacts/vcard-utils/package.json ./packages/appstandard-contacts/vcard-utils/
COPY apps/contacts-server/package.json ./apps/contacts-server/
COPY apps/contacts-web/package.json ./apps/contacts-web/

# Install dependencies (cached until package files change)
RUN bun install --frozen-lockfile

# Copy source code
COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/contacts-server ./apps/contacts-server

# Create empty .env for Prisma config
RUN mkdir -p apps/contacts-server && touch apps/contacts-server/.env

# Link workspace packages for build
RUN mkdir -p node_modules/@appstandard && \
    ln -s /app/packages/config node_modules/@appstandard/config

# Generate Prisma client
RUN cd packages/db && bun x prisma generate

# Build server and ALL its dependencies
RUN ./node_modules/.bin/turbo build --filter=contacts-server...

# -----------------------------------
# Stage 2: Production runtime
# Using specific version tag instead of :latest for reproducibility
FROM oven/bun:1.3.5-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files for production install
COPY package.json bun.lock ./
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json ./packages/core/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/api/package.json ./packages/api/
COPY packages/api-core/package.json ./packages/api-core/
COPY packages/server-core/package.json ./packages/server-core/
COPY packages/appstandard-contacts/api/package.json ./packages/appstandard-contacts/api/
COPY packages/appstandard-contacts/core/package.json ./packages/appstandard-contacts/core/
COPY packages/appstandard-contacts/schemas/package.json ./packages/appstandard-contacts/schemas/
COPY packages/appstandard-contacts/vcard-utils/package.json ./packages/appstandard-contacts/vcard-utils/
COPY apps/contacts-server/package.json ./apps/contacts-server/
# Include web package.json for workspace resolution (needed by bun)
COPY apps/contacts-web/package.json ./apps/contacts-web/
COPY packages/ics-utils/package.json ./packages/ics-utils/
COPY packages/react-utils/package.json ./packages/react-utils/
COPY packages/ui/package.json ./packages/ui/

# Install production dependencies (skip prepare scripts like husky)
RUN bun install --frozen-lockfile --production --ignore-scripts

# Copy config package (no dist, just tsconfig)
COPY --from=builder /app/packages/config ./packages/config

# Copy built packages needed by server
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY --from=builder /app/packages/auth/dist ./packages/auth/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api-core/dist ./packages/api-core/dist
COPY --from=builder /app/packages/server-core/dist ./packages/server-core/dist
COPY --from=builder /app/packages/appstandard-contacts/api/dist ./packages/appstandard-contacts/api/dist
COPY --from=builder /app/packages/appstandard-contacts/core/dist ./packages/appstandard-contacts/core/dist
COPY --from=builder /app/packages/appstandard-contacts/schemas/dist ./packages/appstandard-contacts/schemas/dist
COPY --from=builder /app/packages/appstandard-contacts/vcard-utils/dist ./packages/appstandard-contacts/vcard-utils/dist

# Copy built server
COPY --from=builder /app/apps/contacts-server/dist ./apps/contacts-server/dist

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
    mkdir -p node_modules/@appstandard-contacts && \
    ln -s /app/packages/appstandard-contacts/api node_modules/@appstandard-contacts/api && \
    ln -s /app/packages/appstandard-contacts/core node_modules/@appstandard-contacts/core && \
    ln -s /app/packages/appstandard-contacts/schemas node_modules/@appstandard-contacts/schemas && \
    ln -s /app/packages/appstandard-contacts/vcard-utils node_modules/@appstandard-contacts/vcard-utils

# Set ownership
RUN chown -R bunjs:nodejs /app

ENV NODE_ENV=production
ENV PORT=3003

# Switch to non-root user for security
USER bunjs
WORKDIR /app/apps/contacts-server

EXPOSE 3003

# Healthcheck with proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Start the server using the start script from package.json
CMD ["bun", "run", "start"]
