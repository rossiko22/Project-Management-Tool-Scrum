#!/bin/bash
cd "$(dirname "$0")/../backend/identity-service" || exit
echo "Starting Identity Service on port 8080..."
export SPRING_PROFILES_ACTIVE=local
# Load .env.local file
set -a
[ -f .env.local ] && . .env.local
set +a
./mvnw spring-boot:run
