# Quick Start Guide

## Architecture Overview

This application uses a **single nginx gateway** (`backend/nginx/nginx.conf`) that serves both:
- Frontend Angular applications (static files at `/admin` and `/app`)
- Backend API services (reverse proxy at `/api/*`)

### Important: Only ONE nginx.conf
The project has **only one nginx configuration file**: `backend/nginx/nginx.conf`
- This is the main API gateway and static file server
- Frontend Dockerfiles use inline configs (dev mode only)

### URL Structure

```
http://localhost/admin          → Admin Portal (Angular SPA)
http://localhost/app            → Team Portal (Angular SPA)
http://localhost/api/identity/* → Identity Service (Spring Boot)
http://localhost/api/scrum/*    → Scrum Core Service (Spring Boot)
http://localhost/api/collaboration/* → Collaboration Service (NestJS)
http://localhost/api/reporting/* → Reporting Service (NestJS)
http://localhost/ws             → WebSocket (Collaboration Service)
```

## Setup Instructions

### Single Command Setup! 🚀

```bash
docker-compose up --build
```

**That's it!** Docker will automatically:
1. ✅ Build PostgreSQL databases (4 instances)
2. ✅ Build Kafka + Zookeeper
3. ✅ Build Identity Service (Spring Boot)
4. ✅ Build Scrum Core Service (Spring Boot)
5. ✅ Build Collaboration Service (NestJS)
6. ✅ Build Reporting Service (NestJS)
7. ✅ **Build Angular apps** (admin-portal & team-portal)
8. ✅ Build Nginx Gateway with all frontend apps included

### Access the Application

Once all containers are healthy (wait ~1-2 minutes):

- **Admin Portal**: http://localhost/admin
- **Team Portal**: http://localhost/app
- **API Gateway**: http://localhost/api/*
- **Health Check**: http://localhost/health

## CORS Configuration

CORS is handled at multiple layers:

1. **Backend Services**: Each microservice (Spring Boot and NestJS) has CORS enabled with permissive settings for development
2. **Nginx Gateway**: Passes through CORS headers from backend services and handles OPTIONS preflight requests

## Troubleshooting

### Nginx fails to start

Check logs:
```bash
docker logs nginx-gateway
```

Common issues:
- Frontend build failed: Check logs during `docker-compose up --build`
- Configuration syntax error: Test with `docker exec nginx-gateway nginx -t`
- Port 80 already in use: Stop other services using port 80

### CORS errors

1. Ensure all services are running: `docker-compose ps`
2. Check browser console for specific error
3. Verify API calls are going to `http://localhost/api/*` not `http://localhost:8000/api/*`

### Database connection errors

Wait for databases to be healthy:
```bash
docker-compose ps
```

All services should show "Up (healthy)"

## Clean Restart

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild and start fresh
docker-compose up --build
```

## Quick Commands Reference

```bash
# Start all services
docker-compose up --build

# Start in background (detached mode)
docker-compose up --build -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f nginx-gateway

# Stop all services
docker-compose down

# Check service status
docker-compose ps

# Restart a specific service
docker-compose restart nginx-gateway
```
