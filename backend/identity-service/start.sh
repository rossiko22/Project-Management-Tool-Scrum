#!/bin/bash

# Optional: make sure the local .env variables are loaded
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Run Spring Boot with devtools enabled and on port 8080
mvn spring-boot:run \
    -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=true" \
    -Dspring-boot.run.arguments="--server.port=8080"
