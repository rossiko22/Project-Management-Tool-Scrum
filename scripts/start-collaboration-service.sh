#!/bin/bash
cd "$(dirname "$0")/../backend/collaboration-service" || exit
echo "Starting Collaboration Service on port 3000..."
# Load .env.local file
export $(grep -v '^#' .env.local | xargs)
npm run start:dev
