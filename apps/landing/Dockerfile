# syntax=docker/dockerfile:1
# ===================================
# AppStandard Landing Page - Dockerfile
# Optimized multi-stage build with turbo prune + BuildKit cache
# ===================================

# Stage 1: Prune monorepo to only include needed packages
FROM oven/bun:1.3.5-alpine AS pruner

WORKDIR /app

# Install turbo globally for pruning
RUN bun add -g turbo

# Copy entire monorepo for pruning
COPY . .

# Prune to only landing and its dependencies
RUN turbo prune landing --docker

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
# Stage 3: Build (using Node.js for stability - avoids Bun SIGILL crash on some VPS CPUs)
FROM node:22-alpine AS builder

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
ENV NODE_ENV=production

# Build the frontend using Turbo (handles dependency builds automatically)
RUN ./node_modules/.bin/turbo build --filter=landing...

# -----------------------------------
# Stage 4: Production with Nginx (minimal ~25MB image)
# Using nginx-unprivileged for security best practices (non-root user)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY apps/landing/nginx.conf /etc/nginx/conf.d/appstandard.conf

# Copy only the built static assets (no node_modules, no source)
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html

# nginx-unprivileged runs as user 101 (nginx)
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
