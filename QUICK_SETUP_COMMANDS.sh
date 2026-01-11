#!/bin/bash
# =============================================================
# QUICK SETUP COMMANDS - Copy and paste these
# =============================================================

echo "🚀 Starting Database Migration Setup..."
echo ""

# =============================================================
# 1. REPORTING DATABASE (PORT 5435)
# =============================================================
echo "📊 Setting up Reporting Database on port 5435..."

# Create database
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -c "CREATE DATABASE reporting_db;"

# Run migration
cd /home/unknown/Desktop/Proekt/backend/reporting-service
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -f reporting_db_complete_migration.sql

# Verify
echo ""
echo "Verifying reporting data..."
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "SELECT 'Velocity Records: ' || COUNT(*) FROM team_velocity;"
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "SELECT 'Burndown Records: ' || COUNT(*) FROM daily_burndown;"

echo ""
echo "✅ Reporting database setup complete!"
echo ""

# =============================================================
# 2. COLLABORATION DATABASE (PORT 5434)
# =============================================================
echo "💬 Setting up Collaboration Database on port 5434..."

# Create database
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -c "CREATE DATABASE collaboration_db;"

# Run migration
cd /home/unknown/Desktop/Proekt/backend/collaboration-service
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -f collaboration_db_complete_migration.sql

# Verify
echo ""
echo "Verifying collaboration data..."
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -c "SELECT 'Comments: ' || COUNT(*) FROM comments;"
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -c "SELECT 'Notifications: ' || COUNT(*) FROM notifications;"

echo ""
echo "✅ Collaboration database setup complete!"
echo ""

# =============================================================
# 3. TEST API ENDPOINTS
# =============================================================
echo "🔍 Testing API endpoints..."
echo ""

echo "Testing Reporting Service (port 3001)..."
curl -s http://localhost:3001/api/velocity/team/1 | jq 'length' 2>/dev/null || curl -s http://localhost:3001/api/velocity/team/1 | head -c 100
echo ""

curl -s http://localhost:3001/api/burndown/sprint/1 | jq 'length' 2>/dev/null || curl -s http://localhost:3001/api/burndown/sprint/1 | head -c 100
echo ""

echo "Testing Collaboration Service (port 3000)..."
curl -s http://localhost:3000/api/comments/entity/BACKLOG_ITEM/1 | jq 'length' 2>/dev/null || curl -s http://localhost:3000/api/comments/entity/BACKLOG_ITEM/1 | head -c 100
echo ""

echo ""
echo "✅ All migrations complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Check that both services are running (ports 3000 and 3001)"
echo "   2. Open frontend and navigate to Reports page"
echo "   3. Open browser console (F12) to see debug logs"
echo "   4. Select 'Sprint 1' from dropdown for burndown chart"
echo ""
