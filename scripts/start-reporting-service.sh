#!/bin/bash
cd "$(dirname "$0")/../backend/reporting-service" || exit
echo "Starting Reporting Service on port 3001..."
# Load .env.local file
export $(grep -v '^#' .env.local | xargs)
npm run start:dev
