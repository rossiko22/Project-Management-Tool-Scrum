#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}Starting Local Development Environment${NC}"
echo -e "${GREEN}==================================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo -e "\n${YELLOW}Checking required tools...${NC}"
REQUIRED_TOOLS=("docker" "docker-compose" "java" "node" "npm" "mvn")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command_exists "$tool"; then
        MISSING_TOOLS+=("$tool")
        echo -e "${RED}✗ $tool not found${NC}"
    else
        echo -e "${GREEN}✓ $tool found${NC}"
    fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo -e "\n${RED}Error: Missing required tools: ${MISSING_TOOLS[*]}${NC}"
    echo -e "${YELLOW}Please install the missing tools and try again.${NC}"
    exit 1
fi

# Start Docker infrastructure
echo -e "\n${YELLOW}Step 1: Starting Docker infrastructure...${NC}"
echo -e "${YELLOW}(Databases, Kafka, RabbitMQ)${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for infrastructure services to be healthy...${NC}"
sleep 10

# Show infrastructure status
echo -e "\n${GREEN}Infrastructure Services Status:${NC}"
docker-compose ps

echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}Docker infrastructure is running!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo -e "${YELLOW}RabbitMQ Management UI: http://localhost:15672${NC}"
echo -e "${YELLOW}  Username: admin${NC}"
echo -e "${YELLOW}  Password: admin${NC}"
echo ""
echo -e "${YELLOW}PostgreSQL Databases:${NC}"
echo -e "  - identity-db:     localhost:5432"
echo -e "  - scrum-core-db:   localhost:5433"
echo -e "  - collaboration-db: localhost:5434"
echo -e "  - reporting-db:    localhost:5435"
echo -e "  - logging-db:      localhost:5436"
echo ""
echo -e "${YELLOW}Kafka:${NC}"
echo -e "  - Broker: localhost:29092"
echo -e "${GREEN}==================================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Start microservices in separate terminals:"
echo -e "   ${GREEN}Terminal 1:${NC} cd backend/identity-service && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local"
echo -e "   ${GREEN}Terminal 2:${NC} cd backend/scrum-core-service && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local"
echo -e "   ${GREEN}Terminal 3:${NC} cd backend/collaboration-service && npm install && npm run start:dev"
echo -e "   ${GREEN}Terminal 4:${NC} cd backend/reporting-service && npm install && npm run start:dev"
echo -e "   ${GREEN}Terminal 5:${NC} cd backend/logging-service && npm install && npm run start:dev"
echo ""
echo -e "2. Start frontends in separate terminals:"
echo -e "   ${GREEN}Terminal 6:${NC} cd frontend/admin-portal && npm install && npm start"
echo -e "   ${GREEN}Terminal 7:${NC} cd frontend/team-portal && npm install && npm start -- --port 4201"
echo ""
echo -e "${YELLOW}Or use the individual start scripts in the 'scripts' directory${NC}"
echo -e "${GREEN}==================================================${NC}"
