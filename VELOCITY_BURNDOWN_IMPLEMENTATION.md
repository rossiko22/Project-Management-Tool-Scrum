# Velocity & Burndown Chart Implementation

## Overview
This implementation provides **real-time velocity tracking** and **project-level burndown charts** based on actual sprint completion data. When a Scrum Master ends a sprint, the system automatically:
1. Calculates velocity (completed story points)
2. Tracks backlog reduction across sprints
3. Updates the reporting database
4. Displays beautiful charts in the Team Portal

## How It Works

### 1. Sprint Completion Flow
```
Scrum Master ends sprint
  ↓
SprintService.endSprint()
  ↓
Publishes SprintEvent to Kafka (topic: scrum.sprint)
  ↓
Reporting Service Kafka Consumer receives event
  ↓
SprintCompletionService processes event
  ↓
Saves to 3 tables:
  - team_velocity (for velocity chart)
  - project_burndown (for burndown chart)
  - sprint_metrics (for general metrics)
```

### 2. Data Tracked

#### Team Velocity
- **Sprint ID**: Unique identifier for the sprint
- **Sprint Name**: e.g., "Sprint 1", "Sprint 2"
- **Team ID**: Which team completed the sprint
- **Velocity**: Story points completed (from DONE/ACCEPTED items)
- **Sprint End Date**: When the sprint was completed

#### Project Burndown
- **Sprint Number**: Sequential number (1, 2, 3, ...)
- **Backlog Items Remaining**: Total backlog items after sprint completion
- **Items Completed in Sprint**: Items moved to ACCEPTED status
- **Completed Points**: Story points from completed items
- **Sprint End Date**: When the sprint was completed

### 3. Beautiful Charts in Frontend

#### Velocity Chart
- Bar chart showing velocity for last 10 sprints
- Displays story points completed per sprint
- Shows average velocity
- Hover effects with detailed information
- Green gradient bars for visual appeal

#### Project Burndown Chart
- Line chart showing backlog reduction over time
- Y-axis: Backlog items remaining
- X-axis: Sprint number and completion date
- Shows items completed in each sprint
- Red line with data points
- Grid lines for easy reading
- Statistics showing starting backlog, current backlog, and total completed

## Files Modified/Created

### Backend - Reporting Service

#### New Files
1. `/backend/reporting-service/src/entities/project-burndown.entity.ts` - Entity for project burndown data
2. `/backend/reporting-service/src/kafka/sprint-events.consumer.ts` - Kafka consumer for sprint events
3. `/backend/reporting-service/src/services/sprint-completion.service.ts` - Service to process sprint completions
4. `/backend/reporting-service/src/modules/kafka.module.ts` - Kafka module configuration
5. `/backend/reporting-service/migrations/002_add_project_burndown.sql` - Database migration

#### Modified Files
1. `/backend/reporting-service/src/app.module.ts` - Added KafkaModule
2. `/backend/reporting-service/src/modules/burndown.module.ts` - Added ProjectBurndown entity
3. `/backend/reporting-service/src/controllers/burndown.controller.ts` - Added project burndown endpoint
4. `/backend/reporting-service/src/services/burndown.service.ts` - Added project burndown query method

### Frontend - Team Portal

#### Modified Files
1. `/frontend/team-portal/src/app/models/sprint.model.ts` - Added ProjectBurndownData interface
2. `/frontend/team-portal/src/app/services/reporting.service.ts` - Added getProjectBurndown method
3. `/frontend/team-portal/src/app/components/reports/reports.component.ts` - Updated to fetch and display both charts
4. `/frontend/team-portal/src/app/components/reports/reports.component.html` - New beautiful chart layout
5. `/frontend/team-portal/src/app/components/reports/reports.component.scss` - Complete styling overhaul

## Setup Instructions

### 1. Run Database Migration

```bash
# Navigate to reporting service
cd /home/unknown/Desktop/Proekt/backend/reporting-service

# Run the migration
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -f migrations/002_add_project_burndown.sql
```

