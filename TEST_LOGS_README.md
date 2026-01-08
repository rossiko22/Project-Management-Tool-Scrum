# Logging System Test Documentation

## Overview

The `test-logs.sh` script provides comprehensive testing for the logging system implementation that uses RabbitMQ messaging pattern. This validates all requirements from the assignment.

## Requirements Validated

### 1. RabbitMQ Message Broker
- Custom Exchange: `logging_exchange`
- Custom Queue: `logging_queue`
- Routing Key: `logs`
- RabbitMQ runs in Docker Compose on ports:
  - AMQP: `5672`
  - Management UI: `15672` (credentials: admin/admin)

### 2. Logging Implementation
Each microservice implements:
- **Correlation ID Tracking**: Propagates `X-Correlation-ID` header across service calls
- **Structured Logs**: JSON format with all required fields
- **Log Levels**: INFO, WARN, ERROR, DEBUG
- **RabbitMQ Integration**: Sends logs to message broker

### 3. Log Format

**Required Format:**
```
<timestamp> <LogType> <URL> Correlation: <ID> [<service>] - <message>
```

**Example:**
```
2025-12-31T01:30:00.123Z INFO http://localhost:8080/api/projects Correlation: demo-001 [identity-service] - Retrieved 3 projects
```

**Log Structure (JSON in RabbitMQ):**
```json
{
  "timestamp": "2025-12-31T01:30:00.123Z",
  "logType": "INFO",
  "url": "http://localhost:8080/api/projects",
  "correlationId": "demo-001",
  "applicationName": "identity-service",
  "message": "Retrieved 3 projects"
}
```

### 4. Logging Service (Port 3002)

The logging service provides 3 required endpoints:

#### POST /logs
- **Purpose**: Downloads all logs from RabbitMQ queue and saves to PostgreSQL
- **Returns**: Count of logs downloaded
- **Example**:
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

#### GET /logs/{dateFrom}/{dateTo}
- **Purpose**: Retrieves logs between two dates from database
- **Date Format**: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss`
- **Returns**: Array of logs with metadata
- **Example**:
```bash
curl http://localhost:3002/logs/2025-01-01/2025-01-02
```

**Response:**
```json
{
  "dateFrom": "2025-01-01T00:00:00.000Z",
  "dateTo": "2025-01-02T00:00:00.000Z",
  "count": 15,
  "logs": [
    {
      "id": 1,
      "timestamp": "2025-01-01T12:30:00.000Z",
      "log_type": "INFO",
      "url": "http://localhost:8080/api/projects",
      "correlation_id": "demo-001",
      "application_name": "identity-service",
      "message": "Retrieved 3 projects"
    }
  ]
}
```

#### DELETE /logs
- **Purpose**: Deletes all logs from database
- **Returns**: Count of deleted logs
- **Example**:
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

## Running the Test

### Prerequisites

1. All services must be running:
```bash
docker compose up -d
```

2. Wait for services to be healthy (30-60 seconds):
```bash
docker compose ps
```

### Execute Test

```bash
chmod +x test-logs.sh
./test-logs.sh
```

### Test Steps

The script performs 8 comprehensive tests:

1. **Health Check**: Validates logging service is operational
2. **Cleanup**: Deletes old logs from previous tests
3. **Log Generation**: Creates test logs with correlation ID
   - Authenticates user
   - Makes requests to identity-service (GET /api/projects, /api/teams)
   - Makes requests to scrum-core-service (GET /api/scrum/projects/1/backlog, /api/scrum/projects/1/sprints)
4. **POST Test**: Downloads logs from RabbitMQ to database
5. **GET Test**: Retrieves logs by date range
6. **Format Validation**: Verifies log structure
7. **Correlation ID Validation**: Confirms cross-service tracking
8. **DELETE Test**: Cleans up test logs (optional, requires confirmation)

### Expected Output

```
==============================================
  LOGGING SYSTEM COMPREHENSIVE TEST
