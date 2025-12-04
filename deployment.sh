#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# 1. Build the application
echo "📦 Building the application..."
npm run build

# 2. Run local migrations (if needed for testing)
echo "🛠️  Running local database migrations..."
# First ensure base schema exists (safe with IF NOT EXISTS)
npx wrangler d1 execute pos_database --local --file=schema.sql
# Then apply additional migrations
# npx wrangler d1 execute pos_database --local --file=./drizzle/migrations/add_timezone.sql

# 3. Run remote migrations
echo "☁️  Running remote database migrations..."
# First ensure base schema exists in production
npx wrangler d1 execute pos_database --remote --file=schema.sql
# Then apply timezone migration
# npx wrangler d1 execute pos_database --remote --file=./drizzle/migrations/add_timezone.sql

# 4. Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist

echo "✅ Deployment completed successfully!"
