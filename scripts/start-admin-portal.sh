#!/bin/bash
cd "$(dirname "$0")/../frontend/admin-portal" || exit
echo "Starting Admin Portal on port 4200..."
npm start
