#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$PROJECT_ROOT/.pids"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Local Development Services Status${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check if process is running
check_process() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"
    local port=$2
    local health_url=$3

    printf "%-25s" "$name:"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            # Check if port is accessible
            if lsof -i:$port >/dev/null 2>&1; then
                # Check health endpoint if provided
                if [ -n "$health_url" ]; then
                    if curl -sf "$health_url" >/dev/null 2>&1; then
                        echo -e "${GREEN}✓ Running${NC} (PID: $pid, Port: $port, Healthy)"
                    else
                        echo -e "${YELLOW}⚠ Running${NC} (PID: $pid, Port: $port, Not responding)"
                    fi
                else
                    echo -e "${GREEN}✓ Running${NC} (PID: $pid, Port: $port)"
                fi
            else
                echo -e "${YELLOW}⚠ Process exists${NC} (PID: $pid, but port $port not in use)"
            fi
        else
            echo -e "${RED}✗ Stopped${NC} (PID file exists but process not running)"
        fi
    else
        echo -e "${RED}✗ Not started${NC}"
    fi
}

# Check infrastructure
echo -e "${BLUE}Infrastructure (Docker):${NC}"
printf "%-25s" "PostgreSQL (identity):"
if docker ps --format '{{.Names}}' | grep -q "^identity-db$"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Stopped${NC}"
fi

printf "%-25s" "PostgreSQL (scrum-core):"
if docker ps --format '{{.Names}}' | grep -q "^scrum-core-db$"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Stopped${NC}"
fi

printf "%-25s" "PostgreSQL (collab):"
if docker ps --format '{{.Names}}' | grep -q "^collaboration-db$"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Stopped${NC}"
fi

printf "%-25s" "PostgreSQL (reporting):"
if docker ps --format '{{.Names}}' | grep -q "^reporting-db$"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Stopped${NC}"
fi

printf "%-25s" "Kafka:"
if docker ps --format '{{.Names}}' | grep -q "^kafka$"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Stopped${NC}"
fi

printf "%-25s" "Zookeeper:"
if docker ps --format '{{.Names}}' | grep -q "^zookeeper$"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Stopped${NC}"
fi

echo ""
echo -e "${BLUE}Backend Services:${NC}"
check_process "identity-service" 8080 "http://localhost:8080/actuator/health"
check_process "scrum-core-service" 8081 "http://localhost:8081/api/actuator/health"
check_process "collaboration-service" 3000 "http://localhost:3000/health"
check_process "reporting-service" 3001 "http://localhost:3001/api/health"

echo ""
echo -e "${BLUE}Frontend Services:${NC}"
check_process "team-portal" 4200
check_process "admin-portal" 4201

echo ""
echo -e "${BLUE}Quick Links:${NC}"
echo "  • Team Portal:           http://localhost:4200"
echo "  • Admin Portal:          http://localhost:4201"
echo "  • Identity Service:      http://localhost:8080"
echo "  • Scrum Core Service:    http://localhost:8081"
echo "  • Collaboration Service: http://localhost:3000"
echo "  • Reporting Service:     http://localhost:3001"
echo ""
echo -e "${BLUE}Commands:${NC}"
echo "  • Start all:  ./run-local.sh"
echo "  • Stop all:   ./stop-local.sh"
echo "  • View logs:  ./view-logs.sh [service-name]"
echo "  • This info:  ./status-local.sh"
echo ""
