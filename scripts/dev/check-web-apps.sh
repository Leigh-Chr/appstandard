#!/usr/bin/env bash
# Validates critical configurations across all web apps
# Run this after creating a new web app or modifying shared UI components

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking web app configurations..."
echo ""

ERRORS=0

# Find all web apps
WEB_APPS=$(find "$PROJECT_ROOT/apps" -maxdepth 1 -type d -name "*-web" 2>/dev/null)

if [ -z "$WEB_APPS" ]; then
    echo -e "${YELLOW}No web apps found in apps/ directory${NC}"
    exit 0
fi

for APP_DIR in $WEB_APPS; do
    APP_NAME=$(basename "$APP_DIR")
    CSS_FILE="$APP_DIR/src/index.css"

    echo "Checking $APP_NAME..."

    # Check 1: index.css exists
    if [ ! -f "$CSS_FILE" ]; then
        echo -e "  ${RED}MISSING${NC} src/index.css"
        ERRORS=$((ERRORS + 1))
        continue
    fi

    # Check 2: @source directive for packages/ui
    if ! grep -q '@source.*packages/ui' "$CSS_FILE" 2>/dev/null; then
        echo -e "  ${RED}MISSING${NC} @source directive for packages/ui in index.css"
        echo -e "         Add: @source \"../../../packages/ui/src\";"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "  ${GREEN}OK${NC} @source directive present"
    fi

    # Check 3: vite.config.ts exists
    if [ ! -f "$APP_DIR/vite.config.ts" ]; then
        echo -e "  ${RED}MISSING${NC} vite.config.ts"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "  ${GREEN}OK${NC} vite.config.ts present"
    fi

    # Check 4: @appstandard/ui dependency
    if [ -f "$APP_DIR/package.json" ]; then
        if ! grep -q '"@appstandard/ui"' "$APP_DIR/package.json" 2>/dev/null; then
            echo -e "  ${YELLOW}WARNING${NC} @appstandard/ui not in dependencies"
        else
            echo -e "  ${GREEN}OK${NC} @appstandard/ui dependency present"
        fi
    fi

    echo ""
done

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Found $ERRORS configuration issue(s)${NC}"
    echo "See ARCHITECTURE.md for details on CSS configuration"
    exit 1
else
    echo -e "${GREEN}All web app configurations are correct${NC}"
    exit 0
fi
