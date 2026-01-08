# Swagger API Endpoints

All microservices have Swagger/OpenAPI documentation configured.

## 1. Identity Service (Port 8080)
**Swagger UI:** http://localhost:8080/api-docs
**OpenAPI JSON:** http://localhost:8080/v3/api-docs

**Available APIs:**
- Authentication (login, logout, user info)
- User Management
- Project Management
- Team Management

---

## 2. Scrum Core Service (Port 8081)
**Swagger UI:** http://localhost:8081/api/api-docs
**OpenAPI JSON:** http://localhost:8081/api/v3/api-docs

**Available APIs:**
- Sprints Management
- Backlog Management
- Tasks Management
- Retrospectives
- Impediments
- Sprint Items Approval

---

## 3. Collaboration Service (Port 3000)
**Swagger UI:** http://localhost:3000/api-docs
**OpenAPI JSON:** http://localhost:3000/api-docs-json

**Available APIs:**
- Comments Management
- Notifications Management
- Activity Logs

---

## 4. Reporting Service (Port 3001)
**Swagger UI:** http://localhost:3001/api-docs
**OpenAPI JSON:** http://localhost:3001/api-docs-json

**Available APIs:**
- Velocity Tracking
- Burndown Charts
- Sprint Metrics

---

## 5. Logging Service (Port 3002)
**Swagger UI:** http://localhost:3002/api-docs
**OpenAPI JSON:** http://localhost:3002/api-docs-json

**Available APIs:**
- POST /logs - Download logs from RabbitMQ queue to database
- GET /logs/{dateFrom}/{dateTo} - Get logs by date range from database
- DELETE /logs - Delete all logs from database
- GET /health - Service health check

---

## Quick Access Links

When all services are running:

| Service | Swagger UI |
|---------|------------|
| Identity Service | http://localhost:8080/api-docs |
| Scrum Core Service | http://localhost:8081/api/api-docs |
| Collaboration Service | http://localhost:3000/api-docs |
| Reporting Service | http://localhost:3001/api-docs |
| Logging Service | http://localhost:3002/api-docs |

---

## RabbitMQ Management UI
**URL:** http://localhost:15672
**Username:** admin
**Password:** admin

View the `logging_queue` to see accumulated logs before calling POST /logs.

---

## Testing the Logging System

### 1. View Swagger Documentation
```bash
# Open in browser
firefox http://localhost:3002/api-docs
```

### 2. Try the endpoints via Swagger UI
- Click "Try it out" on any endpoint
- Fill in parameters
- Click "Execute"

### 3. Or use curl
```bash
# Download logs from RabbitMQ
curl -X POST http://localhost:3002/logs

# Get logs by date range
curl http://localhost:3002/logs/2026-01-01/2026-01-05

# Delete all logs
curl -X DELETE http://localhost:3002/logs

# Health check
curl http://localhost:3002/health
```