### 2. Configure Environment Variables

Make sure the reporting service has these variables in `.env`:
```
KAFKA_BROKER=localhost:9092
SCRUM_CORE_URL=http://localhost:8082
DB_HOST=localhost
DB_PORT=5435
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reporting_db
```

### 3. Start Services

```bash
# 1. Make sure Kafka is running
# Check if Kafka is running on port 9092

# 2. Start reporting service
cd /home/unknown/Desktop/Proekt/backend/reporting-service
npm install  # if needed
npm run start:dev

# 3. Start team portal
cd /home/unknown/Desktop/Proekt/frontend/team-portal
npm install  # if needed
npm start
```

### 4. Test the Implementation

1. **Create a Sprint**: Go to the Sprints page and create a new sprint
2. **Add Items**: Add backlog items to the sprint
3. **Start Sprint**: Start the sprint
4. **Complete Items**: Move items to DONE status
5. **End Sprint**: End the sprint (this triggers the Kafka event)
6. **View Reports**: Go to Reports page (http://localhost:4201/reports)
   - You should see the velocity data for the completed sprint
   - You should see the burndown data showing backlog reduction

## API Endpoints

### Get Team Velocity
```
GET /api/velocity/team/{teamId}
```
Returns all velocity data for a team.

### Get Project Burndown
```
GET /api/burndown/project/{projectId}
```
Returns all burndown data for a project showing backlog reduction across sprints.

## Data Flow Example

### Example: Complete Sprint 1

1. **Initial State**:
   - Backlog: 30 items
   - Sprint 1 has: 5 items (20 points)

2. **Sprint Completion**:
   - 4 items completed (15 points)
   - 1 item returned to backlog

3. **Kafka Event Published**:
   ```json
   {
     "sprintId": 1,
     "projectId": 1,
     "teamId": 1,
     "sprintName": "Sprint 1",
     "completedPoints": 15,
     "velocity": 15,
     "storiesCompleted": 4,
     "endDate": "2026-01-10"
   }
   ```

4. **Reporting Service Processes**:
   - Fetches backlog count: 26 items remaining (30 - 4 completed)
   - Saves velocity: 15 points
   - Saves burndown: Sprint 1, 26 items remaining, 4 completed

5. **Frontend Displays**:
   - Velocity chart: Bar showing 15 points for Sprint 1
   - Burndown chart: Point at Sprint 1 showing 26 items remaining

## Features

### Real-time Updates
- Automatically updates when sprints complete
- No manual data entry required
- Based on actual sprint data

### Beautiful Visualization
- Modern card-based layout
- Gradient backgrounds
- Hover effects
- Responsive design
- Grid lines for easy reading
- Color-coded metrics

### Statistics
- Average velocity
- Total sprints completed
- Starting vs current backlog
- Total items completed

## Troubleshooting

### Kafka Consumer Not Receiving Events
1. Check Kafka is running: `nc -zv localhost 9092`
2. Check logs in reporting service for "Kafka consumer connected"
3. Verify topic exists: `kafka-topics --list --bootstrap-server localhost:9092`

### No Data Showing in Charts
1. Check if sprints have been completed
2. Check reporting service logs for errors
3. Verify database has data: `SELECT * FROM team_velocity;`
4. Check browser console for API errors

### Database Migration Failed
1. Check database is running: `pg_isready -h localhost -p 5435`
2. Verify database exists: `psql -h localhost -p 5435 -U postgres -l`
3. Check for existing table: `\dt project_burndown`

## Future Enhancements

1. **Historical Comparison**: Compare velocity across multiple teams
2. **Forecasting**: Predict sprint completion based on velocity trends
3. **Burndown Alerts**: Alert when burndown deviates from ideal
4. **Export Reports**: Download charts as PDF or CSV
5. **Custom Time Ranges**: Filter charts by date range
