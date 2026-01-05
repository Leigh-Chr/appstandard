#!/usr/bin/env bash
# Backup integrity verification script
# Usage: ./verify-backup.sh [FILE]

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"

# Use current directory if docker-compose.yml is present
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
fi

cd "$PROJECT_DIR" || exit 1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

verify_backup() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌${NC} File not found: $backup_file"
        return 1
    fi

    echo "🔍 Verifying: $backup_file"
    echo "=================================="

    # Check that file is not empty
    if [ ! -s "$backup_file" ]; then
        echo -e "${RED}❌${NC} File is empty"
        return 1
    fi

    # Check compression if .gz
    if [[ "$backup_file" == *.gz ]]; then
        echo "📦 Verifying compression..."
        if ! gzip -t "$backup_file" 2>/dev/null; then
            echo -e "${RED}❌${NC} Compressed file is corrupted"
            return 1
        fi
        echo -e "${GREEN}✅${NC} Compression valid"

        # Check SQL content
        echo "📄 Verifying SQL content..."
        if ! gunzip -c "$backup_file" | head -20 | grep -q "PostgreSQL\|COPY\|CREATE"; then
            echo -e "${YELLOW}⚠️${NC}  Content doesn't appear to be a valid PostgreSQL dump"
        else
            echo -e "${GREEN}✅${NC} SQL content valid"
        fi

        # Size
        SIZE=$(du -h "$backup_file" | cut -f1)
        echo "📊 Size: $SIZE"
    else
        # Uncompressed file
        echo "📄 Verifying SQL content..."
        if ! head -20 "$backup_file" | grep -q "PostgreSQL\|COPY\|CREATE"; then
            echo -e "${YELLOW}⚠️${NC}  Content doesn't appear to be a valid PostgreSQL dump"
        else
            echo -e "${GREEN}✅${NC} SQL content valid"
        fi

        SIZE=$(du -h "$backup_file" | cut -f1)
        echo "📊 Size: $SIZE"
    fi

    # Check creation date
    if [ -f "$backup_file" ]; then
        DATE=$(stat -c %y "$backup_file" 2>/dev/null || stat -f "%Sm" "$backup_file" 2>/dev/null)
        echo "📅 Date: $DATE"
    fi

    echo ""
    echo -e "${GREEN}✅${NC} Verification complete"
    return 0
}

# Main
if [ $# -gt 0 ] && [ -n "${1:-}" ]; then
    # Verify specific file
    # Security validation: ensure file is in BACKUP_DIR or valid absolute path
    backup_file="${1:-}"
    if [[ "$backup_file" != /* ]] && [[ "$backup_file" != ~* ]]; then
        # Relative path - convert to absolute
        backup_file="$(realpath "$backup_file" 2>/dev/null || echo "$backup_file")"
    fi

    # Check if file is in BACKUP_DIR (security)
    if [[ "$backup_file" != "$BACKUP_DIR"/* ]] && [[ "$backup_file" != "$(realpath "$BACKUP_DIR" 2>/dev/null)"/* ]]; then
        echo -e "${YELLOW}⚠️${NC}  File is not in BACKUP_DIR ($BACKUP_DIR)"
        echo -e "${YELLOW}⚠️${NC}  Verifying anyway..."
    fi

    verify_backup "$backup_file"
else
    # Verify all backups
    echo "🔍 Verifying all backups..."
    echo "=========================================="
    echo ""

    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}❌${NC} Backup directory not found: $BACKUP_DIR"
        exit 1
    fi

    BACKUPS=$(find "$BACKUP_DIR" -name "db-backup-*.sql.gz" -o -name "db-backup-*.sql" 2>/dev/null | sort -r)

    if [ -z "$BACKUPS" ]; then
        echo "No backups found in $BACKUP_DIR"
        exit 0
    fi

    COUNT=0
    VALID=0
    INVALID=0

    while IFS= read -r backup; do
        ((COUNT++))
        echo "[$COUNT] $(basename "$backup")"
        if verify_backup "$backup"; then
            ((VALID++))
        else
            ((INVALID++))
        fi
        echo ""
    done <<< "$BACKUPS"

    echo "=========================================="
    echo "Summary: $VALID valid, $INVALID invalid out of $COUNT backups"
fi
