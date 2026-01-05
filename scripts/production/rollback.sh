#!/usr/bin/env bash
# Rollback script for AppStandard
# Usage: ./rollback.sh [--commit=HASH] [--no-backup] [--no-db]

set -euo pipefail

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
LOG_FILE="${LOG_FILE:-$HOME/rollback.log}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

cd "$PROJECT_DIR" || error "Cannot access project directory"

# Check we're in a Git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "This directory is not a Git repository"
fi

# Options
COMMIT_HASH=""
DO_BACKUP=true
SKIP_DB=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --commit=*)
            COMMIT_HASH="${1#*=}"
            shift
            ;;
        --no-backup)
            DO_BACKUP=false
            shift
            ;;
        --no-db)
            SKIP_DB=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

log "🔄 Starting rollback..."

# Optional backup
if [ "$DO_BACKUP" = true ]; then
    log "💾 Creating backup before rollback..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/backup.sh" ]; then
        bash "$SCRIPT_DIR/backup.sh" || warning "Backup failed, continuing with rollback"
    fi
fi

# Get target commit
if [ -z "$COMMIT_HASH" ]; then
    log "📋 Recent commits:"
    git log --oneline -10
    echo ""
    read -p "Enter commit hash (or 'HEAD~1' for previous): " COMMIT_HASH

    if [ -z "$COMMIT_HASH" ]; then
        error "No commit specified"
    fi
fi

# Validate commit format (security)
if [[ ! "$COMMIT_HASH" =~ ^[a-f0-9]{7,40}$|^HEAD(~[0-9]+)?$ ]]; then
    error "Invalid commit format: $COMMIT_HASH"
fi

# Check commit exists
if ! git rev-parse --verify "$COMMIT_HASH" > /dev/null 2>&1; then
    error "Commit '$COMMIT_HASH' not found"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warning "There are uncommitted changes"
    warning "They will be lost during rollback"
    read -p "Continue anyway? (yes/no): " confirm_unsaved
    if [ "$confirm_unsaved" != "yes" ]; then
        log "Rollback cancelled"
        exit 0
    fi
fi

# Show target commit info
log "📌 Target commit:"
git log -1 --oneline "$COMMIT_HASH"
echo ""

# Confirmation
echo "⚠️  WARNING: This operation will revert to commit $COMMIT_HASH"
echo "   Uncommitted changes will be lost!"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log "Rollback cancelled"
    exit 0
fi

# Save current state (for potential recovery)
CURRENT_COMMIT=$(git rev-parse HEAD)
log "📍 Current commit saved: $CURRENT_COMMIT"

# Check that docker-compose.yml exists in target commit
TARGET_COMPOSE=$(git show "$COMMIT_HASH:docker-compose.yml" 2>/dev/null)
if [ -z "$TARGET_COMPOSE" ]; then
    error "Commit $COMMIT_HASH does not contain docker-compose.yml"
fi

# Git rollback
log "🔄 Reverting to commit $COMMIT_HASH..."
if ! git checkout "$COMMIT_HASH"; then
    error "Checkout failed. Check for conflicts or unsaved changes."
fi

# Database rollback (if needed and not skipped)
if [ "$SKIP_DB" = false ]; then
    log "🗄️  Checking database migrations..."
    # Note: In production, we don't rollback DB automatically
    # as this can cause data loss. Admin must decide.
    warning "Database rollback not performed automatically for safety."
    warning "If needed, restore manually with: ./backup.sh --restore=FILE"
fi

# Rebuild and restart
log "🔨 Rebuilding and restarting services..."
docker compose down
DOCKER_BUILDKIT=1 docker compose up -d --build

# Wait for services to be ready
log "⏳ Waiting for services to start..."
sleep 5

# Health check
log "🏥 Checking service health..."
if docker compose ps | grep -q "unhealthy"; then
    error "Some services are unhealthy after rollback. Check logs."
fi

# Test health endpoints
log "🔍 Testing health endpoints..."
HEALTH_OK=true
for port in 3000 3002 3003; do
    if curl -f -s "http://localhost:${port}/health" > /dev/null 2>&1; then
        log "✅ Health check OK on port ${port}"
    else
        warning "Health check failed on port ${port}"
        HEALTH_OK=false
    fi
done

if [ "$HEALTH_OK" = true ]; then
    log "✅ Rollback completed successfully!"
else
    warning "Rollback completed with some health check failures"
fi

log "📊 Service status:"
docker compose ps

echo ""
log "💡 To revert to previous commit ($CURRENT_COMMIT):"
log "   git checkout $CURRENT_COMMIT && ./deploy.sh"
