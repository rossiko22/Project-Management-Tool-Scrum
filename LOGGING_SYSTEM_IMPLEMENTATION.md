# Logging System Implementation - Messaging Pattern

## Overview
This document describes the implementation of the centralized logging system using the Messaging Pattern with RabbitMQ as specified in the assignment.

## Key Modifications Made

### 1. RabbitMQ as Log Repository (Not Auto-Consumer)

**Modified:** `backend/logging-service/src/index.ts`

**What Changed:**
- **REMOVED** automatic consumer startup (`rabbitmqService.startConsumer()`)
- RabbitMQ now acts as a **repository** where logs accumulate in the queue
- Logs are only downloaded when `POST /logs` is explicitly called

**Before:**
```typescript
await rabbitmqService.startConsumer(); // Auto-consumed logs immediately
```

**After:**
```typescript
await connectRabbitMQ(); // Only connects, doesn't consume
console.log('RabbitMQ connected - logs will be stored in queue until manually downloaded');
```

### 2. Three Required Endpoints

All endpoints are implemented in `backend/logging-service/src/controllers/log.controller.ts` and `backend/logging-service/src/routes/log.routes.ts`:

#### a) POST /logs
**Purpose:** Downloads all logs from RabbitMQ queue and stores them in the database

**Implementation:**
- Connects to RabbitMQ message broker
- Retrieves all messages from `logging_queue`
- Parses each message and stores in PostgreSQL database
- Returns count of downloaded logs

**Example:**
```bash
POST http://localhost:3002/logs
```

**Response:**
```json
{
  "message": "Logs downloaded and stored successfully",
  "count": 15
}
```

#### b) GET /logs/{dateFrom}/{dateTo}
**Purpose:** Displays all logs from database between two dates

**Implementation:**
- Queries PostgreSQL database with date range filter
- Returns all logs matching the criteria
- Supports formats: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss`

**Example:**
```bash
GET http://localhost:3002/logs/2026-01-01/2026-01-05
```

**Response:**
```json
{
  "dateFrom": "2026-01-01T00:00:00.000Z",
  "dateTo": "2026-01-05T00:00:00.000Z",
  "count": 15,
  "logs": [...]
}
```

#### c) DELETE /logs
**Purpose:** Deletes all stored logs from the database

**Implementation:**
- Removes all log entries from PostgreSQL
- Returns count of deleted logs

**Example:**
```bash
DELETE http://localhost:3002/logs
```

**Response:**
```json
{
  "message": "All logs deleted successfully",
  "count": 15
}
```

## RabbitMQ Configuration

### Exchange and Queue Setup
**Location:** `backend/logging-service/src/config/rabbitmq.ts`

```typescript
const exchange = 'logging_exchange'; // Own exchange
const queue = 'logging_queue';       // Own logging queue
const routingKey = 'logs';

// Exchange type: topic (allows flexible routing)
await channel.assertExchange(exchange, 'topic', { durable: true });

// Queue is durable (survives RabbitMQ restart)
await channel.assertQueue(queue, { durable: true });

// Bind queue to exchange
await channel.bindQueue(queue, exchange, routingKey);
```

### Shared Docker Compose
RabbitMQ is part of the shared `docker-compose.yml`:

```yaml
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  container_name: rabbitmq
  ports:
    - "5672:5672"   # AMQP protocol port
    - "15672:15672" # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin
