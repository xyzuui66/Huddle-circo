#!/bin/bash

echo "🔍 HUDDLE BUILD PRE-CHECK"
echo "========================="
echo ""

# Check Node/npm
echo "✓ Node version: $(node --version)"
echo "✓ NPM version: $(npm --version)"
echo ""

# Check key files
echo "Checking key files..."
files=(
  "src/hooks/useGiftSystem.ts"
  "src/components/GiftModal.tsx"
  "src/app/live-stream/page.tsx"
  "GIFT_SYSTEM_TABLES.sql"
  ".env.local"
  "package.json"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING!)"
  fi
done

echo ""
echo "Checking TypeScript syntax..."

# Count errors
errors=0

if grep -q "import.*from" src/components/GiftModal.tsx; then
  echo "  ✓ GiftModal.tsx - imports OK"
else
  echo "  ✗ GiftModal.tsx - import issues"
  ((errors++))
fi

if grep -q "export default function" src/components/GiftModal.tsx; then
  echo "  ✓ GiftModal.tsx - exports OK"
else
  echo "  ✗ GiftModal.tsx - export issues"
  ((errors++))
fi

if grep -q "import.*from" src/app/live-stream/page.tsx; then
  echo "  ✓ live-stream/page.tsx - imports OK"
else
  echo "  ✗ live-stream/page.tsx - import issues"
  ((errors++))
fi

echo ""

if [ $errors -eq 0 ]; then
  echo "✅ PRE-CHECK PASSED!"
  echo ""
  echo "Ready to build. Run:"
  echo "  npm install"
  echo "  npm run build"
else
  echo "⚠️  FOUND $errors ISSUES"
fi
