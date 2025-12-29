# Local Development Guide

This guide explains how to run the application locally without rebuilding Docker containers every time you make changes.

## Overview

The local development setup keeps infrastructure (databases, Kafka, Zookeeper) in Docker containers while running your application services locally. This gives you:

- **Fast development**: Changes to backend/frontend code reload automatically
- **No Docker rebuilds**: Only infrastructure runs in Docker
- **Easy debugging**: Direct access to service logs and processes
- **Better performance**: Services run natively on your machine

## Architecture

### What runs in Docker:
- PostgreSQL databases (4 instances on ports 5432, 5433, 5434, 5435)
- Kafka (port 29092)
- Zookeeper (port 2181)

### What runs locally:
- **Identity Service** (Spring Boot) - port 8080
- **Scrum Core Service** (Spring Boot) - port 8081
- **Collaboration Service** (NestJS) - port 3000
- **Reporting Service** (NestJS) - port 3001
- **Team Portal** (Angular) - port 4200
- **Admin Portal** (Angular) - port 4201

## Prerequisites

1. **Docker & Docker Compose** - for infrastructure
2. **Java 17+** - for Spring Boot services
3. **Maven** - for building Spring Boot services
4. **Node.js 18+** - for NestJS and Angular services
5. **npm** - for Node.js dependencies

## Quick Start

### 1. Start all services

```bash
./run-local.sh
```

This script will:
1. Start infrastructure containers (databases, Kafka)
2. Start all backend services with hot reload
3. Start all frontend services with hot reload
4. Wait for all services to be healthy

### 2. Access the applications

- **Team Portal**: http://localhost:4200
- **Admin Portal**: http://localhost:4201
- **Identity Service API**: http://localhost:8080
- **Scrum Core Service API**: http://localhost:8081
- **Collaboration Service API**: http://localhost:3000
- **Reporting Service API**: http://localhost:3001

### 3. Stop all services

```bash
./stop-local.sh
```

Or press `Ctrl+C` in the terminal running `run-local.sh`.

## Development Workflow

### Backend Changes (Spring Boot)

When you modify Java code in `identity-service` or `scrum-core-service`:
- Changes are automatically detected and the service restarts
- No need to rebuild Docker containers
- View logs: `tail -f logs/identity-service.log` or `logs/scrum-core-service.log`

### Backend Changes (NestJS)

When you modify TypeScript code in `collaboration-service` or `reporting-service`:
- Changes are automatically detected and hot-reloaded
- No need to restart services
- View logs: `tail -f logs/collaboration-service.log` or `logs/reporting-service.log`

### Frontend Changes (Angular)

When you modify code in `team-portal` or `admin-portal`:
- Changes are automatically detected and hot-reloaded in the browser
- No need to restart services
- View logs: `tail -f logs/team-portal.log` or `logs/admin-portal.log`

## API Routing

The Angular frontends use proxy configurations to route API calls to the correct backend services, replicating the nginx behavior in production:

### Team Portal (localhost:4200)
- `/api/identity/*` → Identity Service (localhost:8080)
- `/api/scrum/*` → Scrum Core Service (localhost:8081)
- `/api/collaboration/*` → Collaboration Service (localhost:3000)
- `/ws` → Collaboration Service WebSocket (localhost:3000)

### Admin Portal (localhost:4201)
- `/api/identity/*` → Identity Service (localhost:8080)
- `/api/scrum/*` → Scrum Core Service (localhost:8081)
- `/api/collaboration/*` → Collaboration Service (localhost:3000)
- `/api/reporting/*` → Reporting Service (localhost:3001)
- `/ws` → Collaboration Service WebSocket (localhost:3000)

## Logs

All service logs are stored in the `logs/` directory:
- `identity-service.log`
- `scrum-core-service.log`
- `collaboration-service.log`
- `reporting-service.log`
- `team-portal.log`
- `admin-portal.log`

### View logs in real-time:
```bash
# All services
tail -f logs/*.log

# Specific service
tail -f logs/identity-service.log
```

## Troubleshooting

### Port already in use

If you get a "port already in use" error:
1. Check what's using the port: `lsof -i:PORT_NUMBER`
2. Stop the process or use `./stop-local.sh`

### Service won't start

1. Check the logs: `cat logs/SERVICE_NAME.log`
2. Ensure infrastructure is running: `docker-compose ps`
3. Restart infrastructure: `docker-compose restart`

### Database connection issues

1. Ensure databases are healthy: `docker-compose ps`
2. Check database ports are accessible:
   ```bash
   nc -zv localhost 5432  # identity-db
   nc -zv localhost 5433  # scrum-core-db
   nc -zv localhost 5434  # collaboration-db
   nc -zv localhost 5435  # reporting-db
   ```

### Kafka issues

1. Check Kafka is running: `docker-compose ps kafka`
2. Restart Kafka: `docker-compose restart kafka zookeeper`
3. Check Kafka port: `nc -zv localhost 29092`

### Clean restart

To completely reset everything:
```bash
./stop-local.sh
docker-compose down -v  # Warning: removes all data
./run-local.sh
```

## Running Individual Services

If you need to run services individually for debugging:

### Identity Service
```bash
cd backend/identity-service
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/identity_db
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres
export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:29092
export JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256
export JWT_EXPIRATION=28800000
./mvnw spring-boot:run
```

### Scrum Core Service
```bash
cd backend/scrum-core-service
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/scrum_core_db
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres
export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:29092
export JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256
export SERVER_PORT=8081
./mvnw spring-boot:run
```

### Collaboration Service
```bash
cd backend/collaboration-service
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
npm run start:dev
```

### Reporting Service
```bash
cd backend/reporting-service
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
npm run start:dev
```

### Team Portal
```bash
cd frontend/team-portal
npm start -- --port 4200
```

### Admin Portal
```bash
cd frontend/admin-portal
npm start -- --port 4201
```

## Switching Between Local and Docker

### To use local development:
```bash
./run-local.sh
```

### To use full Docker setup:
```bash
./stop-local.sh
docker-compose up --build
```

## Performance Tips

1. **First startup is slow**: Maven builds and npm installs happen on first run
2. **Subsequent startups are fast**: Only infrastructure starts in Docker
3. **Hot reload**: All services support hot reload for fast development
4. **Resource usage**: Running locally uses less memory than Docker containers

## Environment Variables

All environment variables are set automatically by `run-local.sh`. If you need to customize them:
1. Edit `run-local.sh`
2. Or export them in your terminal before running individual services

## Notes

- The script creates a `.pids/` directory to track process IDs
- Logs are stored in `logs/` directory
- Infrastructure data is persisted in Docker volumes
- To reset databases, use: `docker-compose down -v && docker-compose up -d`
