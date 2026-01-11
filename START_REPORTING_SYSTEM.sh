#!/bin/bash

# Start script for the Velocity & Burndown Reporting System
# This script helps you start all necessary services

echo "========================================="
echo "Velocity & Burndown Reporting System"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Kafka
echo -e "${YELLOW}Checking Kafka...${NC}"
if nc -z localhost 9092 2>/dev/null; then
    echo -e "${GREEN}✓ Kafka is running on port 9092${NC}"
else
    echo -e "${RED}✗ Kafka is NOT running on port 9092${NC}"
    echo "Please start Kafka before continuing"
    exit 1
fi
echo ""

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL (reporting_db)...${NC}"
if pg_isready -h localhost -p 5435 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running on port 5435${NC}"
else
    echo -e "${RED}✗ PostgreSQL is NOT running on port 5435${NC}"
    echo "Please start PostgreSQL before continuing"
    exit 1
fi
echo ""

# Check if migration has been run
echo -e "${YELLOW}Checking database tables...${NC}"
TABLE_EXISTS=$(PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_burndown');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ project_burndown table exists${NC}"
else
    echo -e "${YELLOW}! project_burndown table does not exist, running migration...${NC}"
    PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -f backend/reporting-service/migrations/002_add_project_burndown.sql
    echo -e "${GREEN}✓ Migration completed${NC}"
fi
echo ""

# Function to start reporting service
start_reporting_service() {
    echo -e "${YELLOW}Starting Reporting Service...${NC}"
    cd backend/reporting-service

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    echo -e "${GREEN}Starting reporting service on port 3002...${NC}"
    npm run start:dev &
    REPORTING_PID=$!
    echo "Reporting Service PID: $REPORTING_PID"
    cd ../..
    echo ""
}

# Function to start team portal
start_team_portal() {
    echo -e "${YELLOW}Starting Team Portal...${NC}"
    cd frontend/team-portal

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    echo -e "${GREEN}Starting team portal on port 4201...${NC}"
    npm start &
    PORTAL_PID=$!
    echo "Team Portal PID: $PORTAL_PID"
    cd ../..
    echo ""
}

# Ask user what to start
echo "What would you like to start?"
echo "1) Reporting Service only"
echo "2) Team Portal only"
echo "3) Both (Recommended)"
echo "4) Exit"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        start_reporting_service
        ;;
    2)
        start_team_portal
        ;;
    3)
        start_reporting_service
        sleep 3
        start_team_portal
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo -e "${GREEN}Services started successfully!${NC}"
echo "========================================="
echo ""
echo "Access points:"
echo "- Team Portal: http://localhost:4201"
echo "- Reporting Service: http://localhost:3002"
echo "- Reports Page: http://localhost:4201/reports"
echo ""
echo "To test:"
echo "1. Complete a sprint in the system"
echo "2. Go to http://localhost:4201/reports"
echo "3. You should see velocity and burndown charts with real data"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
