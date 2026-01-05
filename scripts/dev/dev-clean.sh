#!/usr/bin/env bash
# Development environment cleanup script for AppStandard
# Usage: ./scripts/dev/dev-clean.sh [--all] [--volumes] [--cache]

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
CLEAN_VOLUMES=false
CLEAN_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            CLEAN_VOLUMES=true
            CLEAN_CACHE=true
            shift
            ;;
        --volumes)
            CLEAN_VOLUMES=true
            shift
            ;;
        --cache)
            CLEAN_CACHE=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

log "🧹 Cleaning development environment..."

# Stop Docker services
log "🛑 Stopping Docker services..."
if [ "$CLEAN_VOLUMES" = true ]; then
    # If cleaning volumes, use down -v directly
    warning "This operation will DELETE all database data!"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Volume cleanup skipped"
        docker compose -f docker-compose.dev.yml down
    else
        log "🗑️  Stopping services and removing volumes..."
        docker compose -f docker-compose.dev.yml down -v
        log "✅ Services stopped and volumes removed"
    fi
else
    docker compose -f docker-compose.dev.yml down
    log "✅ Docker services stopped"
fi

# Clean caches
if [ "$CLEAN_CACHE" = true ]; then
    log "🗑️  Cleaning caches..."

    # Turborepo cache
    if [ -d ".turbo" ]; then
        rm -rf .turbo
        log "✅ Turborepo cache cleaned"
    fi

    # node_modules cache
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        log "✅ node_modules cache cleaned"
    fi

    # Build artifacts
    bun run clean 2>/dev/null || true
    log "✅ Build artifacts cleaned"
fi

log "✅ Cleanup complete!"
echo ""
echo "To start fresh:"
echo "  ./scripts/dev/dev-setup.sh"
