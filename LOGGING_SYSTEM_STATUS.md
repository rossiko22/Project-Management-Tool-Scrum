# Logging System - Current Status and Testing Guide

## ✅ What's Already Implemented

### 1. RabbitMQ Infrastructure
- **Exchange**: `logging_exchange` (topic)
- **Queue**: `logging_queue` (durable)
- **Routing Key**: `logs`
- **Status**: ✅ Running and configured correctly

### 2. Logging Service (Node.js/TypeScript)
**Location**: `/backend/logging-service`
**Port**: 3002
**Status**: ✅ Running

**Endpoints**:
- `GET /health` - Health check
- `POST /logs` - Download logs from RabbitMQ (not needed - automatic consumer handles this)
- `GET /logs/:dateFrom/:dateTo` - Get logs by date range
- `DELETE /logs` - Delete all logs from database

**Features**:
- ✅ Automatic background consumer (consumes messages in real-time)
- ✅ Database integration (PostgreSQL)
- ✅ Proper log structure parsing

### 3. RabbitMQ Logger Service (Java)
**Locations**:
- `/backend/identity-service/src/main/java/com/example/identityservice/service/RabbitMQLoggerService.java`
- `/backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/service/RabbitMQLoggerService.java`

**Status**: ✅ Implemented but **NOT BEING USED**

**Methods**:
```java
public void logInfo(String message, String url)
public void logWarn(String message, String url)
public void logError(String message, String url)
public void logDebug(String message, String url)
```

### 4. Correlation ID Filter
**Locations**:
- `/backend/identity-service/src/main/java/com/example/identityservice/config/CorrelationIdFilter.java`
- `/backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/config/CorrelationIdFilter.java`

**Status**: ✅ Implemented and active
- Extracts `X-Correlation-ID` from request headers
- Generates UUID if not present
- Makes correlation ID available via `CorrelationIdFilter.getCurrentCorrelationId()`

## ❌ What's Missing

### Controllers Don't Use Logging Service

The controllers in `identity-service` and `scrum-core-service` need to be updated to call `RabbitMQLoggerService`.

**Example - What needs to be added**:

```java
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final RabbitMQLoggerService logger;  // ← ADD THIS

    @GetMapping
    public ResponseEntity<List<ProjectDto>> getAllProjects(
            HttpServletRequest request) {

        String url = request.getRequestURI();

        // ← ADD THIS
        logger.logInfo("Getting all projects", url);

        List<ProjectDto> projects = projectService.getAllProjects();

        // ← ADD THIS
        logger.logInfo("Retrieved " + projects.size() + " projects", url);

        return ResponseEntity.ok(projects);
    }

    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            @RequestBody CreateProjectRequest request,
            HttpServletRequest httpRequest) {

        String url = httpRequest.getRequestURI();

        try {
            // ← ADD THIS
            logger.logInfo("Creating new project: " + request.getName(), url);

            Project project = projectService.createProject(request);

            // ← ADD THIS
            logger.logInfo("Project created successfully: " + project.getId(), url);

            return ResponseEntity.ok(ProjectDto.fromEntity(project));
        } catch (Exception e) {
            // ← ADD THIS
            logger.logError("Failed to create project: " + e.getMessage(), url);
            throw e;
        }
    }
}
```

## 🧪 How to Test the Logging System

### Test 1: Verify Infrastructure

```bash
# Check services are running
docker compose ps | grep -E "(logging|rabbitmq)"

# Check RabbitMQ exchange and queue
docker compose exec rabbitmq rabbitmqctl list_exchanges | grep logging
docker compose exec rabbitmq rabbitmqctl list_queues | grep logging

# Check logging service health
curl http://localhost:3002/health
```

### Test 2: Add Logging to One Controller (Quick Test)

1. Edit a controller (e.g., `BacklogController.java`)
2. Add logging calls as shown above
3. Rebuild and restart the service:
```bash
docker compose build scrum-core-service
docker compose restart scrum-core-service
```

### Test 3: Generate Logs

```bash
# Authenticate
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"po123@example.com","password":"admin123"}' | jq -r .token)

# Make API calls with correlation IDs
curl -s http://localhost:8081/api/scrum/projects/1/backlog \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: test-001"

curl -s http://localhost:8081/api/scrum/sprints/project/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: test-002"
```

