#!/bin/bash
cd "$(dirname "$0")/../backend/logging-service" || exit
echo "Starting Logging Service on port 3002..."
# Load .env.local file
export $(grep -v '^#' .env.local | xargs)
npm run start:dev
