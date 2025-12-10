#!/bin/bash

# Authentication Flow Test Script
# This script tests the complete authentication flow for team.local

echo "==================================="
echo "Authentication Flow Test"
echo "==================================="
echo ""

# Test 1: Login and get JWT token
echo "1. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Host: team.local" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c /tmp/cookies.txt \
  http://team.local/api/identity/auth/authenticate)

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ ERROR: Failed to get token from login response"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Test 2: Test /api/projects with Authorization header
echo "2. Testing /api/identity/projects with Authorization header..."
PROJECTS_RESPONSE=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Host: team.local" \
  http://team.local/api/identity/projects)

echo "Projects response:"
echo "$PROJECTS_RESPONSE" | jq '.' 2>/dev/null || echo "$PROJECTS_RESPONSE"
echo ""

if echo "$PROJECTS_RESPONSE" | grep -q "403\|401\|error"; then
  echo "❌ Authorization header test failed (403/401 error)"
else
  echo "✅ Authorization header test passed"
fi
echo ""

# Test 3: Test /api/projects with cookie
echo "3. Testing /api/identity/projects with cookie..."
PROJECTS_COOKIE_RESPONSE=$(curl -s \
  -b /tmp/cookies.txt \
  -H "Host: team.local" \
  http://team.local/api/identity/projects)

echo "Projects response (cookie):"
echo "$PROJECTS_COOKIE_RESPONSE" | jq '.' 2>/dev/null || echo "$PROJECTS_COOKIE_RESPONSE"
echo ""

if echo "$PROJECTS_COOKIE_RESPONSE" | grep -q "403\|401\|error"; then
  echo "❌ Cookie test failed (403/401 error)"
else
  echo "✅ Cookie test passed"
fi
echo ""

# Test 4: Check cookie contents
echo "4. Checking cookie contents..."
cat /tmp/cookies.txt
echo ""

# Test 5: Test /auth/me endpoint
echo "5. Testing /api/identity/auth/me endpoint..."
ME_RESPONSE=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Host: team.local" \
  http://team.local/api/identity/auth/me)

echo "Current user response:"
echo "$ME_RESPONSE" | jq '.' 2>/dev/null || echo "$ME_RESPONSE"
echo ""

if echo "$ME_RESPONSE" | grep -q "403\|401\|error"; then
  echo "❌ /auth/me test failed"
else
  echo "✅ /auth/me test passed"
fi

echo ""
echo "==================================="
echo "Test Complete"
echo "==================================="

# Cleanup
rm -f /tmp/cookies.txt
