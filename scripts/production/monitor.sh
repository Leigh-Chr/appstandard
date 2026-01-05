#!/usr/bin/env bash
# Monitoring script for AppStandard
# Usage: ./monitor.sh [--all|--health|--stats|--logs|--errors]

set -e

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi

cd "$PROJECT_DIR" || exit 1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

show_health() {
    echo "🏥 Service Health:"
    echo "================================"
    docker compose ps
    echo ""

    echo "🔍 Health checks:"

    # Check all backend services
    declare -A APPS=(
        ["Calendar"]="3000"
        ["Tasks"]="3002"
        ["Contacts"]="3003"
    )

    for app in "${!APPS[@]}"; do
        port="${APPS[$app]}"
        if curl -f -s "http://localhost:${port}/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} $app backend (port $port): OK"
        else
            echo -e "${RED}❌${NC} $app backend (port $port): FAILED"
        fi
    done

    # Check frontends if running
    for port in 3001 3004 3005; do
        if curl -f -s "http://localhost:${port}/nginx-health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} Frontend (port $port): OK"
        fi
    done
    echo ""
}

show_stats() {
    echo "📊 Resource Usage:"
    echo "=============================="
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo ""

    echo "💾 Disk Usage:"
    df -h | grep -E "Filesystem|/dev/"
    echo ""

    echo "🧠 Memory Usage:"
    free -h
    echo ""
}

show_logs() {
    echo "📋 Recent logs (50 lines per service):"
    echo "====================================================="

    # Get all running services
    SERVICES=$(docker compose ps --services 2>/dev/null)

    for service in $SERVICES; do
        echo ""
        echo -e "${BLUE}📌 $service:${NC}"
        docker compose logs --tail=50 "$service" 2>/dev/null || echo "  No logs available"
    done
    echo ""
}

show_errors() {
    echo "🚨 Recent errors:"
    echo "===================="
    docker compose logs --tail=100 2>/dev/null | grep -i "error\|fail\|exception" | tail -20 || echo "No recent errors found"
    echo ""
}

# Main
ARG="${1:-}"
if [ "$ARG" = "--all" ] || [ $# -eq 0 ]; then
    show_health
    show_stats
    show_errors
elif [ "$ARG" = "--health" ]; then
    show_health
elif [ "$ARG" = "--stats" ]; then
    show_stats
elif [ "$ARG" = "--logs" ]; then
    show_logs
elif [ "$ARG" = "--errors" ]; then
    show_errors
else
    echo "Usage: $0 [--health|--stats|--logs|--errors|--all]"
    exit 1
fi