==============================================

Test Correlation ID: test-1735689600

[1/8] Health Check
✓ Logging service is healthy

[2/8] Cleaning Previous Logs
✓ Deleted 0 old logs

[3/8] Generating Test Logs
✓ Authentication successful
✓ GET /api/projects
✓ GET /api/teams
✓ GET /api/scrum/projects/1/backlog
✓ GET /api/scrum/projects/1/sprints

[4/8] Testing POST /logs (Download from RabbitMQ)
✓ Downloaded 8 logs from RabbitMQ

[5/8] Testing GET /logs/{dateFrom}/{dateTo}
✓ Retrieved 8 logs

[6/8] Validating Log Format
✓ Timestamp present
✓ Valid log type: INFO
✓ Application name present: identity-service
✓ Message present

[7/8] Validating Correlation ID Tracking
✓ Found 8 logs with correlation ID test-1735689600
✓ Correlation ID successfully tracked across 2 microservices

[8/8] Testing DELETE /logs
✓ Deleted 8 logs

==============================================
  ALL TESTS PASSED!
==============================================
```

## Architecture

```
┌─────────────────┐
│ identity-service│───┐
│  (port 8080)    │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │   ┌──────────────┐   ┌──────────────────┐   ┌────────────┐
│scrum-core-service│───┼──→│   RabbitMQ   │──→│ logging-service  │──→│ PostgreSQL │
│  (port 8081)    │   │   │  (Exchange)  │   │  (Consumer)      │   │  (Storage) │
└─────────────────┘   │   └──────────────┘   └──────────────────┘   └────────────┘
                      │         ↑                   ↓
┌─────────────────┐   │         │              Port 3002
│ Other Services  │───┘         │              Endpoints:
└─────────────────┘             │              - POST /logs
                                │              - GET /logs/{from}/{to}
                           Port 5672           - DELETE /logs
                           Port 15672 (UI)
```

## Implementation Details

### Services with Logging

1. **identity-service** (Java/Spring Boot)
   - Application name: `identity-service`
   - Controllers: AuthController, ProjectController
   - Logger: RabbitMQLoggerService

2. **scrum-core-service** (Java/Spring Boot)
   - Application name: `scrum-core-service`
   - Controllers: BacklogController, SprintController
   - Logger: RabbitMQLoggerService

3. **logging-service** (Node.js/TypeScript)
   - Port: 3002
   - Database: PostgreSQL (logging-db)
   - Auto-consumer: Runs in background consuming logs continuously

### Correlation ID Flow

```
User Request
    ↓ (X-Correlation-ID: test-123)
Identity Service
    ↓ Logs to RabbitMQ with correlation ID
    ↓ Forwards request to Scrum Service
Scrum Service
    ↓ Logs to RabbitMQ with same correlation ID
    ↓
RabbitMQ Queue
    ↓
Logging Service Consumer
    ↓
PostgreSQL Database
```

## Troubleshooting

### No logs in database

**Cause**: Auto-consumer is consuming logs in real-time

**Solution**: This is expected behavior. The logging service has an automatic consumer that processes logs from RabbitMQ continuously. Use the GET endpoint to retrieve logs from the database.

### RabbitMQ connection errors

**Check RabbitMQ status:**
```bash
docker compose restart rabbitmq
sleep 10
docker compose logs rabbitmq
```

**Access RabbitMQ Management UI:**
- URL: http://localhost:15672
- Username: admin
- Password: admin

### Services not logging

**Restart services:**
```bash
docker compose restart identity-service scrum-core-service
sleep 30
```

**Check service logs:**
```bash
docker compose logs identity-service | grep -i rabbitmq
docker compose logs scrum-core-service | grep -i rabbitmq
```

### Database connection issues

**Check logging-db status:**
```bash
docker compose ps logging-db
docker compose logs logging-db
```

## Good Practices Demonstrated

1. **Correlation ID Usage**
   - Unique ID per request
   - Propagated across all microservices
   - Enables distributed tracing

2. **Structured Logging**
   - Consistent JSON format
   - All required fields present
   - Machine-readable format

3. **Appropriate Data Logging**
   - User actions (authentication, data access)
   - Resource operations (create, read, update)
   - Access control decisions (authorization)
   - Performance metrics (counts, timing)

4. **Messaging Pattern Benefits**
   - Decouples services from logging infrastructure
   - Asynchronous processing (non-blocking)
   - Reliable delivery with RabbitMQ
   - Scalable architecture

## Additional Testing

### Manual Log Inspection

Query logs by correlation ID:
```bash
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)

