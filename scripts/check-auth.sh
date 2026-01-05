#!/usr/bin/env bash
# Authentication diagnostic script for AppStandard
# Supports: Calendar, Contacts, Tasks applications

echo "🔍 AppStandard Authentication Diagnostic"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $1"
        return 0
    else
        echo -e "${RED}❌${NC} $1"
        return 1
    fi
}

warn() {
    echo -e "${YELLOW}⚠️${NC}  $1"
}

# Application configurations
declare -A APPS=(
    ["calendar"]="apps/calendar-server:3000:3001"
    ["tasks"]="apps/tasks-server:3002:3004"
    ["contacts"]="apps/contacts-server:3003:3005"
)

# 1. Check .env files
echo "1. Checking .env files"
echo "-----------------------------------"

# Check packages/db/.env
if [ -f "packages/db/.env" ]; then
    check "packages/db/.env exists"
    if grep -q "placeholder" packages/db/.env 2>/dev/null; then
        warn "packages/db/.env contains placeholder values - must be fixed"
    fi
else
    warn "packages/db/.env missing - required for Prisma (will be auto-created by dev-setup.sh)"
fi

# Check each server .env
for app in calendar tasks contacts; do
    server_dir="apps/${app}-server"
    web_dir="apps/${app}-web"

    if [ -f "${server_dir}/.env" ]; then
        check "${server_dir}/.env exists"
    else
        warn "${server_dir}/.env missing - create from .env.example"
    fi

    if [ -f "${web_dir}/.env" ]; then
        check "${web_dir}/.env exists"
    else
        warn "${web_dir}/.env missing - create from .env.example"
    fi
done
echo ""

# 2. Check backend environment variables (using calendar-server as reference)
echo "2. Checking backend variables (apps/calendar-server/.env)"
echo "-----------------------------------------------------------"
if [ -f "apps/calendar-server/.env" ]; then
    if grep -q "^DATABASE_URL=" apps/calendar-server/.env; then
        check "DATABASE_URL defined"
        DB_URL=$(grep "^DATABASE_URL=" apps/calendar-server/.env | cut -d'=' -f2-)
        if [[ "$DB_URL" == *"localhost"* ]] || [[ "$DB_URL" == *"127.0.0.1"* ]]; then
            warn "DATABASE_URL points to localhost - ensure PostgreSQL is running"
        fi
    else
        warn "DATABASE_URL not defined"
    fi

    if grep -q "^BETTER_AUTH_SECRET=" apps/calendar-server/.env; then
        SECRET=$(grep "^BETTER_AUTH_SECRET=" apps/calendar-server/.env | cut -d'=' -f2-)
        if [ ${#SECRET} -ge 32 ]; then
            check "BETTER_AUTH_SECRET defined (${#SECRET} characters)"
        else
            warn "BETTER_AUTH_SECRET too short (${#SECRET} characters, minimum 32 required)"
        fi
    else
        warn "BETTER_AUTH_SECRET not defined"
    fi

    if grep -q "^CORS_ORIGIN=" apps/calendar-server/.env; then
        check "CORS_ORIGIN defined"
        CORS=$(grep "^CORS_ORIGIN=" apps/calendar-server/.env | cut -d'=' -f2-)
        echo "   Value: $CORS"
    else
        warn "CORS_ORIGIN not defined (will use http://localhost:3001 by default)"
    fi

    if grep -q "^BETTER_AUTH_URL=" apps/calendar-server/.env; then
        check "BETTER_AUTH_URL defined"
    else
        warn "BETTER_AUTH_URL not defined (optional but recommended)"
    fi
else
    warn "Cannot check - apps/calendar-server/.env does not exist"
fi
echo ""

# 3. Check frontend environment variables
echo "3. Checking frontend variables (apps/calendar-web/.env)"
echo "--------------------------------------------------------"
if [ -f "apps/calendar-web/.env" ]; then
    if grep -q "^VITE_SERVER_URL=" apps/calendar-web/.env; then
        check "VITE_SERVER_URL defined"
        SERVER_URL=$(grep "^VITE_SERVER_URL=" apps/calendar-web/.env | cut -d'=' -f2-)
        echo "   Value: $SERVER_URL"
    else
        warn "VITE_SERVER_URL not defined (will use http://localhost:3000 by default)"
    fi
else
    warn "Cannot check - apps/calendar-web/.env does not exist"
fi
echo ""

# 4. Check backend server health
echo "4. Checking backend servers"
echo "----------------------------------"
for app in calendar tasks contacts; do
    case $app in
        calendar) port=3000 ;;
        tasks) port=3002 ;;
        contacts) port=3003 ;;
    esac

    if curl -s -f "http://localhost:${port}/health" > /dev/null 2>&1; then
        check "${app^} backend accessible on http://localhost:${port}"
        HEALTH=$(curl -s "http://localhost:${port}/health")
        echo "   Response: $HEALTH"
    else
        warn "${app^} backend not accessible on http://localhost:${port}"
        echo "   Start it with: bun run dev:${app}-server"
    fi
done
echo ""

# 5. Check Better-Auth endpoints
echo "5. Checking Better-Auth endpoints"
echo "------------------------------------------"
for app in calendar tasks contacts; do
    case $app in
        calendar) port=3000 ;;
        tasks) port=3002 ;;
        contacts) port=3003 ;;
    esac

    if curl -s -f "http://localhost:${port}/api/auth/get-session" > /dev/null 2>&1; then
        check "${app^} /api/auth/get-session accessible"
    else
        warn "${app^} /api/auth/get-session not accessible"
        echo "   Check that the server is started and auth routes are configured"
    fi
done
echo ""

# 6. Check database
echo "6. Checking database"
echo "--------------------------------------"
# Use Docker if running dev setup
if docker compose -f docker-compose.dev.yml ps db 2>/dev/null | grep -q "Up"; then
    check "PostgreSQL container is running"

    if docker compose -f docker-compose.dev.yml exec -T db pg_isready -U appstandard > /dev/null 2>&1; then
        check "PostgreSQL connection successful"

        # Check Better-Auth tables
        TABLES=$(docker compose -f docker-compose.dev.yml exec -T db psql -U appstandard -d appstandard_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user', 'session', 'account', 'verification');" 2>/dev/null | tr -d ' ' || echo "0")
        if [ "$TABLES" = "4" ]; then
            check "Better-Auth tables present (user, session, account, verification)"
        else
            warn "Better-Auth tables missing or incomplete (found: $TABLES/4)"
            echo "   Run: bun run db:push"
        fi
    else
        warn "Cannot connect to PostgreSQL"
        echo "   Check DATABASE_URL and that PostgreSQL is started"
    fi
else
    warn "PostgreSQL container not running"
    echo "   Start it with: docker compose -f docker-compose.dev.yml up -d"
fi
echo ""

# 7. Summary and recommendations
echo "=========================================="
echo "📋 Summary and Recommendations"
echo "=========================================="
echo ""
echo "If you're experiencing login/registration issues:"
echo ""
echo "1. Ensure all environment variables are defined"
echo "2. Start the backend servers: bun run dev"
echo "3. Initialize the database: bun run db:push"
echo "4. Check browser console for CORS or network errors"
echo "5. Check server logs for authentication errors"
echo ""
echo "Development Ports:"
echo "  Calendar:  Frontend 3001  |  Backend 3000"
echo "  Tasks:     Frontend 3004  |  Backend 3002"
echo "  Contacts:  Frontend 3005  |  Backend 3003"
echo ""
echo "For more information, see: AUTHENTICATION.md"
