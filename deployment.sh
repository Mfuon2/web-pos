#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# 1. Build the application
echo "📦 Building the application..."
npm run build

# 2. Run local migrations (optional - for testing)
echo "🛠️  Running local database migrations..."
node scripts/migrate.js --local

# 3. Run remote migrations
echo "☁️  Running remote database migrations..."
node scripts/migrate.js --remote

# 4. Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist

echo "✅ Deployment completed successfully!"