```

## Log Structure and Format

### Log Format (as per requirements)
```
<timestamp> <LogType> <URL> Correlation: <CorrelationId> [<ApplicationName>] - <Message>
```

### Example Log:
```
2026-01-05 16:26:04.797 INFO http://localhost:8080/users Correlation: 550e8400-e29b-41d4-a716-446655440000 [identity-service] - User authenticated successfully
```

### Log Message Structure (JSON in RabbitMQ)
```json
{
  "timestamp": "2026-01-05T16:26:04.797Z",
  "logType": "INFO",
  "url": "http://localhost:8080/users",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "applicationName": "identity-service",
  "message": "User authenticated successfully"
}
```

### Database Schema
**Table:** `logs`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| timestamp | TIMESTAMP | Log timestamp |
| log_type | VARCHAR(10) | INFO/WARN/ERROR/DEBUG |
| url | VARCHAR(500) | Request URL |
| correlation_id | VARCHAR(100) | Correlation ID for tracing |
| application_name | VARCHAR(100) | Source microservice |
| message | TEXT | Log message |
| created_at | TIMESTAMP | Database insert time |

## Correlation ID Implementation

### 1. Identity Service (Java/Spring Boot)
**Location:** `backend/identity-service/src/main/java/com/example/identityservice/config/CorrelationIdFilter.java`

```java
// Generates or extracts correlation ID from request header
String correlationId = request.getHeader(CORRELATION_ID_HEADER);
if (correlationId == null || correlationId.isEmpty()) {
    correlationId = UUID.randomUUID().toString();
}
CorrelationIdFilter.setCorrelationId(correlationId);
```

**Usage in logging:**
```java
String correlationId = CorrelationIdFilter.getCurrentCorrelationId();
logger.logInfo("User authenticated successfully", url);
// Includes correlation ID automatically
```

### 2. Scrum Core Service (Java/Spring Boot)
Same implementation as Identity Service.

### 3. Collaboration Service (Node.js/NestJS)
**Location:** `backend/collaboration-service/src/middleware/correlation-id.middleware.ts`

```typescript
// Generates or extracts correlation ID
const correlationId = req.headers['x-correlation-id'] || uuidv4();
setCorrelationId(correlationId);
```

### 4. Reporting Service (Node.js/NestJS)
Same implementation as Collaboration Service.

## How Each Microservice Logs

### Java Services (Identity, Scrum Core)
**Location:** `RabbitMQLoggerService.java`

```java
@Service
public class RabbitMQLoggerService {

    public void logInfo(String message, String url) {
        sendLog("INFO", message, url);
    }

