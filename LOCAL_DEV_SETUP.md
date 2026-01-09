# Local Development Setup Guide

This guide explains how to run the microservices and frontends locally for development, with only the infrastructure services (databases, Kafka, RabbitMQ) running in Docker.

## Overview

### Running Locally
- **5 Microservices** (run on your machine for easy development)
  - Identity Service (Java/Spring Boot) - Port 8080
  - Scrum Core Service (Java/Spring Boot) - Port 8081
  - Collaboration Service (Node.js/NestJS) - Port 3000
  - Reporting Service (Node.js/NestJS) - Port 3001
  - Logging Service (Node.js/NestJS) - Port 3002

- **2 Frontends** (run on your machine)
  - Admin Portal (Angular) - Port 4200
  - Team Portal (Angular) - Port 4201

### Running in Docker
- **Infrastructure Services**
  - PostgreSQL databases (5 instances on ports 5432-5436)
  - RabbitMQ (ports 5672, 15672)
  - Kafka (ports 9092, 29092)
  - Zookeeper (port 2181)

## Prerequisites

Make sure you have the following installed:
- Docker and Docker Compose
- Java 17 or higher
- Maven (or use the included Maven wrapper)
- Node.js 18 or higher
- npm

## Quick Start

### Step 1: Start Infrastructure Services

Start all Docker infrastructure services (databases, Kafka, RabbitMQ, logging):

```bash
docker-compose up -d
```

Wait for all services to be healthy (about 30 seconds):

```bash
docker-compose ps
```

### Step 2: Start Microservices

Open 5 separate terminal windows and start each microservice:

#### Terminal 1 - Identity Service
```bash
./scripts/start-identity-service.sh
```

Or manually:
```bash
cd backend/identity-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

#### Terminal 2 - Scrum Core Service
```bash
./scripts/start-scrum-core-service.sh
```

Or manually:
```bash
cd backend/scrum-core-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

#### Terminal 3 - Collaboration Service
```bash
./scripts/start-collaboration-service.sh
```

Or manually:
```bash
cd backend/collaboration-service
npm install  # Only needed first time
npm run start:dev
```

#### Terminal 4 - Reporting Service
```bash
./scripts/start-reporting-service.sh
```

Or manually:
```bash
cd backend/reporting-service
npm install  # Only needed first time
npm run start:dev
```

#### Terminal 5 - Logging Service
```bash
./scripts/start-logging-service.sh
```

Or manually:
```bash
cd backend/logging-service
npm install  # Only needed first time
npm run start:dev
```

### Step 3: Start Frontends

Open 2 more terminal windows for the frontends:

#### Terminal 6 - Admin Portal
```bash
./scripts/start-admin-portal.sh
```

Or manually:
```bash
cd frontend/admin-portal
npm install  # Only needed first time
npm start
```

#### Terminal 7 - Team Portal
```bash
./scripts/start-team-portal.sh
```

Or manually:
```bash
cd frontend/team-portal
npm install  # Only needed first time
npm start -- --port 4201
```

## Access Points

Once everything is running:

### Frontends
- **Admin Portal**: http://localhost:4200
- **Team Portal**: http://localhost:4201

### Backend Services
- **Identity Service**: http://localhost:8080
- **Scrum Core Service**: http://localhost:8081
- **Collaboration Service**: http://localhost:3000
- **Reporting Service**: http://localhost:3001
- **Logging Service**: http://localhost:3002

### Infrastructure
- **RabbitMQ Management UI**: http://localhost:15672
  - Username: `admin`
  - Password: `admin`

### Databases (PostgreSQL)
- **Identity DB**: `localhost:5432` (database: `identity_db`)
- **Scrum Core DB**: `localhost:5433` (database: `scrum_core_db`)
- **Collaboration DB**: `localhost:5434` (database: `collaboration_db`)
- **Reporting DB**: `localhost:5435` (database: `reporting_db`)
- **Logging DB**: `localhost:5436` (database: `logging_db`)
- Username: `postgres`
- Password: `postgres`

## Configuration Files

Each microservice has a `.env.local` file in its directory with local development configuration:

- `backend/identity-service/.env.local`
- `backend/scrum-core-service/.env.local`
- `backend/collaboration-service/.env.local`
- `backend/reporting-service/.env.local`
- `backend/logging-service/.env.local`

These files are configured to connect to the Docker infrastructure on `localhost`.

## Stopping Services

### Stop Microservices and Frontends
Just press `Ctrl+C` in each terminal window.

### Stop Docker Infrastructure
```bash
docker-compose down
```

To also remove volumes (this will delete all database data):
```bash
docker-compose down -v
```

## Development Workflow

### Making Changes to Microservices

#### Java Services (Identity, Scrum Core)
- The Maven Spring Boot plugin supports hot reload
- Just save your changes and the service will automatically restart
- If it doesn't restart automatically, press `Ctrl+C` and run the start script again

#### Node.js Services (Collaboration, Reporting, Logging)
- Running with `npm run start:dev` enables watch mode
- Changes are automatically detected and the service restarts
- No manual restart needed

### Making Changes to Frontends

#### Angular Apps (Admin Portal, Team Portal)
- Running with `npm start` enables watch mode
- Changes are automatically detected and the browser refreshes
- No manual restart needed

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
1. Check if services are already running: `docker-compose ps`
2. Check for other processes: `lsof -i :PORT` (replace PORT with the specific port)
3. Stop conflicting services or change the port in configuration

### Database Connection Failed
1. Ensure Docker services are running: `docker-compose ps`
2. Wait for databases to be healthy (check with `docker-compose ps`)
3. Check connection details in `.env.local` files

### Kafka Connection Issues
1. Ensure Kafka and Zookeeper are healthy: `docker-compose ps`
2. Make sure you're using `localhost:29092` for local services (not `localhost:9092`)

### Node Modules Issues
If you get module not found errors:
```bash
cd backend/collaboration-service  # or reporting-service
rm -rf node_modules package-lock.json
npm install
```

### Maven Build Issues
If you get Maven errors:
```bash
cd backend/identity-service  # or scrum-core-service
./mvnw clean install
```

## Useful Commands

### Check Docker Infrastructure Status
```bash
docker-compose ps
```

### View Docker Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kafka
docker-compose logs -f rabbitmq
docker-compose logs -f identity-db
```

### Restart Docker Infrastructure
```bash
docker-compose restart
```

### Clean Start (removes all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Tips

1. **Use tmux or screen**: For easier terminal management, consider using tmux or screen to manage multiple terminal sessions
2. **IDE Integration**: Most IDEs (IntelliJ IDEA, VS Code) can run these services directly with built-in terminals
3. **Logging**: All services log to their respective terminal windows, making it easy to debug
4. **Database Tools**: Use tools like DBeaver, pgAdmin, or DataGrip to connect to the PostgreSQL databases
5. **API Testing**: Use Postman, Insomnia, or curl to test the APIs directly

## Next Steps

- Check the main `README.md` for API documentation
- Refer to `DEMO_QUICK_REFERENCE.md` for testing scenarios
- See individual service directories for service-specific documentation
