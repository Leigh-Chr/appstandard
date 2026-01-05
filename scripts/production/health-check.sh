#!/usr/bin/env bash
# Health check script for AppStandard
# Usage: ./health-check.sh [--verbose]

set -e

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi

VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

cd "$PROJECT_DIR" || exit 1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0

check() {
    local name="$1"
    local command="$2"

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $name"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $name"
        ((FAILED++))
        if [ "$VERBOSE" = true ]; then
            echo "   Command: $command"
        fi
        return 1
    fi
}

echo "🏥 Health Check - AppStandard"
echo "======================================"
echo ""

# Docker checks
echo "🐳 Docker Services:"
check "Containers running" "docker compose ps | grep -q 'Up'"
check "No unhealthy containers" "! docker compose ps | grep -q 'unhealthy'"

# Health endpoints for all apps
echo ""
echo "🔍 Health Endpoints:"

# App configurations: name:backend_port:frontend_port
declare -A APPS=(
    ["Calendar"]="3000:3001"
    ["Tasks"]="3002:3004"
    ["Contacts"]="3003:3005"
)

for app in "${!APPS[@]}"; do
    IFS=':' read -r backend_port frontend_port <<< "${APPS[$app]}"
    check "$app backend (port $backend_port)" "curl -f -s --max-time 5 http://localhost:${backend_port}/health"
done

# Check nginx health on frontends (if deployed)
for app in "${!APPS[@]}"; do
    IFS=':' read -r backend_port frontend_port <<< "${APPS[$app]}"
    if curl -f -s --max-time 2 "http://localhost:${frontend_port}/nginx-health" > /dev/null 2>&1; then
        check "$app frontend (port $frontend_port)" "curl -f -s --max-time 5 http://localhost:${frontend_port}/nginx-health"
    fi
done

# Database checks
echo ""
echo "🗄️  Database:"
check "PostgreSQL accessible" "docker compose exec -T db pg_isready -U appstandard"
check "Database connection" "docker compose exec -T db psql -U appstandard -d appstandard -c 'SELECT 1' > /dev/null"

# Network checks
echo ""
echo "🌐 Network:"
check "Backend port 3000 accessible" "docker compose ps | grep -q '3000'"
check "Database port 5432 accessible" "docker compose ps | grep -q '5432'"

# HTTPS checks (if configured)
if [ -f "/etc/nginx/sites-available/appstandard" ]; then
    echo ""
    echo "🔒 HTTPS:"
    # Use configured domain from environment or default
    DOMAIN="${APPSTANDARD_DOMAIN:-localhost}"
    if [ "$DOMAIN" != "localhost" ]; then
        check "SSL certificate valid" "curl -f -s https://${DOMAIN} > /dev/null"
        check "HSTS header present" "curl -sI https://${DOMAIN} | grep -q 'Strict-Transport-Security'"
    fi
fi

# Resource checks
echo ""
echo "💻 Resources:"
if command -v df > /dev/null 2>&1; then
    DISK_USAGE=$(df -h / 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//' || echo "0")
    if [ -n "$DISK_USAGE" ] && [ "$DISK_USAGE" -gt 0 ] 2>/dev/null; then
        if [ "$DISK_USAGE" -lt 80 ]; then
            echo -e "${GREEN}✅${NC} Disk space OK (${DISK_USAGE}% used)"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠️${NC}  Disk space high (${DISK_USAGE}% used)"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⚠️${NC}  Unable to check disk space"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  'df' command not available"
    ((FAILED++))
fi

if command -v free > /dev/null 2>&1; then
    MEM_USAGE=$(free 2>/dev/null | awk 'NR==2{printf "%.0f", $3*100/$2}' || echo "0")
    if [ -n "$MEM_USAGE" ] && [ "$MEM_USAGE" -gt 0 ] 2>/dev/null; then
        if [ "$MEM_USAGE" -lt 90 ]; then
            echo -e "${GREEN}✅${NC} Memory OK (${MEM_USAGE}% used)"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠️${NC}  Memory high (${MEM_USAGE}% used)"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⚠️${NC}  Unable to check memory"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  'free' command not available"
    ((FAILED++))
fi

# Summary
echo ""
echo "======================================"
echo "Summary: ${GREEN}$PASSED${NC} passed, ${RED}$FAILED${NC} failed"

if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
