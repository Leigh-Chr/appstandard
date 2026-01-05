#!/usr/bin/env bash
# Development environment startup script for AppStandard
# Supports: Calendar, Contacts, Tasks applications
# Usage: ./scripts/dev/dev.sh [--no-db] [--no-apps]

set -euo pipefail

# Configuration
if [ -f "docker-compose.dev.yml" ] || [ -f "package.json" ]; then
    PROJECT_DIR="$(pwd)"
else
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

cd "$PROJECT_DIR" || exit 1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Parse arguments
START_DB=true
START_APPS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-db)
            START_DB=false
            shift
            ;;
        --no-apps)
            START_APPS=false
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

log "🚀 Starting AppStandard development environment..."

# Check prerequisites
if ! command -v bun &> /dev/null 2>&1; then
    error "Bun is not installed or not in PATH. Install Bun: https://bun.sh"
fi

if ! command -v docker &> /dev/null 2>&1; then
    error "Docker is not installed or not in PATH"
fi

if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Start the Docker service."
fi

# Start Docker services
if [ "$START_DB" = true ]; then
    log "📦 Starting Docker services (PostgreSQL + Redis)..."

    if ! docker compose -f docker-compose.dev.yml up -d; then
        error "Failed to start Docker services"
    fi

    log "⏳ Waiting for PostgreSQL to be ready..."
    until docker compose -f docker-compose.dev.yml exec -T db pg_isready -U appstandard > /dev/null 2>&1; do
        sleep 1
    done

    log "⏳ Waiting for Redis to be ready..."
    until docker compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1; do
        sleep 1
    done

    log "✅ Docker services ready"
fi

# Ensure packages/db/.env exists
ensure_db_env() {
    if [ ! -f "packages/db/.env" ]; then
        warning "packages/db/.env not found. Creating..."
        # Try to get DATABASE_URL from any server .env
        for server_env in apps/calendar-server/.env apps/tasks-server/.env apps/contacts-server/.env; do
            if [ -f "$server_env" ]; then
                SERVER_DB_URL=$(grep "^DATABASE_URL=" "$server_env" | cut -d'=' -f2- | tr -d '"' || echo "")
                if [ -n "$SERVER_DB_URL" ]; then
                    echo "DATABASE_URL=\"$SERVER_DB_URL\"" > packages/db/.env
                    log "✅ packages/db/.env created with DATABASE_URL from $server_env"
                    return
                fi
            fi
        done
        # Use default values
        echo 'DATABASE_URL="postgresql://appstandard:appstandard_dev@localhost:5432/appstandard_dev"' > packages/db/.env
        log "✅ packages/db/.env created with default values"
    elif grep -q "placeholder" packages/db/.env 2>/dev/null; then
        warning "packages/db/.env contains placeholder values. Fixing..."
        echo 'DATABASE_URL="postgresql://appstandard:appstandard_dev@localhost:5432/appstandard_dev"' > packages/db/.env
        log "✅ packages/db/.env fixed with default values"
    fi
}

# Check database initialization
if [ "$START_DB" = true ] && [ "$START_APPS" = true ]; then
    log "🔍 Checking database initialization..."

    # Ensure packages/db/.env exists and is correct
    ensure_db_env

    # Check if Prisma client is generated
    if [ ! -d "packages/db/node_modules/.prisma" ]; then
        warning "Prisma client not generated. Generating..."
        bun run db:generate
    fi

    # Check if database has tables
    TABLE_COUNT=$(docker compose -f docker-compose.dev.yml exec -T db psql -U appstandard -d appstandard_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    if [ -z "$TABLE_COUNT" ] || [ "$TABLE_COUNT" = "0" ]; then
        warning "Database schema not initialized. Applying schema..."
        bun run db:push
    else
        log "✅ Database initialized (${TABLE_COUNT} tables found)"
    fi
fi

# Start applications
if [ "$START_APPS" = true ]; then
    log "🎨 Starting development servers..."
    echo ""
    echo -e "${BLUE}Development Ports:${NC}"
    echo -e "  ${GREEN}Calendar:${NC}  Frontend http://localhost:3001  |  Backend http://localhost:3000"
    echo -e "  ${GREEN}Tasks:${NC}     Frontend http://localhost:3004  |  Backend http://localhost:3002"
    echo -e "  ${GREEN}Contacts:${NC}  Frontend http://localhost:3005  |  Backend http://localhost:3003"
    echo -e "  ${GREEN}Landing:${NC}   http://localhost:3010"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""

    bun run dev
else
    log "✅ Docker services running"
    echo ""
    echo "To start applications, run:"
    echo "  bun run dev           # All apps"
    echo "  bun run dev:calendar  # Calendar only"
    echo "  bun run dev:tasks     # Tasks only"
    echo "  bun run dev:contacts  # Contacts only"
fi

