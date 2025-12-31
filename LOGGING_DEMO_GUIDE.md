# RabbitMQ Logging System - Professor Demonstration Guide

## Overview
This microservices project implements a centralized logging system using RabbitMQ as a message broker, following the Messaging Pattern for distributed systems.

## Architecture

```
[Microservices] → [RabbitMQ] → [Logging Service] → [PostgreSQL Database]
                   (Exchange)    (Auto-Consumer)      (Persistent Storage)
```

### Components:
1. **RabbitMQ** - Message broker with topic exchange (`logging_exchange`)
2. **Logging Service** (Node.js, Port 3002) - Consumes logs and stores in database
3. **4 Microservices** - All send logs to RabbitMQ:
   - identity-service (Port 8080)
   - scrum-core-service (Port 8081)
   - collaboration-service (Port 3001)
   - reporting-service (Port 3003)

## Key Features

### 1. Correlation ID Tracking
- Every request gets a unique `X-Correlation-ID`
- IDs propagate across all microservice calls
- Enables end-to-end request tracing

### 2. Structured Log Format
```
<timestamp> <LogType> <URL> Correlation: <ID> [<Service>] - <Message>
```

### 3. Three Logging Endpoints
- `POST /logs` - Manual log download from RabbitMQ
- `GET /logs/{dateFrom}/{dateTo}` - Query logs by date range
- `DELETE /logs` - Clear all logs

---

## DEMONSTRATION STEPS

### Prerequisites (Before Professor Arrives)

1. **Rebuild Services** (Run once before demo):
```bash
cd /home/unknown/Desktop/Proekt

# Rebuild services with logging implementation
docker compose build identity-service scrum-core-service
docker compose restart identity-service scrum-core-service

# Wait 30 seconds for services to start
sleep 30
```

2. **Clear Old Logs**:
```bash
curl -X DELETE "http://localhost:3002/logs"
```

---

### STEP 1: Verify Infrastructure (30 seconds)

Show that all components are running:

```bash
# Check all services
docker compose ps | grep -E "(identity|scrum|logging|rabbitmq)"

# Check RabbitMQ
curl http://localhost:15672/api/overview -u admin:admin123 | jq .object_totals

# Check Logging Service
curl http://localhost:3002/health
```

**Expected**: All services show "Up" status

---

### STEP 2: Generate Test Logs (1 minute)

Run the comprehensive test script:

```bash
chmod +x /tmp/test-logging-complete.sh
/tmp/test-logging-complete.sh
```

**What This Shows**:
- ✅ Services send logs to RabbitMQ
- ✅ Logs include correlation IDs
- ✅ Background consumer auto-processes messages
- ✅ Logs stored in PostgreSQL database
- ✅ Multiple services logging to same system

**Expected Output**:
```
✓ Logging infrastructure working
✓ Services sending logs to RabbitMQ
✓ Logs saved to database: X logs
✓ Correlation IDs working: X/X logs
✓ Query by date working
✓ Delete endpoint working

ALL TESTS PASSED!
```

---

### STEP 3: Manual API Demonstration (2 minutes)

Show the flow with manual curl commands:

```bash
# 1. Authenticate to get JWT token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: professor-demo-001" \
  -d '{"email":"po123@example.com","password":"admin123"}' | jq -r .token)

echo "Token obtained: ${TOKEN:0:50}..."

# 2. Make an API call with correlation ID
echo ""
echo "Making API call to get projects..."
curl -s "http://localhost:8080/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: professor-demo-001" | jq .

# 3. Make another call to different service
echo ""
echo "Making API call to get backlog items..."
curl -s "http://localhost:8081/api/scrum/projects/1/backlog" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: professor-demo-001" | jq .

# 4. Wait for logs to process
echo ""
echo "Waiting 3 seconds for logs to be processed..."
sleep 3
```

**What This Shows**:
- Requests with custom correlation IDs
- Multiple microservices called with same correlation ID
- Cross-service request tracing

---

### STEP 4: Query Logs (1 minute)

Retrieve and display logs:

```bash
# Get today's logs
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d 2>/dev/null)

echo "Querying logs from $TODAY to $TOMORROW..."
curl -s "http://localhost:3002/logs/$TODAY/$TOMORROW" | jq .

# Filter logs by correlation ID
echo ""
echo "Filtering logs with correlation ID 'professor-demo-001':"
curl -s "http://localhost:3002/logs/$TODAY/$TOMORROW" | \
  jq -r '.logs[] | select(.correlation_id=="professor-demo-001") |
         "\(.timestamp) \(.log_type) \(.url) Correlation: \(.correlation_id) [\(.application_name)] - \(.message)"'
```

