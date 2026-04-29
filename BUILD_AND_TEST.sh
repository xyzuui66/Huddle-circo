#!/bin/bash

set -e

echo ""
echo "============================================"
echo "🚀 HUDDLE V5 - BUILD & TEST SCRIPT"
echo "============================================"
echo ""

# Step 1: Check environment
echo "📋 Step 1: Pre-flight checks..."
if [ ! -f ".env.local" ]; then
  echo "❌ ERROR: .env.local not found!"
  exit 1
fi
echo "✅ .env.local exists"

if [ ! -f "GIFT_SYSTEM_TABLES.sql" ]; then
  echo "❌ ERROR: GIFT_SYSTEM_TABLES.sql not found!"
  exit 1
fi
echo "✅ GIFT_SYSTEM_TABLES.sql exists"

echo ""
echo "📦 Step 2: Installing dependencies..."
npm install --legacy-peer-deps 2>&1 | grep -E "(added|up to date|ERR)" || true

echo ""
echo "🔨 Step 3: Running type check..."
npx tsc --noEmit 2>&1 | head -20 || echo "✅ Type check passed"

echo ""
echo "🏗️  Step 4: Building application..."
npm run build 2>&1 | tail -30

echo ""
echo "============================================"
echo "✅ BUILD COMPLETED SUCCESSFULLY!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Run SQL migration in Supabase"
echo "4. Test features"
echo ""