curl "http://localhost:3002/logs/$TODAY/$TOMORROW" | \
  jq -r '.logs[] | select(.correlation_id=="your-id") |
         "\(.timestamp) \(.log_type) [\(.application_name)] - \(.message)"'
```

### Generate Custom Test Logs

```bash
# Set custom correlation ID
CORRELATION_ID="manual-test-$(date +%s)"

# Authenticate
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: ${CORRELATION_ID}" \
  -d '{"email":"po123@example.com","password":"admin123"}' | jq -r .token)

# Make requests with correlation ID
curl -s http://localhost:8080/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: ${CORRELATION_ID}" | jq .

# Wait and retrieve logs
sleep 5
curl "http://localhost:3002/logs/$(date +%Y-%m-%d)/$(date -d "+1 day" +%Y-%m-%d)" | \
  jq --arg cid "$CORRELATION_ID" '.logs[] | select(.correlation_id==$cid)'
```

### Performance Testing

Generate multiple concurrent requests:
```bash
for i in {1..10}; do
  CORRELATION_ID="perf-test-$i"
  curl -s -X POST http://localhost:8080/api/auth/authenticate \
    -H "Content-Type: application/json" \
    -H "X-Correlation-ID: ${CORRELATION_ID}" \
    -d '{"email":"po123@example.com","password":"admin123"}' &
done
wait

sleep 5
curl "http://localhost:3002/logs/$(date +%Y-%m-%d)/$(date -d "+1 day" +%Y-%m-%d)" | \
  jq '.count'
```

## Files Modified/Created

### New Files
- `backend/logging-service/` - Complete logging service
- `test-logs.sh` - Comprehensive test script
- `TEST_LOGS_README.md` - This documentation

### Modified Files
- `backend/identity-service/src/main/java/com/example/identityservice/`
  - `config/RabbitMQConfig.java` - RabbitMQ configuration
  - `config/CorrelationIdFilter.java` - Correlation ID filter
  - `service/RabbitMQLoggerService.java` - Logger service
  - `controller/AuthController.java` - Added logging
  - `controller/ProjectController.java` - Added logging

- `backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/`
  - `config/RabbitMQConfig.java` - RabbitMQ configuration
  - `config/CorrelationIdFilter.java` - Correlation ID filter
  - `service/RabbitMQLoggerService.java` - Logger service
  - `controller/BacklogController.java` - Added logging
  - `controller/SprintController.java` - Added logging

- `docker-compose.yml` - Added RabbitMQ and logging-service

## Submission Checklist

- [x] RabbitMQ instance in Docker Compose
- [x] Custom Exchange and Queue created
- [x] All microservices send logs to RabbitMQ
- [x] Correlation ID implementation and propagation
- [x] Proper log structure with all required fields
- [x] Logging service with 3 endpoints:
  - [x] POST /logs - Download from RabbitMQ
  - [x] GET /logs/{dateFrom}/{dateTo} - Query by date
  - [x] DELETE /logs - Delete all logs
- [x] Auto-consumer for real-time log processing
- [x] PostgreSQL database for log persistence
- [x] Comprehensive test script
- [x] Documentation

## References

- RabbitMQ Documentation: https://www.rabbitmq.com/documentation.html
- Spring AMQP: https://spring.io/projects/spring-amqp
- Correlation ID Pattern: https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html