**What This Shows**:
- All logs for a specific correlation ID
- Logs from multiple services (identity-service, scrum-core-service)
- Complete request trace across microservices

---

### STEP 5: Show Database Persistence (30 seconds)

Query database directly:

```bash
docker exec -i logging-db psql -U postgres -d logging_db \
  -c "SELECT timestamp, log_type, application_name, correlation_id, message
      FROM logs
      WHERE correlation_id = 'professor-demo-001'
      ORDER BY timestamp DESC
      LIMIT 10;"
```

**What This Shows**:
- Logs are persisted in PostgreSQL
- Can query by correlation ID, date, service, etc.
- Data survives service restarts

---

### STEP 6: RabbitMQ Management UI (Optional - 1 minute)

Open browser to: `http://localhost:15672`
- Username: `admin`
- Password: `admin123`

Navigate to:
1. **Exchanges** → Show `logging_exchange` (topic)
2. **Queues** → Show `logging_queue` (durable)
3. **Connections** → Show active connections from services

**What This Shows**:
- RabbitMQ infrastructure configuration
- Real-time message flow
- Service connections

---

## Key Points to Emphasize

### 1. Messaging Pattern Implementation
- **Decoupling**: Services don't need to know about logging infrastructure
- **Async Communication**: Non-blocking log sending
- **Scalability**: Easy to add more services or consumers

### 2. Scrum Methodology Enforcement
- Logs track role-based operations (Product Owner, Scrum Master, Developer)
- Audit trail for all backlog/sprint operations
- Compliance with Scrum process rules

### 3. Production-Ready Features
- **Correlation IDs**: End-to-end request tracing
- **Persistence**: Logs survive crashes/restarts
- **Query API**: Retrieve logs by date range
- **Auto-Consumer**: Background processing
- **Structured Format**: Easy to parse and analyze

### 4. Microservices Best Practices
- Centralized logging
- Distributed tracing
- Service independence
- Event-driven architecture

---

## Quick Troubleshooting

If test fails:

**No logs in database**:
```bash
# Check if services were rebuilt after logging implementation
docker compose logs identity-service | grep -i "started"
docker compose logs scrum-core-service | grep -i "started"

# If services started before code changes, rebuild:
docker compose build identity-service scrum-core-service
docker compose restart identity-service scrum-core-service
```

**RabbitMQ not accessible**:
```bash
docker compose restart rabbitmq
sleep 10
```

**Logging service not responding**:
```bash
docker compose restart logging-service
sleep 5
curl http://localhost:3002/health
```

---

## Cleanup After Demo

```bash
# Clear all test logs
curl -X DELETE "http://localhost:3002/logs"

# Verify cleanup
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d 2>/dev/null)
curl -s "http://localhost:3002/logs/$TODAY/$TOMORROW" | jq .count
```

---

## Expected Demo Duration

- **Full demonstration**: 5-7 minutes
- **Quick version** (automated test only): 2 minutes
- **Extended** (with RabbitMQ UI): 8-10 minutes

---

## Files Modified for Logging Implementation

### Backend Services:
- `backend/identity-service/src/main/java/com/example/identityservice/controller/AuthController.java`
- `backend/identity-service/src/main/java/com/example/identityservice/controller/ProjectController.java`
- `backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/controller/BacklogController.java`
- `backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/controller/SprintController.java`

### Infrastructure Already Implemented:
- `backend/identity-service/src/main/java/com/example/identityservice/service/RabbitMQLoggerService.java`
- `backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/service/RabbitMQLoggerService.java`
- `backend/identity-service/src/main/java/com/example/identityservice/config/CorrelationIdFilter.java`
- `backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/config/CorrelationIdFilter.java`
- `backend/logging-service/` (entire Node.js service)

---

## SUCCESS CRITERIA

✅ All services running
✅ RabbitMQ exchange and queue configured
✅ Test script shows "ALL TESTS PASSED!"
✅ Logs contain correlation IDs
✅ Multiple services logging to same system
✅ Logs queryable by date range
✅ Logs persist in database
✅ DELETE endpoint clears logs

**This demonstrates complete implementation of the Messaging Pattern for distributed logging in a microservices architecture.**
