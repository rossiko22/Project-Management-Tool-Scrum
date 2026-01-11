# Reporting & Collaboration Services - Setup Summary

## Files Created

### 1. Database Migration Files

#### `/backend/reporting-service/reporting_db_complete_migration.sql`
Complete database schema and sample data for the reporting service including:
- `sprint_metrics` table
- `daily_burndown` table (with 15 days of sample data for sprint 1)
- `cumulative_flow` table
- `team_velocity` table (with 10 sprints of sample data for team 1)

#### `/backend/collaboration-service/collaboration_db_complete_migration.sql`
Complete database schema and sample data for the collaboration service including:
- `comments` table (with sample comments)
- `activity_logs` table (with sample activity data)
- `notifications` table (with sample notifications)
- Helper functions for common operations

### 2. Guide Document

#### `/DATABASE_MIGRATION_GUIDE.md`
Comprehensive step-by-step guide for:
- Running the migration scripts
- Verifying the data
- Testing the API endpoints
- Troubleshooting common issues
- Generating additional sample data

---

## Frontend Changes Made

### Enhanced Error Handling & Debugging

#### `frontend/team-portal/src/app/components/reports/reports.component.ts`
- ✅ Added console logging to track data loading
- ✅ Added fallback to teamId=1 when sprints don't have teamId
- ✅ Enhanced error messages to show specific error details
- ✅ Added logging for received data to help diagnose issues

#### `frontend/team-portal/src/app/services/reporting.service.ts`
- ✅ Fixed API URLs to match backend routes
- ✅ Added console logging for all HTTP requests
- ✅ Correctly using `environment.reportingApiUrl` instead of `environment.apiUrl`

---

## Backend Changes Made

### Reporting Service

#### New Files Created:
1. **`src/services/sync.service.ts`** - Service to synchronize data from scrum-core-service
2. **`src/controllers/sync.controller.ts`** - REST endpoints for data synchronization
3. **`src/modules/sync.module.ts`** - Module configuration

#### Modified Files:
1. **`src/entities/team-velocity.entity.ts`** - Added `sprintName` column
2. **`src/app.module.ts`** - Registered SyncModule

#### New API Endpoints:
- `POST /api/sync/sprint/:sprintId` - Sync specific sprint data
- `POST /api/sync/all` - Sync all sprints
- `POST /api/sync/test-data` - Generate test data

---

## How to Use

### Step 1: Run Database Migrations
```bash
# Create and migrate reporting database (PORT 5435)
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -c "CREATE DATABASE reporting_db;"
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -f backend/reporting-service/reporting_db_complete_migration.sql

# Create and migrate collaboration database (PORT 5434)
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -c "CREATE DATABASE collaboration_db;"
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -f backend/collaboration-service/collaboration_db_complete_migration.sql
```

### Step 2: Verify Data Was Created
```bash
# Check reporting data (PORT 5435)
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "SELECT COUNT(*) FROM team_velocity;"
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "SELECT COUNT(*) FROM daily_burndown;"

# Check collaboration data (PORT 5434)
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -c "SELECT COUNT(*) FROM comments;"
```

### Step 3: Test API Endpoints
```bash
# Test velocity (should return 10 records)
curl http://localhost:3001/api/velocity/team/1

# Test burndown (should return 15 records)
curl http://localhost:3001/api/burndown/sprint/1
```

### Step 4: Access Frontend
1. Open your browser to the team-portal (usually `http://localhost:4200`)
2. Navigate to the Reports page
3. Open browser console (F12) to see debug logs
4. For burndown chart: Select "Sprint 1" from the dropdown
5. Velocity chart should load automatically with 10 sprints

---

## Expected Results

### Velocity Chart
- Should display 10 sprints with velocity data
- Each sprint shows: Sprint Name, End Date, and Velocity (points)
- Velocities range from 20-35 points

### Burndown Chart
- Shows daily progress for sprint 1 (15 days)
- Two lines: Ideal (gray) and Actual (blue/red)
- X-axis: Dates (last 14 days)
- Y-axis: Remaining story points

---

## Troubleshooting

### If you see "No velocity data available yet"

**Check these in order:**

1. **Open browser console (F12)** and look for:
   ```
   Loading velocity data...
   Sprints: [...]
   Found teamId: 1
   Fetching velocity data from: http://localhost:3001/api/velocity/team/1
   Velocity data received: [...]
   ```

2. **If you see CORS errors:**
   - The reporting service should be configured to accept requests from localhost:4200
   - CORS is already configured correctly in main.ts

3. **If you see 404 errors:**
   - Verify reporting service is running: `lsof -i :3001`
   - Test the endpoint directly: `curl http://localhost:3001/api/velocity/team/1`

4. **If you see empty array []:**
   - Verify database has data: `PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "SELECT * FROM team_velocity LIMIT 5;"`
   - Re-run the migration script if needed

5. **If you don't see any network requests:**
   - The component might not be loading
   - Check Angular router configuration
   - Verify the Reports component is mounted

### If you see "No burndown data available for this sprint"

1. **Make sure you selected a sprint from the dropdown**
   - Sprint 1 has sample data
   - Sprints 2-10 don't have burndown data (only velocity data)

2. **Check console for errors:**
   ```
   Loading burndown data for sprint: 1
   Fetching burndown data from: http://localhost:3001/api/burndown/sprint/1
   Burndown data received: [...]
   ```

3. **Verify sprint 1 has data:**
   ```bash
   PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "SELECT COUNT(*) FROM daily_burndown WHERE sprint_id = 1;"
   ```
   Should return: 15

---

## Current API Status

### Reporting Service (port 3001)
✅ **Working Endpoints:**
- `GET /api/velocity/team/:teamId` - Returns velocity history
- `GET /api/burndown/sprint/:sprintId` - Returns burndown data
- `POST /api/sync/all` - Syncs data from scrum-core-service
- `POST /api/sync/sprint/:sprintId` - Syncs specific sprint
- `POST /api/sync/test-data` - Generates test data

### Collaboration Service (port 3000)
✅ **Should have endpoints for:**
- Comments (CRUD operations)
- Activity logs (create, read)
- Notifications (CRUD, mark as read)

---

## Sample Data Included

### Reporting Service
- **Team 1 Velocity**: 10 sprints with velocities ranging from 20-35 points
- **Sprint 1 Burndown**: 15 days of burndown data showing realistic sprint progress
- Dates span from ~140 days ago to present

### Collaboration Service
- **6 Comments**: On various entities (backlog items, tasks, sprints)
- **5 Activity Logs**: User actions and changes
- **4 Notifications**: Various notification types
- **1 Notification** marked as read (for testing)

---

## Next Steps

1. ✅ Run the migration scripts
2. ✅ Restart the reporting and collaboration services
3. ✅ Open the frontend and check browser console
4. ✅ Report any specific errors you see
5. 📊 If everything works, you should see charts with data!

---

## Need More Help?

If you're still seeing issues, provide:
1. **Browser console output** (all logs and errors)
2. **Network tab** showing the API requests and responses
3. **Any error messages** from the backend services
4. **Database query results** to verify data exists

The enhanced logging should make it easy to pinpoint exactly where the issue is!
