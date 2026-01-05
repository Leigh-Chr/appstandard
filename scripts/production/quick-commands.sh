#!/usr/bin/env bash
# Quick commands for AppStandard
# Usage: ./quick-commands.sh [command]

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi

cd "$PROJECT_DIR" || exit 1

case "${1:-}" in
    status|ps)
        docker compose ps
        ;;
    logs)
        docker compose logs -f "${2:-}"
        ;;
    restart)
        docker compose restart "${2:-}"
        ;;
    stop)
        docker compose stop "${2:-}"
        ;;
    start)
        docker compose start "${2:-}"
        ;;
    shell-db)
        docker compose exec db psql -U appstandard -d appstandard
        ;;
    shell-server)
        docker compose exec server sh
        ;;
    shell-web)
        docker compose exec web sh
        ;;
    stats)
        docker stats
        ;;
    top)
        docker compose top
        ;;
    env)
        docker compose config
        ;;
    ""|*)
        echo "Quick commands for AppStandard"
        echo ""
        echo "Usage: $0 [command] [service]"
        echo ""
        echo "Available commands:"
        echo "  status, ps          Show service status"
        echo "  logs [service]      Show logs (all or specific service)"
        echo "  restart [service]   Restart service or all"
        echo "  stop [service]      Stop service or all"
        echo "  start [service]     Start service or all"
        echo "  shell-db            Open PostgreSQL shell"
        echo "  shell-server        Open shell in server container"
        echo "  shell-web           Open shell in web container"
        echo "  stats               Show container statistics"
        echo "  top                 Show container processes"
        echo "  env                 Show Docker Compose configuration"
        echo ""
        echo "Examples:"
        echo "  $0 logs server        # Backend logs"
        echo "  $0 restart web        # Restart frontend"
        echo "  $0 shell-db           # Access PostgreSQL"
        ;;
esac
