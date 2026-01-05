#!/usr/bin/env bash
# Script to install production scripts on a remote server
# Usage: ./install.sh [user@server]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -z "$1" ]; then
    echo "Usage: $0 user@server"
    echo "Example: $0 root@185.158.132.190"
    exit 1
fi

SERVER="$1"
REMOTE_DIR="~/appstandard/scripts/production"

echo "📦 Installing production scripts on $SERVER..."
echo ""

# Create remote directory
ssh "$SERVER" "mkdir -p $REMOTE_DIR"

# Copy all scripts
echo "📋 Copying scripts..."
scp "$SCRIPT_DIR"/*.sh "$SERVER:$REMOTE_DIR/"

# Make scripts executable
echo "🔧 Making scripts executable..."
ssh "$SERVER" "chmod +x $REMOTE_DIR/*.sh"

# Copy command guide
echo "📚 Copying command guide..."
scp "$PROJECT_DIR/PRODUCTION_COMMANDS.md" "$SERVER:~/appstandard/"

echo ""
echo "✅ Installation complete!"
echo ""
echo "Scripts available in: $REMOTE_DIR"
echo "Guide available in: ~/appstandard/PRODUCTION_COMMANDS.md"
echo ""
echo "Usage example:"
echo "  ssh $SERVER"
echo "  cd ~/appstandard"
echo "  ./scripts/production/deploy.sh"
