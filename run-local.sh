#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
PID_DIR="$PROJECT_ROOT/.pids"

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Starting Application in Local Development Mode${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    lsof -i:$1 >/dev/null 2>&1
    return $?
}

# Function to wait for a service to be ready
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=${3:-30}
    local attempt=0

    print_info "Waiting for $name to be ready..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            print_status "$name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done

    print_error "$name failed to start within expected time"
    return 1
}

# Function to wait for Docker container to be healthy
wait_for_container() {
    local name=$1
    local max_attempts=${2:-30}
    local attempt=0

    print_info "Waiting for $name to be ready..."

    while [ $attempt -lt $max_attempts ]; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null)
        if [ "$health" = "healthy" ]; then
            print_status "$name is ready!"
            return 0
        fi
        # If container has no healthcheck, just check if it's running
        local status=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null)
        if [ "$status" = "running" ] && [ -z "$health" ]; then
            print_status "$name is running!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done

    print_error "$name failed to start within expected time"
    return 1
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    bash "$PROJECT_ROOT/stop-local.sh"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Step 1: Start infrastructure (databases, Kafka, Zookeeper)
echo -e "${BLUE}Step 1: Starting infrastructure (databases, Kafka, Zookeeper)${NC}"
docker compose up -d identity-db scrum-core-db collaboration-db reporting-db zookeeper kafka

# Wait for infrastructure to be ready
wait_for_container "kafka" 60
print_info "Giving Kafka extra time to initialize topics..."
sleep 5

# Step 2: Start Backend Services
echo ""
echo -e "${BLUE}Step 2: Starting Backend Services${NC}"

# Identity Service (Spring Boot)
print_info "Starting Identity Service on port 8080..."
cd "$PROJECT_ROOT/backend/identity-service"
if [ ! -d "target" ]; then
    print_info "Building Identity Service (first time)..."
    ./mvnw clean package -DskipTests
fi

export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/identity_db
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres
export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:29092
export JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256
export JWT_EXPIRATION=28800000
export SERVER_PORT=8080

./mvnw spring-boot:run > "$LOG_DIR/identity-service.log" 2>&1 &
echo $! > "$PID_DIR/identity-service.pid"
print_status "Identity Service starting... (logs: logs/identity-service.log)"

# Wait for Identity Service
wait_for_service "Identity Service" "http://localhost:8080/actuator/health" 60

# Scrum Core Service (Spring Boot)
print_info "Starting Scrum Core Service on port 8081..."
cd "$PROJECT_ROOT/backend/scrum-core-service"
if [ ! -d "target" ]; then
    print_info "Building Scrum Core Service (first time)..."
    ./mvnw clean package -DskipTests
fi

export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/scrum_core_db
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres
export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:29092
export JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256
export SERVER_PORT=8081

./mvnw spring-boot:run > "$LOG_DIR/scrum-core-service.log" 2>&1 &
echo $! > "$PID_DIR/scrum-core-service.pid"
print_status "Scrum Core Service starting... (logs: logs/scrum-core-service.log)"

# Wait for Scrum Core Service
wait_for_service "Scrum Core Service" "http://localhost:8081/api/actuator/health" 60

# Collaboration Service (NestJS)
print_info "Starting Collaboration Service on port 3000..."
cd "$PROJECT_ROOT/backend/collaboration-service"
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies for Collaboration Service..."
    npm install
fi

export NODE_ENV=development
export PORT=3000
export DB_HOST=localhost
export DB_PORT=5434
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=collaboration_db
export KAFKA_BROKER=localhost:29092
export KAFKA_GROUP_ID=collaboration-service-group
export JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256

npm run start:dev > "$LOG_DIR/collaboration-service.log" 2>&1 &
echo $! > "$PID_DIR/collaboration-service.pid"
print_status "Collaboration Service starting... (logs: logs/collaboration-service.log)"

# Wait for Collaboration Service
wait_for_service "Collaboration Service" "http://localhost:3000/health" 60

# Reporting Service (NestJS)
print_info "Starting Reporting Service on port 3001..."
cd "$PROJECT_ROOT/backend/reporting-service"
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies for Reporting Service..."
    npm install
fi

export NODE_ENV=development
export PORT=3001
export DB_HOST=localhost
export DB_PORT=5435
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=reporting_db
export KAFKA_BROKER=localhost:29092
export KAFKA_GROUP_ID=reporting-service-group
export JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256

npm run start:dev > "$LOG_DIR/reporting-service.log" 2>&1 &
echo $! > "$PID_DIR/reporting-service.pid"
print_status "Reporting Service starting... (logs: logs/reporting-service.log)"

# Wait for Reporting Service
wait_for_service "Reporting Service" "http://localhost:3001/api/health" 60

# Step 3: Start Frontend Services
echo ""
echo -e "${BLUE}Step 3: Starting Frontend Services${NC}"

# Team Portal (Angular)
print_info "Starting Team Portal on port 4200..."
cd "$PROJECT_ROOT/frontend/team-portal"
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies for Team Portal..."
    npm install
fi

npm start -- --port 4200 > "$LOG_DIR/team-portal.log" 2>&1 &
echo $! > "$PID_DIR/team-portal.pid"
print_status "Team Portal starting on http://localhost:4200 (logs: logs/team-portal.log)"

# Admin Portal (Angular)
print_info "Starting Admin Portal on port 4201..."
cd "$PROJECT_ROOT/frontend/admin-portal"
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies for Admin Portal..."
    npm install
fi

npm start -- --port 4201 > "$LOG_DIR/admin-portal.log" 2>&1 &
echo $! > "$PID_DIR/admin-portal.pid"
print_status "Admin Portal starting on http://localhost:4201 (logs: logs/admin-portal.log)"

# Summary
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  All Services Started Successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  • Identity Service:      http://localhost:8080"
echo "  • Scrum Core Service:    http://localhost:8081"
echo "  • Collaboration Service: http://localhost:3000"
echo "  • Reporting Service:     http://localhost:3001"
echo ""
echo -e "${BLUE}Frontend:${NC}"
echo "  • Team Portal:  http://localhost:4200"
echo "  • Admin Portal: http://localhost:4201"
echo ""
echo -e "${BLUE}Infrastructure:${NC}"
echo "  • PostgreSQL DBs: 5432, 5433, 5434, 5435"
echo "  • Kafka: localhost:29092"
echo ""
echo -e "${YELLOW}Logs are available in: $LOG_DIR${NC}"
echo -e "${YELLOW}To stop all services, run: ./stop-local.sh${NC}"
echo -e "${YELLOW}To view logs in real-time: tail -f logs/<service-name>.log${NC}"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"

# Wait indefinitely
wait
