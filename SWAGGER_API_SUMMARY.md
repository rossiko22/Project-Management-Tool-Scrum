# Swagger API Documentation - Quick Reference

## 🔗 Swagger UI Links (Click to Open)

All services are running on localhost. Open these URLs in your browser:

### 1. Identity Service (Port 8080)
```
http://localhost:8080/api-docs
```
**APIs:** Authentication, Users, Projects, Teams

### 2. Scrum Core Service (Port 8081)
```
http://localhost:8081/api/api-docs
```
**APIs:** Sprints, Backlog, Tasks, Retrospectives, Impediments, Approvals

### 3. Collaboration Service (Port 3000)
```
http://localhost:3000/api-docs
```
**APIs:** Comments, Notifications, Activity Logs

### 4. Reporting Service (Port 3001)
```
http://localhost:3001/api-docs
```
**APIs:** Velocity, Burndown Charts, Sprint Metrics

### 5. Logging Service (Port 3002) ⭐
```
http://localhost:3002/api-docs
```
**APIs:** Log Management (POST/GET/DELETE)

---

## 📊 Logging Service Endpoints (Messaging Pattern)

### 1. POST /logs
**Downloads all logs from RabbitMQ queue to database**

```bash
curl -X POST http://localhost:3002/logs
```

**Response:**
```json
{
  "message": "Logs downloaded and stored successfully",
  "count": 15
}
```

---

### 2. GET /logs/{dateFrom}/{dateTo}
**Retrieves logs from database by date range**

```bash
# Format: YYYY-MM-DD
curl http://localhost:3002/logs/2026-01-01/2026-01-05
```

**Response:**
```json
{
  "dateFrom": "2026-01-01T00:00:00.000Z",
  "dateTo": "2026-01-05T00:00:00.000Z",
  "count": 15,
  "logs": [
    {
      "id": 1,
      "timestamp": "2026-01-02T10:15:30.000Z",
      "log_type": "INFO",
      "url": "/api/auth/authenticate",
      "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
      "application_name": "identity-service",
      "message": "User authenticated successfully"
    }
  ]
}
```

---

### 3. DELETE /logs
**Deletes all logs from database**

```bash
curl -X DELETE http://localhost:3002/logs
```

**Response:**
```json
{
  "message": "All logs deleted successfully",
  "count": 15
}
```

---

### 4. GET /health
**Service health check**

```bash
curl http://localhost:3002/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "logging-service",
  "database": "connected",
  "rabbitmq": "connected (repository mode)",
  "logCount": 15,
  "message": "RabbitMQ is acting as a log repository. Call POST /logs to download and store logs."
}
```

---

## 🧪 Testing Workflow

### Step 1: Generate Logs
Make API calls to any service to generate logs:

```bash
# Authenticate (generates 2 logs: attempt + success)
curl -X POST http://localhost:8080/api/auth/authenticate \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "sm123@example.com",
    "password": "admin123"
  }'
```

### Step 2: Check RabbitMQ Queue
Logs accumulate in the queue:

```bash
# RabbitMQ Management UI
http://localhost:15672
# Username: admin, Password: admin
# Navigate to Queues → logging_queue
```

### Step 3: Download Logs to Database
```bash
curl -X POST http://localhost:3002/logs
```

### Step 4: Query Logs
```bash
curl http://localhost:3002/logs/2026-01-01/2026-01-05
```

---

## 📝 Log Format

Logs are stored with the following structure:

```
<timestamp> <LogType> <URL> Correlation: <ID> [<ApplicationName>] - <Message>
```

**Example:**
```
2026-01-02 16:26:04.797 INFO /api/auth/authenticate Correlation: 550e8400-e29b-41d4-a716-446655440000 [identity-service] - User authenticated successfully
```

**Fields:**
- **timestamp**: ISO 8601 format
- **log_type**: INFO, WARN, ERROR, DEBUG
- **url**: Request URL
- **correlation_id**: UUID for tracing requests across services
- **application_name**: Source microservice
- **message**: Log message

---

## 🐰 RabbitMQ Configuration

**Management UI:** http://localhost:15672
- **Username:** admin
- **Password:** admin

**Queue:** `logging_queue`
**Exchange:** `logging_exchange` (type: topic)
**Routing Key:** `logs`

---

## 🎯 Quick Test Script

Run the comprehensive test:

```bash
./test-logging-system.sh
```

This script will:
1. ✓ Check service health
2. ✓ Verify RabbitMQ queue
3. ✓ Generate test logs
4. ✓ Download logs with POST /logs
5. ✓ Query logs by date range
6. ✓ Demonstrate all endpoints

---

## ✅ Verification Checklist

- [x] RabbitMQ acts as log repository (not auto-consumer)
- [x] Own RabbitMQ instance in docker-compose
- [x] Own exchange: `logging_exchange`
- [x] Own queue: `logging_queue`
- [x] Correlation ID tracking across all services
- [x] Proper log structure with all fields
- [x] POST /logs endpoint working
- [x] GET /logs/{from}/{to} endpoint working
- [x] DELETE /logs endpoint working
- [x] All microservices sending logs to RabbitMQ
- [x] Swagger documentation available

---

## 📚 Additional Resources

- **Full Documentation:** `LOGGING_SYSTEM_IMPLEMENTATION.md`
- **Test Script:** `test-logging-system.sh`
- **Docker Compose:** `docker-compose.yml`

---

## 🚀 Quick Start

1. Start all services:
   ```bash
   docker compose up -d
   ```

2. Access Swagger UIs:
   - Identity: http://localhost:8080/api-docs
   - Scrum Core: http://localhost:8081/api/api-docs
   - Collaboration: http://localhost:3000/api-docs
   - Reporting: http://localhost:3001/api-docs
   - **Logging**: http://localhost:3002/api-docs ⭐

3. Test the logging system:
   ```bash
   ./test-logging-system.sh
   ```

That's it! 🎉
