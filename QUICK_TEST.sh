#!/bin/bash

# Quick test script for Reports System
echo "========================================"
echo "Testing Reports System"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check services are running
echo -e "${YELLOW}1. Checking services...${NC}"

if curl -s http://localhost:3001/api/velocity/team/1 > /dev/null; then
    echo -e "${GREEN}✓ Reporting Service (port 3001) is running${NC}"
else
    echo -e "${RED}✗ Reporting Service is NOT running${NC}"
    echo "Start it with: cd backend/reporting-service && npm run start:dev"
    exit 1
fi

if curl -s http://localhost:4201 > /dev/null; then
    echo -e "${GREEN}✓ Team Portal (port 4201) is running${NC}"
else
    echo -e "${RED}✗ Team Portal is NOT running${NC}"
    echo "Start it with: cd frontend/team-portal && npm start"
    exit 1
fi
echo ""

# Test 2: Check API endpoints
echo -e "${YELLOW}2. Testing API endpoints...${NC}"

VELOCITY_COUNT=$(curl -s http://localhost:3001/api/velocity/team/1 | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "   Velocity records: $VELOCITY_COUNT"

if [ "$VELOCITY_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ Velocity endpoint working${NC}"
else
    echo -e "${RED}✗ No velocity data${NC}"
fi

BURNDOWN_COUNT=$(curl -s http://localhost:3001/api/burndown/project/1 | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "   Burndown records: $BURNDOWN_COUNT"

if [ "$BURNDOWN_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ Burndown endpoint working${NC}"
else
    echo -e "${YELLOW}! No burndown data - run seed script${NC}"
    echo "   PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -f backend/reporting-service/seed-burndown-data.sql"
fi
echo ""

# Test 3: Sample data
echo -e "${YELLOW}3. Sample velocity data:${NC}"
curl -s http://localhost:3001/api/velocity/team/1 | python3 -m json.tool 2>/dev/null | head -20 || echo "Error fetching data"
echo ""

echo -e "${YELLOW}4. Sample burndown data:${NC}"
curl -s http://localhost:3001/api/burndown/project/1 | python3 -m json.tool 2>/dev/null | head -20 || echo "Error fetching data"
echo ""

# Test 4: Frontend access
echo -e "${YELLOW}5. Testing frontend...${NC}"
echo "   Reports page: http://localhost:4201/reports"
echo ""

echo "========================================"
echo -e "${GREEN}All tests completed!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:4201/reports in your browser"
echo "2. Login if needed"
echo "3. You should see:"
echo "   - Team Velocity chart ($VELOCITY_COUNT sprints)"
echo "   - Project Burndown chart ($BURNDOWN_COUNT sprints)"
echo ""
echo "If charts don't appear, check browser console (F12) for errors"
