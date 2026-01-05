#!/usr/bin/env bash
# Database management script for AppStandard (development)
# Usage: ./scripts/dev/dev-db.sh [push|seed|studio|reset|status]

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

# Parse command
COMMAND="${1:-help}"

case "$COMMAND" in
    push)
        ensure_db_env
        log "📦 Applying schema changes to database..."
        bun run db:push
        log "✅ Schema applied"
        ;;

    seed)
        ensure_db_env
        log "🌱 Seeding database with test data..."
        bun run db:seed
        log "✅ Database seeded"
        ;;

    studio)
        ensure_db_env
        log "🎨 Opening Prisma Studio..."
        warning "Prisma Studio will open in your browser"
        bun run db:studio
        ;;

    reset)
        warning "This operation will DELETE all data from the development database!"
        read -p "Are you sure? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            echo "Operation cancelled"
            exit 0
        fi

        ensure_db_env
        log "🗑️  Resetting database..."

        # Warn about running apps
        warning "Make sure to stop all running applications (Ctrl+C)"
        sleep 2

        # Drop and recreate the database schema
        docker compose -f docker-compose.dev.yml exec -T db psql -U appstandard -d appstandard_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" > /dev/null 2>&1 || true

        # Apply schema
        bun run db:push

        log "✅ Database reset"
        ;;

    status)
        log "📊 Database status"
        echo ""

        # Check if Docker services are running
        if ! docker compose -f docker-compose.dev.yml ps db | grep -q "Up"; then
            error "PostgreSQL container is not running. Start it with: docker compose -f docker-compose.dev.yml up -d"
        fi

        # Check connection
        if docker compose -f docker-compose.dev.yml exec -T db pg_isready -U appstandard > /dev/null 2>&1; then
            log "✅ PostgreSQL is running and accessible"
        else
            error "PostgreSQL is not ready"
        fi

        # List tables
        echo ""
        echo -e "${BLUE}📋 Database tables:${NC}"
        docker compose -f docker-compose.dev.yml exec -T db psql -U appstandard -d appstandard_dev -c "\dt" 2>/dev/null || echo "  No tables found or schema not initialized"
        ;;

    help|*)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  push     Apply schema changes to database"
        echo "  seed     Seed database with test data"
        echo "  studio   Open Prisma Studio (database GUI)"
        echo "  reset    Drop and recreate database (⚠️ destructive)"
        echo "  status   Show database status and tables"
        echo ""
        echo "Examples:"
        echo "  ./scripts/dev/dev-db.sh push"
        echo "  ./scripts/dev/dev-db.sh studio"
        echo "  ./scripts/dev/dev-db.sh status"
        ;;
esac
