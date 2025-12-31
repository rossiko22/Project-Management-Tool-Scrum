# Logging System Demo - Quick Reference Card

## BEFORE DEMO (Run once)

```bash
cd /home/unknown/Desktop/Proekt

# 1. Rebuild services
docker compose build identity-service scrum-core-service
docker compose restart identity-service scrum-core-service
sleep 30

# 2. Clear old logs
curl -X DELETE "http://localhost:3002/logs"
```

---

## OPTION 1: Automated Test (Recommended - 2 minutes)

```bash
chmod +x /tmp/test-logging-complete.sh
/tmp/test-logging-complete.sh
```

**Expected**: "ALL TESTS PASSED!" with correlation IDs

---

## OPTION 2: Manual Demo (5 minutes)

### Step 1: Health Check
```bash
curl http://localhost:3002/health
```

### Step 2: Generate Logs
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: demo-001" \
  -d '{"email":"po123@example.com","password":"admin123"}' | jq -r .token)

# Get projects (identity-service)
curl -s http://localhost:8080/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: demo-001" | jq .

# Get backlog (scrum-core-service)
curl -s http://localhost:8081/api/scrum/projects/1/backlog \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: demo-001" | jq .

sleep 3
```

### Step 3: Query Logs
```bash
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d 2>/dev/null)

# Get all logs
curl -s "http://localhost:3002/logs/$TODAY/$TOMORROW" | jq .

# Filter by correlation ID
curl -s "http://localhost:3002/logs/$TODAY/$TOMORROW" | \
  jq -r '.logs[] | select(.correlation_id=="demo-001") |
         "\(.timestamp) \(.log_type) [\(.application_name)] - \(.message)"'
```

---

## KEY TALKING POINTS

1. **Messaging Pattern**: RabbitMQ decouples services from logging infrastructure
2. **Correlation IDs**: Track requests across multiple microservices
3. **Auto-Consumer**: Background process consumes logs in real-time
4. **Persistence**: PostgreSQL stores logs for querying
5. **3 Endpoints**: POST (manual download), GET (query), DELETE (cleanup)

---

## LOG FORMAT

```
timestamp logType url Correlation: ID [service] - message
```

Example:
```
2025-12-31T01:30:00.123Z INFO http://localhost:8080/api/projects Correlation: demo-001 [identity-service] - Retrieved 3 projects
```

---

## ARCHITECTURE DIAGRAM (Verbal)

```
[Services] → RabbitMQ → Logging Service → PostgreSQL
            (Exchange)   (Consumer)        (Storage)
```

---

## TROUBLESHOOTING

**No logs?**
```bash
docker compose restart identity-service scrum-core-service
sleep 30
```

**RabbitMQ issue?**
```bash
docker compose restart rabbitmq
sleep 10
```

---

## CLEANUP

```bash
curl -X DELETE "http://localhost:3002/logs"
```

---

## Time Estimates

- Automated test: **2 minutes**
- Manual demo: **5 minutes**
- With RabbitMQ UI: **7 minutes**
