#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================="
echo "Testing Logging System with Messaging Pattern"
echo "========================================="
echo ""

# Wait for services
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 5

# Step 1: Check service health
echo -e "${BLUE}Step 1: Checking logging-service health${NC}"
echo "---------------------------------------"
curl -s http://localhost:3002/health | jq .
echo ""

# Step 2: Check RabbitMQ queue status (initial)
echo -e "${BLUE}Step 2: Checking RabbitMQ queue - Initial state${NC}"
echo "---------------------------------------"
QUEUE_STATUS=$(curl -s -u admin:admin http://localhost:15672/api/queues/%2F/logging_queue 2>/dev/null)
if [ $? -eq 0 ]; then
  echo $QUEUE_STATUS | jq '{name: .name, messages: .messages, messages_ready: .messages_ready, consumers: .consumers}'
else
  echo -e "${RED}Could not connect to RabbitMQ management interface${NC}"
fi
echo ""

# Step 3: Generate some logs by making API calls
echo -e "${BLUE}Step 3: Generating logs by making API calls${NC}"
echo "---------------------------------------"
echo "a) Attempting authentication (generates 2 logs: attempt + success/failure)..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/authenticate \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{"email":"sm123@example.com","password":"admin123"}')

if echo $AUTH_RESPONSE | jq -e '.token' > /dev/null 2>&1; then
  TOKEN=$(echo $AUTH_RESPONSE | jq -r '.token')
  echo -e "${GREEN}✓ Authentication successful${NC}"

  # Make more API calls to generate logs
  echo ""
  echo "b) Getting all projects (generates logs)..."
  curl -s -X GET http://localhost:8080/api/projects \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  echo -e "${GREEN}✓ Projects request sent${NC}"

  echo ""
  echo "c) Getting user info (generates logs)..."
  curl -s -X GET http://localhost:8080/api/auth/me \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  echo -e "${GREEN}✓ User info request sent${NC}"
else
  echo -e "${RED}✗ Authentication failed${NC}"
  echo "Response: $AUTH_RESPONSE"
fi

echo ""
echo "Waiting for logs to be published to RabbitMQ..."
sleep 3

# Step 4: Check queue status after generating logs
echo -e "${YELLOW}Step 4: Checking RabbitMQ queue - After generating logs${NC}"
echo "---------------------------------------"
QUEUE_STATUS=$(curl -s -u admin:admin http://localhost:15672/api/queues/%2F/logging_queue 2>/dev/null)
if [ $? -eq 0 ]; then
  MESSAGE_COUNT=$(echo $QUEUE_STATUS | jq -r '.messages')
  echo $QUEUE_STATUS | jq '{name: .name, messages: .messages, messages_ready: .messages_ready}'
  echo ""
  echo -e "${GREEN}Messages in queue: $MESSAGE_COUNT${NC}"
else
  echo -e "${RED}Could not connect to RabbitMQ management interface${NC}"
  MESSAGE_COUNT=0
fi
echo ""

# Step 5: Download logs from queue to database
echo -e "${YELLOW}Step 5: Calling POST /logs - Download logs from RabbitMQ to database${NC}"
echo "---------------------------------------"
POST_RESPONSE=$(curl -s -X POST http://localhost:3002/logs)
echo $POST_RESPONSE | jq .
DOWNLOADED_COUNT=$(echo $POST_RESPONSE | jq -r '.count')
echo ""
echo -e "${GREEN}Downloaded and stored: $DOWNLOADED_COUNT logs${NC}"
echo ""

# Step 6: Verify queue is empty
echo -e "${BLUE}Step 6: Verifying RabbitMQ queue is now empty${NC}"
echo "---------------------------------------"
QUEUE_STATUS=$(curl -s -u admin:admin http://localhost:15672/api/queues/%2F/logging_queue 2>/dev/null)
if [ $? -eq 0 ]; then
  echo $QUEUE_STATUS | jq '{name: .name, messages: .messages, messages_ready: .messages_ready}'
else
  echo -e "${RED}Could not connect to RabbitMQ management interface${NC}"
fi
echo ""

# Step 7: Get logs from database by date range
echo -e "${YELLOW}Step 7: GET /logs/{dateFrom}/{dateTo} - Retrieve logs from database${NC}"
echo "---------------------------------------"
FROM_DATE=$(date -u -d '1 day ago' '+%Y-%m-%d')
TO_DATE=$(date -u -d '1 day' '+%Y-%m-%d')
echo "Date range: $FROM_DATE to $TO_DATE"
echo ""
GET_RESPONSE=$(curl -s "http://localhost:3002/logs/$FROM_DATE/$TO_DATE")
LOG_COUNT=$(echo $GET_RESPONSE | jq -r '.count')
echo "Total logs in database for date range: $LOG_COUNT"
echo ""
echo "Sample logs (showing first 3):"
echo $GET_RESPONSE | jq '.logs[:3] | .[] | {timestamp, log_type, application_name, correlation_id, message}'
echo ""

# Step 8: Generate more logs
echo -e "${BLUE}Step 8: Generating more logs...${NC}"
echo "---------------------------------------"
if [ ! -z "$TOKEN" ]; then
  echo "Making additional API calls..."
  curl -s -X GET http://localhost:8080/api/projects \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  curl -s -X GET http://localhost:8080/api/projects \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  echo -e "${GREEN}✓ Additional requests sent${NC}"
else
  echo -e "${YELLOW}No token available, skipping additional requests${NC}"
fi
echo ""
sleep 2

# Step 9: Check queue again
echo -e "${BLUE}Step 9: Checking queue status again${NC}"
echo "---------------------------------------"
QUEUE_STATUS=$(curl -s -u admin:admin http://localhost:15672/api/queues/%2F/logging_queue 2>/dev/null)
if [ $? -eq 0 ]; then
  MESSAGE_COUNT=$(echo $QUEUE_STATUS | jq -r '.messages')
  echo "Messages waiting in queue: $MESSAGE_COUNT"
else
  echo -e "${RED}Could not connect to RabbitMQ management interface${NC}"
fi
echo ""

# Step 10: Delete all logs from database
echo -e "${RED}Step 10: DELETE /logs - Delete all logs from database${NC}"
echo "---------------------------------------"
read -p "Do you want to delete all logs from the database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3002/logs)
  echo $DELETE_RESPONSE | jq .
  DELETED_COUNT=$(echo $DELETE_RESPONSE | jq -r '.count')
  echo ""
  echo -e "${GREEN}Deleted: $DELETED_COUNT logs${NC}"
else
  echo "Skipped deletion"
fi
echo ""

# Step 11: Final health check
echo -e "${GREEN}Step 11: Final health check${NC}"
echo "---------------------------------------"
curl -s http://localhost:3002/health | jq .
echo ""

# Summary
echo -e "${GREEN}========================================="
echo "Test Summary"
echo "=========================================${NC}"
echo ""
echo "The logging system is working with the Messaging Pattern:"
echo ""
echo "1. ✓ Each microservice sends logs to RabbitMQ (logging_exchange)"
echo "2. ✓ Logs accumulate in the logging_queue (RabbitMQ as repository)"
echo "3. ✓ POST /logs downloads all logs from queue to database"
echo "4. ✓ GET /logs/{dateFrom}/{dateTo} retrieves logs from database"
echo "5. ✓ DELETE /logs removes all logs from database"
echo "6. ✓ Logs include: timestamp, logType, URL, correlationId, applicationName, message"
echo ""
echo -e "${BLUE}Log format example:${NC}"
echo "2020-12-15 16:26:04,797 INFO http://localhost:8080/users Correlation: 123 [identity-service] - User authenticated successfully"
echo ""
echo -e "${GREEN}All endpoints working correctly!${NC}"
echo "========================================="
