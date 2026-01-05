#!/usr/bin/env bash
# Status report script for AppStandard
# Usage: ./report.sh [--format=text|json] [--output=FILE]

set -e

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi

cd "$PROJECT_DIR" || exit 1

FORMAT="text"
OUTPUT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --format=*)
            FORMAT="${1#*=}"
            shift
            ;;
        --output=*)
            OUTPUT="${1#*=}"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Function to get output
get_output() {
    if [ -n "$OUTPUT" ]; then
        echo "$1" >> "$OUTPUT"
    else
        echo "$1"
    fi
}

generate_text_report() {
    get_output "📊 Status Report - AppStandard"
    get_output "Date: $(date)"
    get_output "=================================="
    get_output ""

    get_output "🐳 Docker Services:"
    if [ -n "$OUTPUT" ]; then
        docker compose ps >> "$OUTPUT" 2>&1
    else
        docker compose ps
    fi
    get_output ""

    get_output "💻 Resources:"
    if [ -n "$OUTPUT" ]; then
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" >> "$OUTPUT" 2>&1
    else
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    fi
    get_output ""

    get_output "💾 Disk:"
    if [ -n "$OUTPUT" ]; then
        df -h / >> "$OUTPUT" 2>&1
    else
        df -h /
    fi
    get_output ""

    get_output "🧠 Memory:"
    if [ -n "$OUTPUT" ]; then
        free -h >> "$OUTPUT" 2>&1
    else
        free -h
    fi
    get_output ""

    get_output "🔍 Health Checks:"

    # Check all apps
    declare -A APPS=(
        ["Calendar"]="3000"
        ["Tasks"]="3002"
        ["Contacts"]="3003"
    )

    for app in "${!APPS[@]}"; do
        port="${APPS[$app]}"
        if curl -f -s "http://localhost:${port}/health" > /dev/null 2>&1; then
            get_output "✅ $app backend: OK"
        else
            get_output "❌ $app backend: FAILED"
        fi
    done
    get_output ""

    get_output "💾 Recent backups:"
    BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
    if [ -d "$BACKUP_DIR" ]; then
        BACKUP_LIST=$(ls -lht "$BACKUP_DIR"/db-backup-*.sql.gz 2>/dev/null | head -5 | awk '{print $9, "(" $5 ")"}')
        if [ -n "$OUTPUT" ]; then
            echo "$BACKUP_LIST" >> "$OUTPUT" 2>&1
        else
            echo "$BACKUP_LIST"
        fi
    else
        get_output "No backups found"
    fi
    get_output ""

    get_output "🚨 Recent errors (last 20):"
    ERRORS=$(docker compose logs --tail=100 2>&1 | grep -i "error\|fail\|exception" | tail -20)
    if [ -n "$OUTPUT" ]; then
        echo "$ERRORS" >> "$OUTPUT" 2>&1
    else
        echo "$ERRORS"
    fi
}

generate_json_report() {
    # Check health for all apps
    CALENDAR_HEALTH=$(curl -f -s http://localhost:3000/health > /dev/null 2>&1 && echo "ok" || echo "failed")
    TASKS_HEALTH=$(curl -f -s http://localhost:3002/health > /dev/null 2>&1 && echo "ok" || echo "failed")
    CONTACTS_HEALTH=$(curl -f -s http://localhost:3003/health > /dev/null 2>&1 && echo "ok" || echo "failed")

    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

    BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
    BACKUP_COUNT=0
    if [ -d "$BACKUP_DIR" ]; then
        BACKUP_COUNT=$(find "$BACKUP_DIR" -name "db-backup-*.sql.gz" 2>/dev/null | wc -l)
    fi

    cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "services": {
    "calendar": "$CALENDAR_HEALTH",
    "tasks": "$TASKS_HEALTH",
    "contacts": "$CONTACTS_HEALTH"
  },
  "resources": {
    "disk_usage_percent": $DISK_USAGE,
    "memory_usage_percent": $MEM_USAGE
  },
  "backups": {
    "count": $BACKUP_COUNT
  },
  "docker": {
    "containers": $(docker compose ps --format json 2>/dev/null | (command -v jq > /dev/null 2>&1 && jq -s '.' || echo "[]") || echo "[]")
  }
}
EOF
}

# Main
if [ "$FORMAT" = "json" ]; then
    if [ -n "$OUTPUT" ]; then
        generate_json_report > "$OUTPUT"
    else
        generate_json_report
    fi
else
    generate_text_report
fi
