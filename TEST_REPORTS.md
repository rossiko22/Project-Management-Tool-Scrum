# Testing the Reports System

## Current Status ✅

All systems are connected and working:

1. ✅ **Reporting Service**: Running on port 3001
2. ✅ **Team Portal Frontend**: Running on port 4201
3. ✅ **Database**: Project burndown data populated (10 sprints)
4. ✅ **API Endpoints**: Working correctly
5. ✅ **Kafka Consumer**: Compiled and ready to receive events

## API Testing

### Test Velocity Endpoint
```bash
curl http://localhost:3001/api/velocity/team/1 | python3 -m json.tool
```

Expected: 11 velocity records with sprint data

### Test Burndown Endpoint
```bash
curl http://localhost:3001/api/burndown/project/1 | python3 -m json.tool
```

Expected: 10 burndown records showing backlog reduction

## View Reports in Browser

### Option 1: Direct Access
1. Open browser: http://localhost:4201/reports
2. Login if needed (credentials from your system)
3. You should see:
   - **Team Velocity Chart** with 11 sprints
   - **Project Burndown Chart** showing reduction from 25 → 0 items

### Option 2: From Dashboard
1. Go to http://localhost:4201
2. Login
3. Click "Reports" in the navigation menu

## What You Should See

### Team Velocity Chart
- Green bar chart showing story points per sprint
- Sprint 1: 32 points
- Sprint 2: 20 points
- Sprint 3: 31 points
- ... through Sprint 10: 30 points
- Average velocity: ~26.6 points
- Total sprints: 11

### Project Burndown Chart
- Red line chart showing backlog reduction
- Starting backlog: 30 items
- Sprint 1 end: 25 items remaining
- Sprint 7 end: 1 item remaining
- Sprint 8-10: 0 items (all cleared!)
- Shows items completed per sprint in green

## Data Explanation

The seed data shows a realistic project progression:

1. **Sprint 1-2**: Team learning, moderate velocity
2. **Sprint 3**: Team hits stride, higher velocity
3. **Sprint 4-7**: Consistent progress, backlog reducing
4. **Sprint 8-10**: Backlog cleared, team working on new items

## How Real-Time Updates Work

When a Scrum Master ends a sprint in the system:

1. **Backend Flow**:
   ```
   SprintService.endSprint()
     ↓
   Publishes event to Kafka
     ↓
   Reporting Service Kafka Consumer receives
     ↓
   Saves to team_velocity & project_burndown tables
   ```

2. **Frontend Updates**:
   - Refresh the reports page
   - New data automatically appears in charts
   - No manual data entry needed

## Testing Real-Time Updates

### Create a New Sprint and Complete It

1. **Go to Sprints** (http://localhost:4201/sprints)
2. **Create Sprint 11**:
   - Name: "Sprint 11"
   - Start date: Today
   - End date: 2 weeks from now
   - Add some backlog items

3. **Start the Sprint**

4. **Complete Some Items**:
   - Move items to DONE status
   - Accept them (Product Owner)

5. **End the Sprint**:
   - Click "End Sprint"
   - Check reporting service logs for:
     ```
     📨 Received sprint event: COMPLETED for sprint X
     💾 Saving velocity data for sprint X
     💾 Calculating burndown data for sprint X
     ✅ Sprint completion processed successfully
     ```

6. **Refresh Reports Page**:
   - Should see Sprint 11 data in both charts

## Troubleshooting

### Charts Not Showing
1. **Check if logged in**: Reports page requires authentication
2. **Check browser console**: Press F12, look for errors
3. **Verify API connection**:
   ```bash
   curl http://localhost:3001/api/burndown/project/1
   curl http://localhost:3001/api/velocity/team/1
   ```

### Empty Charts
- **Velocity Chart Empty**: No team_velocity data in database
- **Burndown Chart Empty**: No project_burndown data
- **Solution**: Run seed script again:
  ```bash
  PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db \
    -f backend/reporting-service/seed-burndown-data.sql
  ```

### Kafka Consumer Not Working
1. **Check Kafka is running**:
   ```bash
   nc -zv localhost 9092
   ```

2. **Check reporting service logs**:
   ```bash
   # Look for these messages:
   ✅ Kafka consumer connected
   ✅ Subscribed to scrum.sprint topic
   ✅ Kafka consumer is now running
   ```

3. **Restart reporting service** if needed:
   ```bash
   cd backend/reporting-service
   npm run start:dev
   ```

### Frontend Not Loading Data
1. **Check environment config**:
   ```typescript
   // src/environments/environment.ts should have:
   reportingApiUrl: 'http://localhost:3001/api'
   ```

2. **Check browser network tab** (F12 → Network):
   - Should see requests to:
     - `http://localhost:3001/api/velocity/team/1`
     - `http://localhost:3001/api/burndown/project/1`
   - Both should return 200 OK

3. **Check CORS**: Reporting service has CORS enabled for localhost

## Database Queries

### View All Velocity Data
```sql
SELECT
    sprint_name,
    velocity,
    sprint_end_date
FROM team_velocity
WHERE team_id = 1
ORDER BY sprint_end_date;
```

### View All Burndown Data
```sql
SELECT
    sprint_number,
    sprint_name,
    backlog_items_remaining,
    items_completed_in_sprint,
    completed_points,
    sprint_end_date
FROM project_burndown
WHERE project_id = 1
ORDER BY sprint_number;
```

### Check Latest Sprint Completion
```sql
SELECT * FROM project_burndown
ORDER BY recorded_at DESC
LIMIT 1;
```

## Expected Chart Behavior

### Velocity Chart
- **Height**: Bars scale to highest velocity (32 points)
- **Hover**: Shows sprint name and exact points
- **Animation**: Bars slide up on page load
- **Colors**: Green gradient (lighter at top)

### Burndown Chart
- **Line**: Connects all sprint endpoints
- **Y-axis**: 0 to max backlog items (25)
- **X-axis**: Sprint 1 through Sprint 10
- **Points**: Clickable circles at each sprint
- **Trend**: Should show downward trajectory

## Success Criteria ✓

You know it's working when:
- ✅ Both charts visible on http://localhost:4201/reports
- ✅ Velocity chart shows 11 green bars
- ✅ Burndown chart shows red line from 25 → 0
- ✅ Stats show correct averages and totals
- ✅ Hover effects work on all chart elements
- ✅ Responsive design works on mobile

## Next Steps

1. **Test with Real Data**: Complete an actual sprint and watch it appear
2. **Monitor Trends**: Track velocity over time
3. **Plan Capacity**: Use average velocity for sprint planning
4. **Show Stakeholders**: Beautiful charts for demos