    private void sendLog(String logType, String message, String url) {
        String correlationId = CorrelationIdFilter.getCurrentCorrelationId();

        Map<String, Object> logMessage = new HashMap<>();
        logMessage.put("timestamp", Instant.now().toString());
        logMessage.put("logType", logType);
        logMessage.put("url", url);
        logMessage.put("correlationId", correlationId);
        logMessage.put("applicationName", APPLICATION_NAME);
        logMessage.put("message", message);

        rabbitTemplate.convertAndSend(
            RabbitMQConfig.LOGGING_EXCHANGE,
            RabbitMQConfig.LOGGING_ROUTING_KEY,
            logMessage
        );
    }
}
```

### Node.js Services (Collaboration, Reporting)
**Location:** `src/utils/rabbitmq-logger.ts`

```typescript
private async sendLog(logType: string, message: string, url?: string) {
  const correlationId = getCorrelationId();

  const logMessage = {
    timestamp: new Date().toISOString(),
    logType,
    url: url || '',
    correlationId,
    applicationName: this.applicationName,
    message,
  };

  this.channel.publish(
    this.exchange,
    this.routingKey,
    Buffer.from(JSON.stringify(logMessage)),
    { persistent: true }
  );
}
```

## Testing the System

### Run the Test Script
```bash
./test-logging-system.sh
```

### Manual Testing

1. **Check queue status:**
```bash
curl -u admin:admin http://localhost:15672/api/queues/%2F/logging_queue
```

2. **Generate logs by making API calls:**
```bash
curl -X POST http://localhost:8080/auth/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"email":"sm123@example.com","password":"admin123"}'
```

3. **Download logs from queue to database:**
```bash
curl -X POST http://localhost:3002/logs
```

4. **Get logs by date range:**
```bash
curl http://localhost:3002/logs/2026-01-01/2026-01-05
```

5. **Delete all logs:**
```bash
curl -X DELETE http://localhost:3002/logs
```

## Good Practices Implemented

### ✅ 1. Correlation ID
- Generated at entry point of each request
- Propagated through all microservice calls
- Stored with each log entry
- Enables end-to-end request tracing

### ✅ 2. Proper Log Structure
- Consistent format across all services
- Includes all required fields: timestamp, logType, URL, correlationId, applicationName, message
- Human-readable when formatted
- Machine-parseable (JSON in queue)

### ✅ 3. Recording Appropriate Data
- **INFO**: Successful operations (authentication, data retrieval)
- **WARN**: Access denied, invalid requests
- **ERROR**: Failed operations, exceptions
- **DEBUG**: Detailed information for troubleshooting

### ✅ 4. Messaging Pattern
- RabbitMQ acts as a **repository** (not just a queue)
- Logs persist in queue until explicitly downloaded
- Decouples log generation from log storage
- Survives service restarts (durable queue)

### ✅ 5. Microservice Architecture
- Each service has its own logger instance
- Logs identify source service (applicationName)
- Centralized storage in logging-service
- Independent of other services

## Architecture Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Identity Service│      │ Scrum Core Svc  │      │ Collab Service  │
│                 │      │                 │      │                 │
│  RabbitMQ       │      │  RabbitMQ       │      │  RabbitMQ       │
│  Logger         │      │  Logger         │      │  Logger         │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │    Publish logs        │                        │
         └────────────┬───────────┴────────────────────────┘
                      ▼
         ┌────────────────────────────┐
         │      RabbitMQ Broker       │
         │  ┌──────────────────────┐  │
         │  │  logging_exchange    │  │
         │  │  (topic)             │  │
         │  └──────────┬───────────┘  │
         │             │              │
         │  ┌──────────▼───────────┐  │
         │  │  logging_queue       │  │
         │  │  (durable)           │  │
         │  │  [Logs accumulate]   │  │
         │  └──────────────────────┘  │
         └────────────┬───────────────┘
                      │
                      │ POST /logs (manual download)
                      ▼
         ┌────────────────────────────┐
         │    Logging Service         │
         │                            │
         │  POST   /logs              │◄── Download from queue
         │  GET    /logs/{from}/{to}  │◄── Query database
         │  DELETE /logs              │◄── Clear database
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │    PostgreSQL Database     │
         │    (logs table)            │
         └────────────────────────────┘
```

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `logging-service/src/index.ts` | Removed auto-consumer | RabbitMQ as repository |
| `logging-service/src/controllers/log.controller.ts` | Updated health check | Reflect repository mode |
| `logging-service/src/services/rabbitmq.service.ts` | Kept consumeAllLogs() | For POST /logs endpoint |
| All microservices | RabbitMQLogger implemented | Send logs to RabbitMQ |
| All microservices | Correlation ID middleware | Request tracing |

## Verification

### ✅ Requirements Met:

1. ✅ **RabbitMQ as repository** - Logs accumulate in queue
2. ✅ **Own RabbitMQ instance** - Shared in docker-compose.yml
3. ✅ **Own Exchange** - logging_exchange (topic)
4. ✅ **Own logging queue** - logging_queue (durable)
5. ✅ **Correlation ID** - Tracked across all services
6. ✅ **Proper log structure** - Timestamp, LogType, URL, CorrelationId, ApplicationName, Message
7. ✅ **Appropriate data** - INFO/WARN/ERROR/DEBUG with context
8. ✅ **POST /logs** - Downloads from queue to database
9. ✅ **GET /logs/{from}/{to}** - Retrieves by date range
10. ✅ **DELETE /logs** - Clears database

## Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | http://localhost:3002/logs | Download logs from RabbitMQ to database |
| GET | http://localhost:3002/logs/{dateFrom}/{dateTo} | Get logs by date range |
| DELETE | http://localhost:3002/logs | Delete all logs from database |
| GET | http://localhost:3002/health | Check service health |
| GET | http://localhost:3002/api-docs | Swagger documentation |

## RabbitMQ Management

- **Management UI**: http://localhost:15672
- **Username**: admin
- **Password**: admin
- **Queue**: logging_queue
- **Exchange**: logging_exchange

---

**Implementation Complete** ✅
