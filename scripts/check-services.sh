#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}Checking Local Development Services${NC}"
echo -e "${GREEN}==================================================${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✓${NC} $service (port $port) is running"
        return 0
    else
        echo -e "${RED}✗${NC} $service (port $port) is NOT running"
        return 1
    fi
}

echo -e "\n${YELLOW}Docker Infrastructure Services:${NC}"
docker-compose ps

echo -e "\n${YELLOW}Microservices:${NC}"
check_port 8080 "Identity Service"
check_port 8081 "Scrum Core Service"
check_port 3000 "Collaboration Service"
check_port 3001 "Reporting Service"
check_port 3002 "Logging Service"

echo -e "\n${YELLOW}Frontends:${NC}"
check_port 4200 "Admin Portal"
check_port 4201 "Team Portal"

echo -e "\n${YELLOW}Infrastructure:${NC}"
check_port 5432 "PostgreSQL - Identity DB"
check_port 5433 "PostgreSQL - Scrum Core DB"
check_port 5434 "PostgreSQL - Collaboration DB"
check_port 5435 "PostgreSQL - Reporting DB"
check_port 5436 "PostgreSQL - Logging DB"
check_port 5672 "RabbitMQ"
check_port 15672 "RabbitMQ Management UI"
check_port 29092 "Kafka"
check_port 2181 "Zookeeper"

echo -e "\n${GREEN}==================================================${NC}"
