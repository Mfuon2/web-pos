#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Version file location
VERSION_FILE=".version"

# Read current version or initialize
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE")
else
    CURRENT_VERSION="0.0.0"
fi

# Parse version parts
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Increment patch version
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "📌 Incrementing version: $CURRENT_VERSION -> $NEW_VERSION"

# Update service worker with new version
sed -i.bak "s/__VERSION__/$NEW_VERSION/g" public/service-worker.js
rm -f public/service-worker.js.bak

# 1. Build the application
echo "📦 Building the application..."
npm run build

# Restore the placeholder in source (so it can be replaced next time)
sed -i.bak "s/$NEW_VERSION/__VERSION__/g" public/service-worker.js
rm -f public/service-worker.js.bak

# Save new version
echo "$NEW_VERSION" > "$VERSION_FILE"

# 2. Run local migrations (optional - for testing)
echo "🛠️  Running local database migrations..."
node scripts/migrate.js --local

# 3. Run remote migrations
echo "☁️  Running remote database migrations..."
node scripts/migrate.js --remote

# 4. Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist

# Commit version bump
git add "$VERSION_FILE"
git commit -m "chore: bump version to $NEW_VERSION" --allow-empty 2>/dev/null || true

echo "✅ Deployment completed successfully! Version: $NEW_VERSION"
