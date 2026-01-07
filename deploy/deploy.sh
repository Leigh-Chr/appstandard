#!/bin/bash
# ===================================
# AppStandard Optimized Deployment Script
# Deploys all services with BuildKit cache and Turbo Remote Cache
# ===================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-2}"  # Limit parallel builds to 2 for 2 vCPU VPS
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"; exit 1; }

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]]; then
    error "docker-compose.yml not found. Run this script from the project root."
fi

# Parse arguments
MODE="${1:-sequential}"  # sequential, parallel, or service name
SKIP_PULL="${SKIP_PULL:-false}"

show_help() {
    echo "Usage: $0 [MODE] [OPTIONS]"
    echo ""
    echo "Modes:"
    echo "  sequential    Build and deploy services one by one (default, recommended for 2 vCPU)"
    echo "  parallel      Build all services in parallel (requires 4+ vCPU or lots of RAM)"
    echo "  <service>     Build and deploy a specific service"
    echo ""
    echo "Services:"
    echo "  calendar-server, calendar-web, tasks-server, tasks-web,"
    echo "  contacts-server, contacts-web, landing"
    echo ""
    echo "Options (via environment variables):"
    echo "  SKIP_PULL=true       Skip git pull"
    echo "  TURBO_TOKEN=xxx      Enable Turbo Remote Cache"
    echo "  TURBO_TEAM=xxx       Turbo team name"
    echo ""
    echo "Examples:"
    echo "  $0                        # Sequential deploy (recommended)"
    echo "  $0 parallel               # Parallel deploy (high memory)"
    echo "  $0 calendar-server        # Deploy only calendar-server"
    echo "  SKIP_PULL=true $0         # Deploy without git pull"
}

if [[ "${MODE}" == "-h" ]] || [[ "${MODE}" == "--help" ]]; then
    show_help
    exit 0
fi

# Start timing
START_TIME=$(date +%s)

log "Starting AppStandard deployment..."
log "Mode: ${MODE}"
log "BuildKit: enabled"
log "Parallel limit: ${COMPOSE_PARALLEL_LIMIT}"

# Check Turbo Remote Cache configuration
if [[ -n "${TURBO_TOKEN:-}" ]] && [[ -n "${TURBO_TEAM:-}" ]]; then
    success "Turbo Remote Cache: enabled (team: ${TURBO_TEAM})"
else
    warn "Turbo Remote Cache: disabled (set TURBO_TOKEN and TURBO_TEAM to enable)"
fi

# Pull latest code (unless skipped)
if [[ "${SKIP_PULL}" != "true" ]]; then
    log "Pulling latest code..."
    git fetch origin
    git reset --hard origin/master
    success "Code updated"
else
    warn "Skipping git pull"
fi

# Ensure infrastructure is running
log "Starting infrastructure services..."
docker compose up -d db redis
sleep 5

# Wait for DB to be healthy
log "Waiting for database to be ready..."
for i in {1..30}; do
    if docker compose exec -T db pg_isready -U appstandard > /dev/null 2>&1; then
        success "Database is ready"
        break
    fi
    if [[ $i -eq 30 ]]; then
        error "Database failed to start within 30 seconds"
    fi
    sleep 1
done

# Run database migrations (inside a container since Bun isn't installed on host)
log "Running database migrations..."

# Get database credentials from docker-compose environment
# IMPORTANT: defaults must match docker-compose.yml
DB_USER="${POSTGRES_USER:-appstandard}"
DB_PASS="${POSTGRES_PASSWORD:-appstandard_secret}"
DB_NAME="${POSTGRES_DB:-appstandard}"
MIGRATION_DB_URL="postgresql://${DB_USER}:${DB_PASS}@db:5432/${DB_NAME}"

# Get the docker network name from the running db container
DOCKER_NETWORK=$(docker inspect appstandard-db --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}' 2>/dev/null || echo "")
if [[ -z "${DOCKER_NETWORK}" ]]; then
    error "Could not determine Docker network from db container"
fi
log "Using Docker network: ${DOCKER_NETWORK}"

# Run migrations in a temporary Bun container connected to the docker network
if docker run --rm \
    -v "$(pwd)":/app \
    -w /app/packages/db \
    --network "${DOCKER_NETWORK}" \
    -e DATABASE_URL="${MIGRATION_DB_URL}" \
    oven/bun:1.3.5-alpine \
    sh -c "bun install --frozen-lockfile 2>/dev/null || bun install && bunx prisma migrate deploy && bunx prisma generate"; then
    success "Database migrations applied"
else
    error "Database migration failed"
fi

build_service() {
    local service=$1
    local start=$(date +%s)
    log "Building ${service}..."

    if docker compose build "${service}"; then
        local end=$(date +%s)
        local duration=$((end - start))
        success "${service} built in ${duration}s"
        return 0
    else
        error "Failed to build ${service}"
        return 1
    fi
}

deploy_service() {
    local service=$1
    log "Deploying ${service}..."
    docker compose up -d "${service}"
    success "${service} deployed"
}

# Deploy based on mode
case "${MODE}" in
    sequential)
        log "Building services sequentially (memory-safe)..."

        # Build servers first (they take longer)
        SERVERS="calendar-server tasks-server contacts-server"
        for service in $SERVERS; do
            build_service "${service}"
        done

        # Then frontends and landing
        FRONTENDS="landing calendar-web tasks-web contacts-web"
        for service in $FRONTENDS; do
            build_service "${service}"
        done

        # Deploy all at once
        log "Deploying all services..."
        docker compose up -d
        ;;

    parallel)
        log "Building all services in parallel..."
        warn "This requires significant memory. Make sure you have 16GB+ RAM or swap configured."

        # Use COMPOSE_PARALLEL_LIMIT to control parallelism
        export COMPOSE_PARALLEL_LIMIT
        docker compose build
        docker compose up -d
        ;;

    calendar-server|calendar-web|tasks-server|tasks-web|contacts-server|contacts-web|landing)
        build_service "${MODE}"
        deploy_service "${MODE}"
        ;;

    *)
        error "Unknown mode: ${MODE}. Use -h for help."
        ;;
esac

# Verify deployment
log "Verifying deployment..."
sleep 5

FAILED=0
SERVICES="calendar-server calendar-web tasks-server tasks-web contacts-server contacts-web landing"
for service in $SERVICES; do
    if docker compose ps "${service}" --format '{{.Status}}' | grep -q "healthy\|Up"; then
        success "${service}: running"
    else
        warn "${service}: not healthy (may still be starting)"
        FAILED=1
    fi
done

# Calculate total time
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_TIME / 60))
SECONDS=$((TOTAL_TIME % 60))

echo ""
echo "=========================================="
if [[ $FAILED -eq 0 ]]; then
    success "Deployment completed successfully in ${MINUTES}m ${SECONDS}s"
else
    warn "Deployment completed with warnings in ${MINUTES}m ${SECONDS}s"
    echo "Some services may need more time to become healthy."
    echo "Run 'docker compose ps' to check status."
fi
echo "=========================================="

# Show resource usage
log "Current resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -10
