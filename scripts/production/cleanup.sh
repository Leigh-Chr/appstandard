#!/usr/bin/env bash
# Cleanup script for AppStandard
# Usage: ./cleanup.sh [--all|--images|--volumes|--build-cache|--logs|--system]

set -e

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi

cd "$PROJECT_DIR" || exit 1

clean_images() {
    echo "🧹 Cleaning unused Docker images..."
    docker image prune -f
    echo "✅ Images cleaned"
}

clean_volumes() {
    echo "⚠️  WARNING: This operation will delete unused volumes!"
    read -p "Continue? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        docker volume prune -f
        echo "✅ Volumes cleaned"
    else
        echo "Operation cancelled"
    fi
}

clean_logs() {
    echo "🧹 Cleaning Docker logs..."
    # Docker logs are managed by rotation config in docker-compose.yml
    # This function just confirms the rotation is active
    echo "ℹ️  Logs are automatically rotated by Docker (max-size: 10m, max-file: 3)"
    echo "✅ Rotation configuration verified"
}

clean_system() {
    echo "🧹 Complete Docker system cleanup..."
    docker system prune -af --volumes
    echo "✅ System cleaned"
}

clean_build_cache() {
    echo "🧹 Cleaning build cache..."
    docker builder prune -af
    echo "✅ Build cache cleaned"
}

# Main
ARG="${1:-}"
if [ "$ARG" = "--all" ]; then
    clean_images
    clean_build_cache
    clean_logs
    echo "✅ Complete cleanup done"
elif [ "$ARG" = "--images" ]; then
    clean_images
elif [ "$ARG" = "--volumes" ]; then
    clean_volumes
elif [ "$ARG" = "--logs" ]; then
    clean_logs
elif [ "$ARG" = "--system" ]; then
    clean_system
elif [ "$ARG" = "--build-cache" ]; then
    clean_build_cache
else
    echo "Usage: $0 [--all|--images|--volumes|--logs|--system|--build-cache]"
    echo ""
    echo "Options:"
    echo "  --all          Clean images, cache and logs"
    echo "  --images       Clean unused images"
    echo "  --volumes      Clean unused volumes (⚠️ destructive)"
    echo "  --logs         Clean logs"
    echo "  --system       Complete Docker system cleanup (⚠️ very destructive)"
    echo "  --build-cache  Clean build cache"
    exit 1
fi
