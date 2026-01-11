# Database Migration Guide

## Prerequisites
- PostgreSQL installed and running
- **Collaboration DB port: 5434**
- **Reporting DB port: 5435**
- Username: postgres
- Password: postgres (update commands if different)

---

## 1. Reporting Service Database Migration

### Create the database (if not exists)
```bash
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -c "CREATE DATABASE reporting_db;"
```

### Run the migration
```bash
cd /home/unknown/Desktop/Proekt/backend/reporting-service
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -f reporting_db_complete_migration.sql
```

### Verify the data
```bash
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "SELECT COUNT(*) as velocity_count FROM team_velocity;"
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "SELECT COUNT(*) as burndown_count FROM daily_burndown;"
```

**Expected output:**
- velocity_count: 10
- burndown_count: 15

---

## 2. Collaboration Service Database Migration

### Create the database (if not exists)
```bash
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -c "CREATE DATABASE collaboration_db;"
```

### Run the migration
```bash
cd /home/unknown/Desktop/Proekt/backend/collaboration-service
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -f collaboration_db_complete_migration.sql
```

### Verify the data
```bash
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -c "SELECT COUNT(*) as comments FROM comments;"
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -c "SELECT COUNT(*) as notifications FROM notifications;"
```

**Expected output:**
- comments: 6
- notifications: 4

---

## 3. Update Service Configuration

### Reporting Service (.env file)
Ensure your reporting service has these settings:
```bash
DB_HOST=localhost
DB_PORT=5435
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reporting_db
PORT=3001
SCRUM_API_URL=http://localhost:8081/api
```

### Collaboration Service (.env file)
Ensure your collaboration service has these settings:
```bash
DB_HOST=localhost
DB_PORT=5434
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=collaboration_db
PORT=3000
```

---

## 4. Restart Services

```bash
# Restart reporting service
cd /home/unknown/Desktop/Proekt/backend/reporting-service
# Kill existing process if running, then:
npm run start:dev

# Restart collaboration service
cd /home/unknown/Desktop/Proekt/backend/collaboration-service
# Kill existing process if running, then:
npm run start:dev
```

---

## 5. Test API Endpoints

### Test Reporting Service
```bash
# Test velocity endpoint
curl http://localhost:3001/api/velocity/team/1

# Test burndown endpoint
curl http://localhost:3001/api/burndown/sprint/1
```

**Expected:** Both should return JSON data

### Test Collaboration Service
```bash
# Test comments endpoint
curl http://localhost:3000/api/comments/entity/BACKLOG_ITEM/1

# Test notifications endpoint
curl http://localhost:3000/api/notifications/user/1
```

---

## 6. Troubleshooting Frontend Issues

### Check Browser Console
Open the team-portal in your browser and check the console (F12) for:
1. Network requests to `http://localhost:3001/api/velocity/team/1`
2. Network requests to `http://localhost:3001/api/burndown/sprint/1`
3. Any CORS errors
4. Any 404 or 500 errors

### Common Issues and Solutions

#### Issue: "No velocity data available yet"
**Possible causes:**
1. Sprints don't have `teamId` field set
   - **Solution:** The frontend now defaults to teamId=1 if not found
2. Reporting service is not running on port 3001
   - **Solution:** Check with `lsof -i :3001` or `curl http://localhost:3001/api/velocity/team/1`
3. CORS issues
   - **Solution:** The reporting service is configured to allow requests from `http://localhost:4200`

#### Issue: "No burndown data available for this sprint"
**Possible causes:**
1. No sprint selected in dropdown
   - **Solution:** Select a sprint from the dropdown menu
2. Selected sprint ID doesn't have data
   - **Solution:** The migration creates data for sprint ID 1. Select that sprint.
3. Burndown data not generated for the sprint
   - **Solution:** Run the migration script which generates sample data

#### Issue: Network errors (ERR_CONNECTION_REFUSED)
**Possible causes:**
1. Reporting service not running
   - **Solution:** Start the service with `npm run start:dev`
2. Wrong port in environment.ts
   - **Solution:** Verify `reportingApiUrl: 'http://localhost:3001/api'`

### Force Refresh Frontend
```bash
# Clear Angular build cache
cd /home/unknown/Desktop/Proekt/frontend/team-portal
rm -rf .angular/cache
ng serve
```

---

## 7. Verify Data in Database

### Check velocity data
```sql
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "
SELECT id, team_id, sprint_name, velocity, sprint_end_date
FROM team_velocity
ORDER BY sprint_end_date DESC
LIMIT 10;"
```

### Check burndown data
```sql
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -c "
SELECT sprint_id, date, remaining_points, ideal_remaining_points, completed_points
FROM daily_burndown
WHERE sprint_id = 1
ORDER BY date
LIMIT 10;"
```

---

## 8. Additional Sample Data (Optional)

If you need more test data:

### Generate burndown data for additional sprints
```sql
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db << 'EOF'
DO $$
DECLARE
  v_sprint_id INT;
  committed_points INT := 50;
  start_date DATE;
  day INT;
  ideal_remaining FLOAT;
  actual_remaining FLOAT;
  completed FLOAT;
  progress FLOAT;
BEGIN
  -- Generate for sprints 2-5
  FOR v_sprint_id IN 2..5 LOOP
    start_date := CURRENT_DATE - INTERVAL '14 days' - ((v_sprint_id - 1) * INTERVAL '14 days');

    DELETE FROM daily_burndown WHERE sprint_id = v_sprint_id;

    FOR day IN 0..14 LOOP
      ideal_remaining := GREATEST(0, committed_points * (1 - day::FLOAT / 14));
      progress := LEAST(1, day::FLOAT / 14 + (RANDOM() * 0.15));
      actual_remaining := GREATEST(0, committed_points * (1 - progress));
      completed := committed_points - actual_remaining;

      INSERT INTO daily_burndown (sprint_id, date, remaining_points, ideal_remaining_points, completed_points, added_points)
      VALUES (
        v_sprint_id,
        start_date + (day || ' days')::INTERVAL,
        ROUND(actual_remaining),
        ROUND(ideal_remaining),
        ROUND(completed),
        0
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Generated burndown data for sprints 2-5';
END $$;
EOF
```

---

## Summary

After running these migrations:

1. ✅ **Reporting DB** will have:
   - 10 velocity records for team 1
   - 15 burndown data points for sprint 1
   - All necessary tables and indexes

2. ✅ **Collaboration DB** will have:
   - Comments, activity logs, and notifications tables
   - Sample data for testing
   - Helper functions for common operations

3. ✅ **Frontend** should display:
   - Velocity chart with 10 sprints
   - Burndown chart for sprint 1 (when selected)

**Next Steps:**
1. Run the migration scripts
2. Restart the services
3. Refresh the frontend
4. Check browser console for any errors
5. Report any issues with specific error messages
