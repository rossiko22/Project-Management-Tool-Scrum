#!/bin/bash

echo "=================================="
echo "Authentication Debug Script"
echo "=================================="
echo ""

# Step 1: Login and get token
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Host: team.local" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c /tmp/debug-cookies.txt \
  http://team.local/api/identity/auth/authenticate)

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ ERROR: Failed to get token from login response"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Step 2: Test projects endpoint with Authorization header
echo "Step 2: Testing /api/identity/projects with Authorization header..."
PROJECTS_HEADER=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Host: team.local" \
  http://team.local/api/identity/projects)

HTTP_STATUS=$(echo "$PROJECTS_HEADER" | grep "HTTP_STATUS" | cut -d: -f2)
PROJECTS_BODY=$(echo "$PROJECTS_HEADER" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$PROJECTS_BODY" | jq '.' 2>/dev/null || echo "$PROJECTS_BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Authorization header works!"
else
  echo "❌ Authorization header failed with status $HTTP_STATUS"
fi
echo ""

# Step 3: Test with cookie
echo "Step 3: Testing /api/identity/projects with cookie..."
PROJECTS_COOKIE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -b /tmp/debug-cookies.txt \
  -H "Host: team.local" \
  http://team.local/api/identity/projects)

HTTP_STATUS=$(echo "$PROJECTS_COOKIE" | grep "HTTP_STATUS" | cut -d: -f2)
PROJECTS_BODY=$(echo "$PROJECTS_COOKIE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$PROJECTS_BODY" | jq '.' 2>/dev/null || echo "$PROJECTS_BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Cookie authentication works!"
else
  echo "❌ Cookie authentication failed with status $HTTP_STATUS"
fi
echo ""

# Step 4: Check what the browser is sending
echo "Step 4: Simulating browser request (with both header and cookie)..."
PROJECTS_BOTH=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -b /tmp/debug-cookies.txt \
  -H "Host: team.local" \
  http://team.local/api/identity/projects)

HTTP_STATUS=$(echo "$PROJECTS_BOTH" | grep "HTTP_STATUS" | cut -d: -f2)
PROJECTS_BODY=$(echo "$PROJECTS_BOTH" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$PROJECTS_BODY" | jq '.' 2>/dev/null || echo "$PROJECTS_BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Both header and cookie work!"
else
  echo "❌ Request failed with status $HTTP_STATUS"
fi

echo ""
echo "=================================="
echo "Debug Summary"
echo "=================================="
echo ""
echo "If all tests passed:"
echo "  1. The backend is working correctly"
echo "  2. The issue is in the frontend"
echo "  3. Check browser DevTools to see if token is in localStorage"
echo "  4. Check if Authorization header is being added to requests"
echo ""
echo "If tests failed:"
echo "  1. Check if you're logged in with correct credentials"
echo "  2. Check backend logs: docker compose logs identity-service"
echo "  3. Verify JWT secret is configured correctly"
echo ""

# Cleanup
rm -f /tmp/debug-cookies.txt
