#!/bin/bash
set -e

# Publish script that renames packages for NPM
# Usage: ./scripts/publish-npm.sh <package> <version-bump>
# Example: ./scripts/publish-npm.sh ics-utils patch

PACKAGE=$1
VERSION_BUMP=$2

if [ -z "$PACKAGE" ] || [ -z "$VERSION_BUMP" ]; then
  echo "Usage: ./scripts/publish-npm.sh <package> <version-bump>"
  echo "Packages: ics-utils, vcard-utils, vtodo-utils"
  echo "Version bump: patch, minor, major"
  exit 1
fi

# Map package names to directories and NPM names
case $PACKAGE in
  ics-utils)
    DIR="packages/ics-utils"
    INTERNAL_NAME="@appstandard/ics-utils"
    NPM_NAME="@leigh-chr/ics-utils"
    ;;
  vcard-utils)
    DIR="packages/appstandard-contacts/vcard-utils"
    INTERNAL_NAME="@appstandard-contacts/vcard-utils"
    NPM_NAME="@leigh-chr/vcard-utils"
    ;;
  vtodo-utils)
    DIR="packages/appstandard-tasks/todo-utils"
    INTERNAL_NAME="@appstandard-tasks/todo-utils"
    NPM_NAME="@leigh-chr/vtodo-utils"
    ;;
  *)
    echo "Unknown package: $PACKAGE"
    echo "Valid packages: ics-utils, vcard-utils, vtodo-utils"
    exit 1
    ;;
esac

echo "Publishing $PACKAGE as $NPM_NAME..."

cd "$DIR"

# Build first
echo "Building..."
bun run build

# Bump version
echo "Bumping version ($VERSION_BUMP)..."
npm version $VERSION_BUMP --no-git-tag-version

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")

# Temporarily rename for publishing
echo "Renaming to $NPM_NAME for publishing..."
sed -i "s|\"name\": \"$INTERNAL_NAME\"|\"name\": \"$NPM_NAME\"|" package.json

# Publish
echo "Publishing $NPM_NAME@$NEW_VERSION..."
npm publish --access public

# Restore original name
echo "Restoring internal name..."
sed -i "s|\"name\": \"$NPM_NAME\"|\"name\": \"$INTERNAL_NAME\"|" package.json

echo "Successfully published $NPM_NAME@$NEW_VERSION"