### Test 4: Check Logs Were Saved

```bash
# Check database directly
docker exec -i logging-db psql -U postgres -d logging_db \
  -c "SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10;"

# Or use the API
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
curl -s "http://localhost:3002/logs/$TODAY/$TOMORROW" | jq .
```

### Test 5: Verify Correlation IDs

```bash
# Check logs have correlation IDs
curl -s "http://localhost:3002/logs/$TODAY/$TOMORROW" | jq '.logs[] | {correlation_id, message}'
```

### Test 6: Test DELETE Endpoint

```bash
# Delete all logs
curl -s -X DELETE "http://localhost:3002/logs" | jq .

# Verify deletion
curl -s "http://localhost:3002/logs/$TODAY/$TOMORROW" | jq .
```

## 📋 Expected Log Format

When properly implemented, logs should look like this:

**In RabbitMQ/Database**:
```json
{
  "timestamp": "2025-12-31T01:30:00.123Z",
  "logType": "INFO",
  "url": "http://localhost:8081/api/scrum/projects/1/backlog",
  "correlationId": "test-001",
  "applicationName": "scrum-core-service",
  "message": "Retrieved 5 backlog items for project 1"
}
```

**As log line (readable format)**:
```
2025-12-31 01:30:00,123 INFO http://localhost:8081/api/scrum/projects/1/backlog Correlation: test-001 [scrum-core-service] - Retrieved 5 backlog items for project 1
```

## 🎯 Implementation Priority

1. **High Priority**: Add logging to main CRUD operations (GET, POST, PUT, DELETE)
2. **Medium Priority**: Add error logging in catch blocks
3. **Low Priority**: Add debug logging for detailed tracing

## 📝 Best Practices

1. **Use appropriate log levels**:
   - `INFO`: Normal operations (user logged in, item created)
   - `WARN`: Recoverable issues (deprecated API used, slow query)
   - `ERROR`: Failures that need attention (authentication failed, database error)
   - `DEBUG`: Detailed tracing (only for development)

2. **Include context in messages**:
   - ✅ Good: `"Creating backlog item for project 1: Bug fix for login"`
   - ❌ Bad: `"Creating item"`

3. **Log at service boundaries**:
   - API entry points (controllers)
   - External service calls
   - Database operations (if needed)

4. **Always pass the request URL**:
   ```java
   String url = request.getRequestURI();
   logger.logInfo("message", url);
   ```

## 🔧 Quick Fix Script

Save this as `/tmp/add-logging-to-controller.sh`:

```bash
#!/bin/bash

# This is a template - you'll need to manually edit controllers
# But this shows the pattern for one controller

cat << 'EOF'
To add logging to a controller:

1. Add the dependency:
   private final RabbitMQLoggerService logger;

2. In the constructor, add the parameter (with @RequiredArgsConstructor it's automatic)

3. Add logging calls:
   String url = request.getRequestURI();
   logger.logInfo("Your message here", url);
   logger.logError("Error: " + e.getMessage(), url);

4. Rebuild:
   docker compose build <service-name>
   docker compose restart <service-name>

5. Test:
   Make API calls and check logs appear in database
EOF
```

## ✅ Verification Checklist

- [ ] RabbitMQ is running and accessible
- [ ] Logging service is running on port 3002
- [ ] Correlation ID filter is active in Java services
- [ ] RabbitMQLoggerService is injected in controllers
- [ ] Controllers call logger methods (logInfo, logError, etc.)
- [ ] Services are rebuilt and restarted after changes
- [ ] API calls generate logs in database
- [ ] Correlation IDs are present in logs
- [ ] GET /logs/:from/:to returns logs
- [ ] DELETE /logs clears database

## 🐛 Troubleshooting

**No logs in database**:
- Controllers not calling logger service
- RabbitMQ connection failed (check service logs)
- Consumer not running (check logging-service logs)

**No correlation IDs**:
- Correlation ID filter not registered
- Service not rebuilt after adding filter

**Can't delete logs**:
- Check database connection
- Verify logging-service has permissions

**RabbitMQ queue always empty**:
- This is NORMAL - background consumer processes messages immediately
- Check database instead of queue for logs
