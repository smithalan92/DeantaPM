#!/bin/bash
set -e

VERSION=$1

if [[ -z "$VERSION" ]]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 1.2.0"
  exit 1
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be in semver format (e.g. 1.2.0)"
  exit 1
fi

TAG="v-$VERSION"
CONFIG="src-tauri/tauri.conf.json"

CURRENT_VERSION=$(grep '"version"' $CONFIG | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')

if [[ "$VERSION" == "$CURRENT_VERSION" ]]; then
  echo "Error: version $VERSION is already the current version"
  exit 1
fi

echo ""
echo "  Current version : $CURRENT_VERSION"
echo "  New version     : $VERSION"
echo ""
read -p "Proceed with release? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "Releasing $TAG..."

# Update version in tauri.conf.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" $CONFIG

git add $CONFIG
git commit -m "Release $VERSION"
git push origin master

git tag "$TAG"
git push origin "$TAG"

echo "Done. GitHub Actions will now build and publish the release."
