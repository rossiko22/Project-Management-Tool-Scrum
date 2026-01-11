# Test Real Sprint Data - Step by Step Guide

## ✅ System Ready for Testing

All seed data has been cleared. The system is now ready to track **real sprint completions**.

### Current Status
- ✅ Velocity data: **0 records** (empty, ready for real data)
- ✅ Burndown data: **0 records** (empty, ready for real data)
- ✅ Reporting Service: **Running on port 3001**
- ✅ Team Portal: **Running on port 4201**
- ✅ Kafka Consumer: **Listening for sprint events**
- ✅ Angular Template: **Fixed (no more errors)**

## 📋 Test Scenario: Sprint 1 (30 points) + Sprint 2 (20 points)

### Step 1: Create Project (if not already created)

1. **Login** to http://localhost:4201
2. **Navigate** to Dashboard
3. **Create Project** if you don't have one:
   - Name: "Test Project"
   - Description: "Testing velocity tracking"

### Step 2: Create Sprint 1

1. **Go to Sprints** page: http://localhost:4201/sprints
2. **Click "Create Sprint"**
3. **Fill in details**:
   ```
   Sprint Name: Sprint 1
   Sprint Goal: Test velocity tracking
   Start Date: Today
   End Date: Today + 14 days
   Length: 2 weeks
   Team Capacity: 30 (optional)
   ```
4. **Click "Create"**

### Step 3: Add Backlog Items to Sprint 1 (Total 30 points)

**Option A: Add items from backlog**
1. Go to **Backlog** page
2. Create items with story points:
   - Item 1: "Implement login" - 8 points
   - Item 2: "Create dashboard" - 8 points
   - Item 3: "Add user profile" - 5 points
   - Item 4: "Setup database" - 5 points
   - Item 5: "Write tests" - 4 points
   - **Total: 30 points**

**Option B: Add items directly to sprint**
1. In Sprint 1 details view
2. Click "Add Item to Sprint"
3. Create the items listed above

### Step 4: Start Sprint 1

1. **Open Sprint 1** details
2. **Click "Start Sprint"** button
3. ✅ Sprint status should change to **ACTIVE**

### Step 5: Move Items to DONE (Complete Sprint 1)

1. **Go to Board** page: http://localhost:4201/board
2. **Select Sprint 1** from dropdown
3. **Drag and Drop** items to DONE column:
   - Drag "Implement login" → DONE
   - Drag "Create dashboard" → DONE
   - Drag "Add user profile" → DONE
   - Drag "Setup database" → DONE
   - Drag "Write tests" → DONE
4. ✅ All 5 items should be in DONE column

### Step 6: Accept Items (Product Owner)

1. **Go to Backlog** page
2. For each DONE item, **click "Accept"**
3. This moves them to **ACCEPTED** status
4. Verify all items show status: **ACCEPTED**

### Step 7: End Sprint 1 🎯

1. **Go to Sprints** page
2. **Click "End Sprint"** on Sprint 1
3. **Watch for Kafka event in reporting service logs**:
   ```
   📨 Received sprint event: COMPLETED for sprint X (Sprint 1)
   🎯 Processing sprint completion for sprint X
   💾 Saving velocity data for sprint X
   ✅ Velocity data saved: 30 points
   💾 Calculating burndown data for sprint X
   ✅ Burndown data saved: Sprint 1, Y items remaining
   ✅ All metrics saved for sprint X
   ```

### Step 8: Verify Sprint 1 Data in Reports 📊

1. **Go to Reports** page: http://localhost:4201/reports
2. **Refresh** if needed
3. **You should see**:

   **Team Velocity Chart:**
   ```
   ┌─────────────────┐
   │  30 pts         │
   │   ██            │
   │   ██            │
   │   ██            │
   │ Sprint 1        │
   │ (end date)      │
   └─────────────────┘
   Average: 30.0 pts
   Total Sprints: 1
   ```

   **Project Burndown Chart:**
   ```
   Shows data point for Sprint 1 with:
   - Backlog items remaining after sprint
   - 5 items completed
   - 30 points completed
   ```

### Step 9: Create Sprint 2

1. **Go to Sprints** page
2. **Click "Create Sprint"**
3. **Fill in details**:
   ```
   Sprint Name: Sprint 2
   Sprint Goal: Continue development
   Start Date: Today
   End Date: Today + 14 days
   Length: 2 weeks
   ```

### Step 10: Add Backlog Items to Sprint 2 (Total 20 points)

Create and add these items:
- Item 6: "API integration" - 8 points
- Item 7: "UI improvements" - 5 points
- Item 8: "Bug fixes" - 4 points
- Item 9: "Documentation" - 3 points
- **Total: 20 points**

### Step 11: Start Sprint 2

1. **Open Sprint 2** details
2. **Click "Start Sprint"**
3. ✅ Sprint status: **ACTIVE**

### Step 12: Complete Sprint 2

1. **Go to Board** page
2. **Select Sprint 2**
3. **Move all items to DONE**
4. **Accept all items** (Product Owner)
5. **End Sprint 2**

### Step 13: Verify Sprint 2 Data in Reports 📊

