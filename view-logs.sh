#!/bin/bash

# Colors
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

# Check if logs directory exists
if [ ! -d "$LOG_DIR" ]; then
    echo "No logs directory found. Services may not be running."
    exit 1
fi

# If argument provided, view specific log
if [ $# -eq 1 ]; then
    SERVICE=$1
    LOG_FILE="$LOG_DIR/$SERVICE.log"

    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}Viewing logs for $SERVICE...${NC}"
        echo -e "${BLUE}Press Ctrl+C to exit${NC}"
        echo ""
        tail -f "$LOG_FILE"
    else
        echo "Log file not found: $LOG_FILE"
        echo ""
        echo "Available logs:"
        ls -1 "$LOG_DIR"
        exit 1
    fi
else
    # Show all logs
    echo -e "${BLUE}Viewing all service logs...${NC}"
    echo -e "${BLUE}Press Ctrl+C to exit${NC}"
    echo ""
    tail -f "$LOG_DIR"/*.log
fi
