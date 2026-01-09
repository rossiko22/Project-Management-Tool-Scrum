#!/bin/bash
cd "$(dirname "$0")/../frontend/team-portal" || exit
echo "Starting Team Portal on port 4201..."
npm start -- --port 4201
