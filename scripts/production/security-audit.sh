#!/usr/bin/env bash
# Security audit script for AppStandard
# Usage: ./security-audit.sh [--verbose]

set -e

# Configuration
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="${PROJECT_DIR:-$HOME/appstandard}"
fi

# Use environment variable for domain, default to localhost
DOMAIN="${APPSTANDARD_DOMAIN:-localhost}"

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
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

check() {
    local name="$1"
    local command="$2"
    local severity="${3:-error}"  # error or warning

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $name"
        ((PASSED++))
        return 0
    else
        if [ "$severity" = "warning" ]; then
            echo -e "${YELLOW}⚠️${NC}  $name"
            ((WARNINGS++))
        else
            echo -e "${RED}❌${NC} $name"
            ((FAILED++))
        fi
        if [ "$VERBOSE" = true ]; then
            echo "   Command: $command"
        fi
        return 1
    fi
}

echo "🔒 Security Audit - AppStandard"
echo "=================================="
echo ""

# HTTPS checks
echo "🔐 HTTPS and Certificates:"
if [ -f "/etc/nginx/sites-available/appstandard" ] && [ "$DOMAIN" != "localhost" ]; then
    check "SSL certificate valid" "curl -f -s https://${DOMAIN} > /dev/null"
    check "HSTS header present" "curl -sI https://${DOMAIN} | grep -q 'Strict-Transport-Security'"
    check "HTTP to HTTPS redirect" "curl -sI http://${DOMAIN} | grep -q '301\|302'"

    # Check certificate expiration
    if command -v openssl > /dev/null 2>&1; then
        EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        if [ -n "$EXPIRY" ]; then
            # Detect system (GNU vs BSD)
            if date -d "now" > /dev/null 2>&1; then
                # GNU date (Linux)
                EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null)
            elif date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" > /dev/null 2>&1; then
                # BSD date (macOS)
                EXPIRY_EPOCH=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null)
            else
                EXPIRY_EPOCH=""
            fi

            if [ -n "$EXPIRY_EPOCH" ]; then
                NOW_EPOCH=$(date +%s)
                DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
                if [ $DAYS_LEFT -gt 30 ]; then
                    echo -e "${GREEN}✅${NC} Certificate valid (expires in $DAYS_LEFT days)"
                    ((PASSED++))
                elif [ $DAYS_LEFT -gt 0 ]; then
                    echo -e "${YELLOW}⚠️${NC}  Certificate expires soon (in $DAYS_LEFT days)"
                    ((WARNINGS++))
                else
                    echo -e "${RED}❌${NC} Certificate expired"
                    ((FAILED++))
                fi
            fi
        fi
    else
        echo -e "${YELLOW}⚠️${NC}  OpenSSL not available, skipping certificate expiry check"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  Nginx config not found or localhost, skipping HTTPS checks"
    ((WARNINGS++))
fi
echo ""

# Security headers checks
echo "🛡️  Security Headers:"
if [ "$DOMAIN" != "localhost" ] && curl -sI "https://${DOMAIN}" > /dev/null 2>&1; then
    check "X-Frame-Options present" "curl -sI https://${DOMAIN} | grep -q 'X-Frame-Options'"
    check "X-Content-Type-Options present" "curl -sI https://${DOMAIN} | grep -q 'X-Content-Type-Options'"
    check "X-XSS-Protection present" "curl -sI https://${DOMAIN} | grep -q 'X-XSS-Protection'"
    check "Content-Security-Policy present" "curl -sI https://${DOMAIN} | grep -q 'Content-Security-Policy'"
    check "Permissions-Policy present" "curl -sI https://${DOMAIN} | grep -q 'Permissions-Policy'"
    check "Referrer-Policy present" "curl -sI https://${DOMAIN} | grep -q 'Referrer-Policy'"
else
    echo -e "${YELLOW}⚠️${NC}  Cannot check headers (HTTPS not accessible)"
    ((WARNINGS++))
fi
echo ""

# Environment variables checks
echo "🔑 Environment Variables:"
if [ -f ".env" ]; then
    # Check that passwords are not default values
    if grep -q "POSTGRES_PASSWORD=appstandard_secret" .env 2>/dev/null; then
        echo -e "${RED}❌${NC} POSTGRES_PASSWORD uses default value"
        ((FAILED++))
    else
        echo -e "${GREEN}✅${NC} POSTGRES_PASSWORD configured"
        ((PASSED++))
    fi

    if grep -q "BETTER_AUTH_SECRET=change-me" .env 2>/dev/null; then
        echo -e "${RED}❌${NC} BETTER_AUTH_SECRET uses default value"
        ((FAILED++))
    else
        echo -e "${GREEN}✅${NC} BETTER_AUTH_SECRET configured"
        ((PASSED++))
    fi

    # Check that CORS_ORIGIN doesn't contain wildcard or localhost in production
    if grep -q "CORS_ORIGIN=.*\*" .env 2>/dev/null; then
        echo -e "${RED}❌${NC} CORS_ORIGIN contains wildcard (*)"
        ((FAILED++))
    elif grep -q "CORS_ORIGIN=.*localhost" .env 2>/dev/null && [ "${NODE_ENV:-production}" = "production" ]; then
        echo -e "${YELLOW}⚠️${NC}  CORS_ORIGIN contains localhost in production"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅${NC} CORS_ORIGIN correctly configured"
        ((PASSED++))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  .env file not found"
    ((WARNINGS++))
fi
echo ""

# Docker checks
echo "🐳 Docker Security:"
check "Containers in non-root mode" "docker compose ps | grep -q 'appstandard' && ! docker compose exec -T calendar-server id 2>/dev/null | grep -q 'uid=0'" warning
check "No privileged containers" "! docker compose ps | grep -q 'privileged'" warning
echo ""

# Port exposure checks
echo "🌐 Port Exposure:"
EXPOSED_PORTS=$(docker compose ps --format json 2>/dev/null | grep -o '"PublishedPort":"[^"]*"' | cut -d'"' -f4 | sort -u || echo "")
if [ -n "$EXPOSED_PORTS" ]; then
    echo -e "${GREEN}✅${NC} Exposed ports: $EXPOSED_PORTS"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  Unable to determine exposed ports"
    ((WARNINGS++))
fi
echo ""

# Secrets in logs check
echo "🔐 Secrets and Passwords:"
if docker compose logs 2>/dev/null | grep -qiE '(password|secret|key).*=.*[a-zA-Z0-9]{10,}'; then
    echo -e "${RED}❌${NC} Potential secrets found in logs"
    ((FAILED++))
else
    echo -e "${GREEN}✅${NC} No secrets detected in logs"
    ((PASSED++))
fi
echo ""

# Summary
echo "=================================="
echo "Summary:"
echo "  ${GREEN}$PASSED${NC} checks passed"
echo "  ${YELLOW}$WARNINGS${NC} warnings"
echo "  ${RED}$FAILED${NC} failures"
echo ""

if [ $FAILED -gt 0 ]; then
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    exit 0
else
    exit 0
fi
