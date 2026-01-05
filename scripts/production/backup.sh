#!/usr/bin/env bash
# Backup script for AppStandard
# Usage: ./backup.sh [--list] [--restore=FILE]

set -euo pipefail

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Functions
backup_database() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/db-backup-$timestamp.sql"

    echo "💾 Backing up database..."
    cd "$PROJECT_DIR" || exit 1

    if docker compose exec -T db pg_dump -U appstandard appstandard > "$backup_file"; then
        # Compress backup
        gzip "$backup_file"
        echo "✅ Backup created: ${backup_file}.gz"

        # Clean old backups
        find "$BACKUP_DIR" -name "db-backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete
        echo "🧹 Old backups removed (> $RETENTION_DAYS days)"
    else
        echo "❌ Backup failed"
        exit 1
    fi
}

restore_database() {
    local backup_file="$1"
    local non_interactive="${2:-false}"

    # Path validation (security)
    if [[ "$backup_file" != /* ]] && [[ "$backup_file" != ~* ]]; then
        # Relative path - convert to absolute
        backup_file="$(realpath "$backup_file" 2>/dev/null || echo "$backup_file")"
    fi

    if [ ! -f "$backup_file" ]; then
        echo "❌ Backup file not found: $backup_file"
        return 1
    fi

    # Check that db container is running
    cd "$PROJECT_DIR" || return 1
    if ! docker compose ps db | grep -q "Up"; then
        echo "❌ Database container is not running"
        return 1
    fi

    if [ "$non_interactive" != "true" ]; then
        echo "⚠️  WARNING: This operation will overwrite the current database!"
        read -p "Continue? (yes/no): " confirm

        if [ "$confirm" != "yes" ]; then
            echo "Operation cancelled"
            return 0
        fi
    fi

    # Decompress if necessary
    if [[ "$backup_file" == *.gz ]]; then
        echo "📦 Decompressing backup..."
        if ! gunzip -c "$backup_file" | docker compose exec -T db psql -U appstandard appstandard; then
            echo "❌ Restore failed"
            return 1
        fi
    else
        if ! docker compose exec -T db psql -U appstandard appstandard < "$backup_file"; then
            echo "❌ Restore failed"
            return 1
        fi
    fi

    echo "✅ Database restored"
    return 0
}

list_backups() {
    echo "📋 Available backups:"
    ls -lh "$BACKUP_DIR"/db-backup-*.sql.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}' || echo "  No backups found"
}

# Main
if [ $# -eq 0 ]; then
    backup_database
elif [ "${1:-}" = "--list" ]; then
    list_backups
elif [[ "${1:-}" == --restore=* ]]; then
    restore_file="${1#*=}"
    if ! restore_database "$restore_file" "false"; then
        exit 1
    fi
else
    echo "Usage: $0 [--list] [--restore=FILE]"
    exit 1
fi
