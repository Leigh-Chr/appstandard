#!/usr/bin/env bash
# Deployment script for AppStandard
# Usage: ./deploy.sh [--backup] [--migrate] [--service=SERVICE]

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
LOG_FILE="${LOG_FILE:-$HOME/deploy.log}"

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

# Check we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml not found. Are you in the project directory?"
fi

# Check prerequisites
if ! command -v docker > /dev/null 2>&1; then
    error "Docker is not installed or not in PATH"
fi

if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Start the Docker service."
fi

if ! command -v git > /dev/null 2>&1; then
    error "Git is not installed or not in PATH"
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "This directory is not a valid Git repository"
fi

# Options
DO_BACKUP=false
DO_MIGRATE=false
SERVICE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --backup)
            DO_BACKUP=true
            shift
            ;;
        --migrate)
            DO_MIGRATE=true
            shift
            ;;
        --service=*)
            SERVICE="${1#*=}"
            # Validate service name (security)
            if [[ ! "$SERVICE" =~ ^[a-zA-Z0-9_-]+$ ]]; then
                error "Invalid service name: $SERVICE (alphanumeric, dashes and underscores only)"
            fi
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

log "🚀 Starting deployment..."

# Optional backup
if [ "$DO_BACKUP" = true ]; then
    log "💾 Creating backup..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/backup.sh" ]; then
        bash "$SCRIPT_DIR/backup.sh"
    else
        warning "Backup script not found, skipping backup"
    fi
fi

# Pull latest changes
log "📥 Pulling Git changes..."
if ! git pull; then
    error "Git pull failed"
fi

# Optional migrations
if [ "$DO_MIGRATE" = true ]; then
    log "🗄️  Applying database migrations..."
    docker compose run --rm calendar-server bun run db:push || warning "Migration failed"
fi

# Deployment
log "🔨 Building and starting services..."

if [ -n "$SERVICE" ]; then
    log "Deploying service: $SERVICE"
    DOCKER_BUILDKIT=1 docker compose up -d --build "$SERVICE"
else
    log "Deploying all services"
    docker compose down
    DOCKER_BUILDKIT=1 docker compose up -d --build
fi

# Wait for services to be ready
log "⏳ Waiting for services to start..."
sleep 5

# Health check
log "🏥 Checking service health..."
if docker compose ps | grep -q "unhealthy"; then
    error "Some services are unhealthy. Check logs: docker compose logs"
fi

# Test health endpoints for all apps
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
    log "✅ Deployment completed successfully!"
else
    warning "Deployment completed with some health check failures"
fi

log "📊 Service status:"
docker compose ps
