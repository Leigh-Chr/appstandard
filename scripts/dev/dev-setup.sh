#!/usr/bin/env bash
# Development environment setup script for AppStandard
# Supports: Calendar, Contacts, Tasks applications
# Usage: ./scripts/dev/dev-setup.sh

set -euo pipefail

# Configuration
if [ -f "docker-compose.dev.yml" ] || [ -f "package.json" ]; then
    PROJECT_DIR="$(pwd)"
else
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

cd "$PROJECT_DIR" || exit 1

# Colors for messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Generate auth secret
generate_auth_secret() {
    if command -v openssl &> /dev/null 2>&1; then
        openssl rand -hex 32
    else
        echo "change-me-in-production-min-32-characters-long"
    fi
}

# Create .env file if missing
create_env_if_missing() {
    local app_path="$1"
    local env_content="$2"
    local app_name="$3"

    if [ ! -f "$app_path/.env" ]; then
        if [ -f "$app_path/.env.example" ]; then
            warning "$app_name/.env not found. Creating from template..."
            echo "$env_content" > "$app_path/.env"
            log "Created $app_name/.env"
        else
            warning "$app_name/.env.example not found, skipping..."
        fi
    else
        log "$app_name/.env already exists"
    fi
}

log "Setting up AppStandard development environment..."

# ============================================================================
# PREREQUISITES CHECK
# ============================================================================
log "Checking prerequisites..."

MISSING_DEPS=()

if ! command -v bun &> /dev/null 2>&1; then
    MISSING_DEPS+=("bun")
fi

if ! command -v docker &> /dev/null 2>&1; then
    MISSING_DEPS+=("docker")
fi

if ! command -v git &> /dev/null 2>&1; then
    MISSING_DEPS+=("git")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    error "Missing dependencies: ${MISSING_DEPS[*]}. Please install: Bun (https://bun.sh), Docker (https://docs.docker.com/get-docker/), Git (https://git-scm.com/)"
fi

log "All prerequisites installed"

# ============================================================================
# INSTALL DEPENDENCIES
# ============================================================================
log "Installing dependencies..."
bun install
log "Dependencies installed"

# ============================================================================
# ENVIRONMENT FILES SETUP
# ============================================================================
log "Setting up environment files..."

# Generate shared auth secret for all backends
AUTH_SECRET=$(generate_auth_secret)
if [ "$AUTH_SECRET" = "change-me-in-production-min-32-characters-long" ]; then
    warning "openssl not found, using placeholder secret. Please update in production!"
fi

# Default database URL
DEFAULT_DB_URL="postgresql://appstandard:appstandard_dev@localhost:5432/appstandard_dev"

# ----------------------------------------------------------------------------
# Calendar Server (Port 3000, CORS: 3001)
# ----------------------------------------------------------------------------
create_env_if_missing "apps/calendar-server" "# PostgreSQL database (required)
DATABASE_URL=\"$DEFAULT_DB_URL\"

# Backend server port
PORT=3000

# Frontend URL for CORS (must match calendar-web port)
CORS_ORIGIN=http://localhost:3001

# Better-Auth configuration
BETTER_AUTH_SECRET=$AUTH_SECRET
BETTER_AUTH_URL=http://localhost:3000" "apps/calendar-server"

# ----------------------------------------------------------------------------
# Calendar Web (Port 3001)
# ----------------------------------------------------------------------------
create_env_if_missing "apps/calendar-web" "# Backend server URL
VITE_SERVER_URL=http://localhost:3000" "apps/calendar-web"

# ----------------------------------------------------------------------------
# Contacts Server (Port 3003, CORS: 3005)
# ----------------------------------------------------------------------------
create_env_if_missing "apps/contacts-server" "# PostgreSQL database (required)
DATABASE_URL=\"$DEFAULT_DB_URL\"

# Backend server port
PORT=3003

# Frontend URL for CORS (must match contacts-web port)
CORS_ORIGIN=http://localhost:3005" "apps/contacts-server"

# ----------------------------------------------------------------------------
# Contacts Web (Port 3005)
# ----------------------------------------------------------------------------
create_env_if_missing "apps/contacts-web" "# Backend server URL
VITE_SERVER_URL=http://localhost:3003" "apps/contacts-web"

# ----------------------------------------------------------------------------
# Tasks Server (Port 3002, CORS: 3004)
# ----------------------------------------------------------------------------
create_env_if_missing "apps/tasks-server" "# PostgreSQL database (required)
DATABASE_URL=\"$DEFAULT_DB_URL\"

# Backend server port
PORT=3002

# Frontend URL for CORS (must match tasks-web port)
CORS_ORIGIN=http://localhost:3004" "apps/tasks-server"

# ----------------------------------------------------------------------------
# Tasks Web (Port 3004)
# ----------------------------------------------------------------------------
create_env_if_missing "apps/tasks-web" "# Backend server URL
VITE_SERVER_URL=http://localhost:3002" "apps/tasks-web"

# ----------------------------------------------------------------------------
# Prisma Database Package
# ----------------------------------------------------------------------------
if [ ! -f "packages/db/.env" ]; then
    warning "packages/db/.env not found. Creating..."
    echo "DATABASE_URL=\"$DEFAULT_DB_URL\"" > packages/db/.env
    log "Created packages/db/.env"
else
    log "packages/db/.env already exists"
fi

# ============================================================================
# PRISMA CLIENT GENERATION
# ============================================================================
log "Generating Prisma client..."
bun run db:generate
log "Prisma client generated"

# ============================================================================
# DOCKER SERVICES
# ============================================================================
log "Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d

log "Waiting for services to be ready..."
until docker compose -f docker-compose.dev.yml exec -T db pg_isready -U appstandard > /dev/null 2>&1; do
    sleep 1
done

until docker compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done

log "Docker services ready"

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================
log "Initializing database schema..."
bun run db:push
log "Database initialized"

# ============================================================================
# SUMMARY
# ============================================================================
log "Setup complete!"
echo ""
echo "Development Ports:"
echo "  Calendar:  Frontend http://localhost:3001  |  Backend http://localhost:3000"
echo "  Tasks:     Frontend http://localhost:3004  |  Backend http://localhost:3002"
echo "  Contacts:  Frontend http://localhost:3005  |  Backend http://localhost:3003"
echo "  Landing:   http://localhost:3010"
echo ""
echo "Environment files created:"
echo "  - apps/calendar-server/.env"
echo "  - apps/calendar-web/.env"
echo "  - apps/contacts-server/.env"
echo "  - apps/contacts-web/.env"
echo "  - apps/tasks-server/.env"
echo "  - apps/tasks-web/.env"
echo "  - packages/db/.env"
echo ""
echo "To start development:"
echo "  bun run dev           # All apps"
echo "  bun run dev:calendar  # Calendar only"
echo "  bun run dev:contacts  # Contacts only"
echo "  bun run dev:tasks     # Tasks only"
echo ""
