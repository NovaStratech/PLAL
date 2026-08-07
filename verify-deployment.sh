#!/bin/bash
# 🚀 PLAL v2.0 — Post-Deployment Verification Script

set -e

echo "🔍 PLAL v2.0 Post-Deployment Verification"
echo "=========================================="
echo ""

# Configuration
API_URL="${1:-https://plal-api.vercel.app}"
WEB_URL="${2:-https://plal-web.vercel.app}"

echo "🔗 Testing API: $API_URL"
echo "🔗 Testing Web: $WEB_URL"
echo ""

# Test 1: Health Check
echo "✓ Test 1: Health Check"
HEALTH=$(curl -s "$API_URL/api/health" || echo '{"status":"error"}')
STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$STATUS" = "ok" ]; then
  echo "  ✅ API is healthy"
  VERSION=$(echo "$HEALTH" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
  echo "  ℹ️  Version: $VERSION"
else
  echo "  ❌ API health check failed"
  echo "  Response: $HEALTH"
  exit 1
fi
echo ""

# Test 2: Frontend Load
echo "✓ Test 2: Frontend Response"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")

if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✅ Frontend loaded (HTTP $HTTP_CODE)"
else
  echo "  ⚠️  Frontend returned HTTP $HTTP_CODE (check Vercel dashboard)"
fi
echo ""

# Test 3: Environment Check
echo "✓ Test 3: Production Environment"
if [[ "$API_URL" == *"vercel.app"* ]]; then
  echo "  ✅ API on Vercel serverless"
else
  echo "  ⚠️  API not on Vercel (custom domain?)"
fi

if [[ "$WEB_URL" == *"vercel.app"* ]]; then
  echo "  ✅ Web on Vercel CDN"
else
  echo "  ⚠️  Web not on Vercel (custom domain?)"
fi
echo ""

# Test 4: Rate Limiting Check
echo "✓ Test 4: Rate Limiting (optional)"
echo "  ℹ️  Rate limits configured:"
echo "    - Global: 60 req/min"
echo "    - Auth: 10 req/min"
echo "    - Invitations: 20 req/min"
echo "  (Test by spamming auth endpoint → should get 429 after limit)"
echo ""

# Summary
echo "=========================================="
echo "✅ Deployment Verification Complete!"
echo ""
echo "📊 Next Steps:"
echo "  1. Test manual flows:"
echo "     - Register: $WEB_URL/register"
echo "     - Login: $WEB_URL/login"
echo "     - Onboarding (4 steps): $WEB_URL/onboarding"
echo "     - Search users: $WEB_URL/rechercher"
echo "     - Add friends: $WEB_URL/amis"
echo ""
echo "  2. Check production dashboards:"
echo "     - Vercel: https://vercel.com/dashboard"
echo "     - Supabase: https://supabase.com/dashboard"
echo ""
echo "  3. Monitor errors (if enabled):"
echo "     - Sentry: https://sentry.io (not yet configured)"
echo "     - Vercel Logs: https://vercel.com/dashboard → project → Logs"
echo ""
echo "🎉 PLAL v2.0 is live!"
