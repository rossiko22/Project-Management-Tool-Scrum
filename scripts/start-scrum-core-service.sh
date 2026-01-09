#!/bin/bash
cd "$(dirname "$0")/../backend/scrum-core-service" || exit
echo "Starting Scrum Core Service on port 8081..."
export SPRING_PROFILES_ACTIVE=local
# Load .env.local file
set -a
[ -f .env.local ] && . .env.local
set +a
./mvnw spring-boot:run
