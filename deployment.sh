#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# 1. Build the application
echo "📦 Building the application..."
npm run build

# 2. Run local migrations
echo "🛠️  Running local database migrations..."
npx wrangler d1 execute pos_database --local --file=schema.sql

# 3. Run remote migrations
echo "☁️  Running remote database migrations..."
npx wrangler d1 execute pos_database --remote --file=schema.sql

# 4. Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist

echo "✅ Deployment completed successfully!"
