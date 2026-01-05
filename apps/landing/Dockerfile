# syntax=docker/dockerfile:1
# ===================================
# AppStandard Landing Page - Dockerfile
# Optimized multi-stage build for production
# ===================================

# Stage 1: Build application
# Using specific version tag instead of :latest for reproducibility
FROM oven/bun:1.3.5-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
# (this layer is cached until package files change)
COPY package.json bun.lock ./
# Core packages
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json ./packages/core/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/ics-utils/package.json ./packages/ics-utils/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/api/package.json ./packages/api/
COPY packages/api-core/package.json ./packages/api-core/
COPY packages/server-core/package.json ./packages/server-core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/react-utils/package.json ./packages/react-utils/
# AppStandard Contacts packages
COPY packages/appstandard-contacts/api/package.json ./packages/appstandard-contacts/api/
COPY packages/appstandard-contacts/core/package.json ./packages/appstandard-contacts/core/
COPY packages/appstandard-contacts/schemas/package.json ./packages/appstandard-contacts/schemas/
COPY packages/appstandard-contacts/vcard-utils/package.json ./packages/appstandard-contacts/vcard-utils/
# AppStandard Tasks packages
COPY packages/appstandard-tasks/api/package.json ./packages/appstandard-tasks/api/
COPY packages/appstandard-tasks/core/package.json ./packages/appstandard-tasks/core/
COPY packages/appstandard-tasks/schemas/package.json ./packages/appstandard-tasks/schemas/
COPY packages/appstandard-tasks/todo-utils/package.json ./packages/appstandard-tasks/todo-utils/
# Apps
COPY apps/calendar-server/package.json ./apps/calendar-server/
COPY apps/calendar-web/package.json ./apps/calendar-web/
COPY apps/contacts-server/package.json ./apps/contacts-server/
COPY apps/contacts-web/package.json ./apps/contacts-web/
COPY apps/tasks-server/package.json ./apps/tasks-server/
COPY apps/tasks-web/package.json ./apps/tasks-web/
COPY apps/landing/package.json ./apps/landing/

# Install dependencies (cached until package files change)
RUN bun install --frozen-lockfile

# Copy source code (separate layer - changes more frequently)
COPY packages ./packages
COPY apps/landing ./apps/landing
COPY turbo.json ./

# Link workspace packages for module resolution
RUN mkdir -p node_modules/@appstandard && \
    ln -s /app/packages/config node_modules/@appstandard/config && \
    ln -s /app/packages/ui node_modules/@appstandard/ui && \
    ln -s /app/packages/react-utils node_modules/@appstandard/react-utils

ENV NODE_ENV=production

# Build the frontend (production mode)
RUN cd apps/landing && NODE_ENV=production ./node_modules/.bin/vite build

# -----------------------------------
# Stage 2: Production with Nginx (minimal ~25MB image)
# Using nginx-unprivileged for security best practices (non-root user)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY apps/landing/nginx.conf /etc/nginx/conf.d/appstandard.conf

# Copy only the built static assets (no node_modules, no source)
# Note: /usr/share/nginx/html is owned by root, nginx user (101) can read it
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html

# Note: Cache directories (/var/cache/nginx, /var/run) are created via tmpfs
# in docker-compose.yml, so no need to create them here

# nginx-unprivileged runs as user 101 (nginx)
# Explicit USER directive for security scanners (redundant but explicit)
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
