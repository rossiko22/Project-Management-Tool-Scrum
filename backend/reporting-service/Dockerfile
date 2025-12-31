# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install PostgreSQL client for running migrations
RUN apk update && apk add --no-cache postgresql16-client

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy migration files
COPY database/migrations ./database/migrations

# Copy and set executable permission for entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 3001

# Use entrypoint script to run migrations and start the app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