1. **Go to Reports** page
2. **You should see**:

   **Team Velocity Chart:**
   ```
   ┌─────────────────┬─────────────────┐
   │  30 pts         │  20 pts         │
   │   ██            │   ██            │
   │   ██            │   ██            │
   │   ██            │   ██            │
   │ Sprint 1        │ Sprint 2        │
   │ (date 1)        │ (date 2)        │
   └─────────────────┴─────────────────┘
   Average: 25.0 pts
   Total Sprints: 2
   ```

   **Project Burndown Chart:**
   ```
   Shows line connecting Sprint 1 → Sprint 2
   - Sprint 1: X items remaining
   - Sprint 2: Y items remaining
   - Downward trend showing backlog reduction
   ```

## 🔍 Verification Checklist

After ending each sprint:

### Backend Verification
```bash
# Check velocity data
curl http://localhost:3001/api/velocity/team/1 | python3 -m json.tool

# Check burndown data
curl http://localhost:3001/api/burndown/project/1 | python3 -m json.tool

# Check database directly
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db \
  -c "SELECT sprint_name, velocity, sprint_end_date FROM team_velocity ORDER BY sprint_end_date;"

PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db \
  -c "SELECT sprint_number, sprint_name, backlog_items_remaining, items_completed_in_sprint, completed_points FROM project_burndown ORDER BY sprint_number;"
```

### Frontend Verification
1. ✅ Velocity chart shows correct bars
2. ✅ Bar heights reflect point values (30 vs 20)
3. ✅ Sprint names display correctly
4. ✅ End dates are accurate
5. ✅ Average velocity calculation is correct
6. ✅ Burndown line connects both sprints
7. ✅ Stats show correct totals

## 🚨 Troubleshooting

### "I ended the sprint but don't see data in reports"

**Check 1: Kafka Consumer Logs**
```bash
# Look in reporting service terminal for:
📨 Received sprint event: COMPLETED
💾 Saving velocity data
✅ All metrics saved
```

**Check 2: Database**
```bash
# Verify data was saved
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db \
  -c "SELECT COUNT(*) FROM team_velocity;"

PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db \
  -c "SELECT COUNT(*) FROM project_burndown;"
```

**Check 3: API Response**
```bash
# Test API endpoints
curl http://localhost:3001/api/velocity/team/1
curl http://localhost:3001/api/burndown/project/1
```

**Check 4: Browser Console**
- Open browser console (F12)
- Go to Network tab
- Refresh reports page
- Look for API calls and responses

### "Kafka consumer not receiving events"

**Solution 1: Check Kafka is running**
```bash
nc -zv localhost 9092
```

**Solution 2: Restart reporting service**
```bash
cd backend/reporting-service
npm run start:dev
```

**Solution 3: Check reporting service logs**
Look for these startup messages:
```
✅ Kafka consumer connected
✅ Subscribed to scrum.sprint topic
✅ Kafka consumer is now running
```

### "Items not moving to DONE"

**Make sure:**
1. Sprint is **ACTIVE** (not PLANNED)
2. You're on the **Board** page
3. You selected the correct sprint
4. Items are in the sprint backlog

### "Can't accept items"

**Product Owner only:**
- Only Product Owner role can accept items
- Make sure you're logged in with PO role
- Items must be in DONE status first

## 📊 Expected Results

### After Sprint 1 (30 points):
```json
// GET /api/velocity/team/1
[
  {
    "id": 1,
    "teamId": "1",
    "sprintId": "1",
    "sprintName": "Sprint 1",
    "velocity": 30,
    "sprintEndDate": "2026-01-10T...",
    "calculatedAt": "2026-01-10T..."
  }
]

// GET /api/burndown/project/1
[
  {
    "id": 1,
    "projectId": "1",
    "sprintId": "1",
    "sprintNumber": 1,
    "sprintName": "Sprint 1",
    "backlogItemsRemaining": X,
    "itemsCompletedInSprint": 5,
    "completedPoints": 30,
    "sprintEndDate": "2026-01-10",
    "recordedAt": "2026-01-10T..."
  }
]
```

### After Sprint 2 (20 points):
```json
// GET /api/velocity/team/1
[
  {
    "id": 1,
    "sprintName": "Sprint 1",
    "velocity": 30,
    ...
  },
  {
    "id": 2,
    "sprintName": "Sprint 2",
    "velocity": 20,
    ...
  }
]
```

## 🎯 Success Criteria

You know it's working when:
- ✅ Sprint 1 shows in velocity chart with 30 points
- ✅ Sprint 2 shows in velocity chart with 20 points
- ✅ Average velocity = 25.0 points
- ✅ Burndown chart shows 2 data points connected by line
- ✅ Stats show correct starting/current backlog
- ✅ Hover effects work on all chart elements
- ✅ Data persists after page refresh

## 🔄 Reset for Another Test

If you want to test again:
```bash
# Clear all data
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db \
  -c "TRUNCATE team_velocity RESTART IDENTITY CASCADE; TRUNCATE project_burndown RESTART IDENTITY CASCADE;"

# Verify cleared
curl http://localhost:3001/api/velocity/team/1
# Should return: []

curl http://localhost:3001/api/burndown/project/1
# Should return: []
```

## 📝 Notes

- **Velocity**: Based on ACCEPTED items' story points
- **Burndown**: Tracks backlog reduction across sprints
- **Real-time**: Data appears immediately after ending sprint
- **No manual entry**: Everything calculated automatically
- **Based on Scrum**: Follows proper Scrum methodology

---

**Ready to test? Start with Step 1! 🚀**
