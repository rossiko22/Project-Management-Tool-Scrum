#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$PROJECT_ROOT/.pids"

echo -e "${YELLOW}Stopping all local services...${NC}"
echo ""

# Function to stop a service
stop_service() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
            kill $pid 2>/dev/null

            # Wait for process to stop
            local count=0
            while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done

            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}Force killing $name...${NC}"
                kill -9 $pid 2>/dev/null
            fi

            echo -e "${GREEN}✓ $name stopped${NC}"
        else
            echo -e "${YELLOW}$name is not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}No PID file for $name${NC}"
    fi
}

# Stop all services
stop_service "identity-service"
stop_service "scrum-core-service"
stop_service "collaboration-service"
stop_service "reporting-service"
stop_service "team-portal"
stop_service "admin-portal"

# Stop infrastructure containers
echo ""
echo -e "${YELLOW}Stopping infrastructure containers...${NC}"
docker compose stop identity-db scrum-core-db collaboration-db reporting-db zookeeper kafka

echo ""
echo -e "${GREEN}All services stopped!${NC}"

# Clean up PID directory if empty
rmdir "$PID_DIR" 2>/dev/null || true
