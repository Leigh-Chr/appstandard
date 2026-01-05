#!/usr/bin/env bash
# ===========================================
# AppStandard Security Check Script
# ===========================================
# This script performs comprehensive security checks
# Run this before deployment to ensure security best practices
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AppStandard Security Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Track issues
ISSUES=0
WARNINGS=0

# Function to print status
print_ok() { echo -e "${GREEN}✓${NC} $1"; }
print_warn() { echo -e "${YELLOW}⚠${NC} $1"; ((WARNINGS++)) || true; }
print_fail() { echo -e "${RED}✗${NC} $1"; ((ISSUES++)) || true; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# ===========================================
# 1. Dependency Audit
# ===========================================
echo -e "\n${BLUE}[1/6] Dependency Audit${NC}"
echo "----------------------------------------"

print_info "Running bun audit..."
if bun audit 2>&1 | grep -q "No vulnerabilities found"; then
    print_ok "No vulnerabilities found in dependencies"
else
    print_fail "Vulnerabilities found! Run 'bun audit' for details"
fi

# ===========================================
# 2. TypeScript Type Check
# ===========================================
echo -e "\n${BLUE}[2/6] TypeScript Type Check${NC}"
echo "----------------------------------------"

print_info "Running type checks..."
if bun run check-types > /dev/null 2>&1; then
    print_ok "TypeScript compilation successful"
else
    print_fail "TypeScript errors found! Run 'bun run check-types' for details"
fi

# ===========================================
# 3. Environment Variables Check
# ===========================================
echo -e "\n${BLUE}[3/6] Environment Configuration${NC}"
echo "----------------------------------------"

# Check for .env.example
if [ -f "docker.env.example" ]; then
    print_ok "docker.env.example exists for reference"
else
    print_warn "No docker.env.example found"
fi

# Check for exposed secrets in code
print_info "Checking for hardcoded secrets..."
SECRETS_FOUND=$(grep -r --include="*.ts" --include="*.tsx" -E "(password|secret|api_key|apikey|token)\s*[:=]\s*['\"][^'\"]{8,}" . 2>/dev/null | grep -v node_modules | grep -v dist | grep -v ".example" | wc -l || true)
if [ "$SECRETS_FOUND" -eq 0 ]; then
    print_ok "No hardcoded secrets detected"
else
    print_warn "Potential hardcoded secrets found. Please review."
fi

# ===========================================
# 4. Security Headers Check
# ===========================================
echo -e "\n${BLUE}[4/6] Security Headers Configuration${NC}"
echo "----------------------------------------"

# Check nginx.conf for each web app
WEB_APPS=("calendar-web" "tasks-web" "contacts-web")
NGINX_CHECKED=false

for app in "${WEB_APPS[@]}"; do
    NGINX_CONF="apps/${app}/nginx.conf"
    if [ -f "$NGINX_CONF" ]; then
        if [ "$NGINX_CHECKED" = false ]; then
            print_info "Checking ${app}/nginx.conf..."
            NGINX_CHECKED=true

            # Check for X-Frame-Options
            if grep -q "X-Frame-Options.*DENY" "$NGINX_CONF"; then
                print_ok "X-Frame-Options: DENY configured"
            else
                print_fail "X-Frame-Options not set to DENY"
            fi

            # Check for HSTS
            if grep -q "Strict-Transport-Security" "$NGINX_CONF"; then
                if grep -q "preload" "$NGINX_CONF"; then
                    print_ok "HSTS with preload configured"
                else
                    print_warn "HSTS configured but without preload"
                fi
            else
                print_fail "HSTS not configured"
            fi

            # Check for CSP
            if grep -q "Content-Security-Policy" "$NGINX_CONF"; then
                print_ok "Content-Security-Policy configured"
                if grep -q "report-uri" "$NGINX_CONF"; then
                    print_ok "CSP reporting enabled"
                else
                    print_warn "CSP reporting not enabled"
                fi
            else
                print_fail "Content-Security-Policy not configured"
            fi

            # Check for X-Content-Type-Options
            if grep -q "X-Content-Type-Options.*nosniff" "$NGINX_CONF"; then
                print_ok "X-Content-Type-Options: nosniff configured"
            else
                print_fail "X-Content-Type-Options not configured"
            fi
        fi
    fi
done

if [ "$NGINX_CHECKED" = false ]; then
    print_warn "No nginx.conf found - cannot check security headers"
fi

# ===========================================
# 5. Docker Security Check
# ===========================================
echo -e "\n${BLUE}[5/6] Docker Security Configuration${NC}"
echo "----------------------------------------"

if [ -f "docker-compose.yml" ]; then
    # Check for no-new-privileges
    if grep -q "no-new-privileges" docker-compose.yml; then
        print_ok "no-new-privileges security option configured"
    else
        print_fail "no-new-privileges not configured"
    fi

    # Check for cap_drop
    if grep -q "cap_drop" docker-compose.yml; then
        print_ok "Capabilities dropping configured"
    else
        print_fail "cap_drop not configured"
    fi

    # Check for health checks
    if grep -q "healthcheck" docker-compose.yml; then
        print_ok "Health checks configured"
    else
        print_warn "Health checks not configured"
    fi

    # Check for resource limits
    if grep -q "resources" docker-compose.yml; then
        print_ok "Resource limits configured"
    else
        print_warn "Resource limits not configured"
    fi
else
    print_warn "docker-compose.yml not found"
fi

# ===========================================
# 6. Rate Limiting Check
# ===========================================
echo -e "\n${BLUE}[6/6] Rate Limiting Configuration${NC}"
echo "----------------------------------------"

# Check rate limiting in server-core package
RATE_LIMIT_FILE="packages/server-core/src/middleware/rate-limit.ts"
if [ -f "$RATE_LIMIT_FILE" ]; then
    # Check for various rate limiters
    RATE_LIMITERS=$(grep -c "createRateLimiter\|RateLimit" "$RATE_LIMIT_FILE" 2>/dev/null || echo "0")
    if [ "$RATE_LIMITERS" -gt 0 ]; then
        print_ok "Rate limiting middleware configured ($RATE_LIMITERS limiters)"
    else
        print_fail "Rate limiting not properly configured"
    fi
else
    # Try legacy path
    LEGACY_RATE_LIMIT="packages/api/src/middleware/rate-limit.ts"
    if [ -f "$LEGACY_RATE_LIMIT" ]; then
        print_ok "Rate limiting middleware found at legacy path"
    else
        print_warn "Rate limiting middleware not found"
    fi
fi

# Check for auth rate limiting in each server
for app in calendar tasks contacts; do
    SERVER_MIDDLEWARE="apps/${app}-server/src/middleware/rate-limit.ts"
    if [ -f "$SERVER_MIDDLEWARE" ]; then
        if grep -q "passwordReset\|signup\|login" "$SERVER_MIDDLEWARE" 2>/dev/null; then
            print_ok "${app^} server has auth rate limiting"
        else
            print_warn "${app^} server may lack auth rate limiting"
        fi
    fi
done

# ===========================================
# Summary
# ===========================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Security Check Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$ISSUES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}All security checks passed!${NC}"
    exit 0
elif [ "$ISSUES" -eq 0 ]; then
    echo -e "${YELLOW}No critical issues, but $WARNINGS warning(s) found.${NC}"
    exit 0
else
    echo -e "${RED}Found $ISSUES critical issue(s) and $WARNINGS warning(s).${NC}"
    echo "Please address the issues above before deploying."
    exit 1
fi
