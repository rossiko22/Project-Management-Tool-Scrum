#!/bin/sh
set -e

echo "========================================"
echo "Reporting Service - Starting Migration"
echo "========================================"

# Wait for PostgreSQL to be ready
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Check if migrations have been applied
MIGRATION_TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sprint_metrics')")

if [ "$MIGRATION_TABLE_EXISTS" = "f" ]; then
  echo "Running initial migrations..."
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/database/migrations/001_initial_schema.sql
  echo "✓ Migrations completed successfully!"
else
  echo "✓ Database already initialized, skipping migrations."
fi

echo "========================================"
echo "Starting Reporting Service Application"
echo "========================================"

# Start the application
exec node dist/main
