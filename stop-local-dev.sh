#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==================================================${NC}"
echo -e "${YELLOW}Stopping Local Development Environment${NC}"
echo -e "${YELLOW}==================================================${NC}"

echo -e "\n${YELLOW}Stopping Docker infrastructure...${NC}"
docker-compose down

echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}Docker infrastructure stopped!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo -e "${YELLOW}Note: Microservices and frontends running in terminals${NC}"
echo -e "${YELLOW}need to be stopped manually with Ctrl+C${NC}"
echo -e "${GREEN}==================================================${NC}"
