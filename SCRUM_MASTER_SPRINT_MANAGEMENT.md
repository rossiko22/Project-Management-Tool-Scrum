# Scrum Master Sprint Management - Complete Feature Guide

## Overview

This document describes the comprehensive sprint management functionality available for Scrum Masters, aligned with real-world Scrum practices.

---

## ✅ Implemented Features

### 1. Sprint Creation (Scrum Master Only)

**Endpoint**: `POST /api/scrum/sprints`

**Permission**: `SCRUM_MASTER`, `ORGANIZATION_ADMIN`

**Description**: Only Scrum Masters can create new sprints, aligning with the Scrum framework where the SM facilitates sprint ceremonies.

**Request Body**:
```json
{
  "projectId": 1,
  "teamId": 1,
  "name": "Sprint 10",
  "goal": "Implement user authentication and authorization",
  "startDate": "2025-01-06",
  "endDate": "2025-01-19",
  "lengthWeeks": 2,
  "teamCapacity": 80
}
```

**Response**:
```json
{
  "id": 10,
  "projectId": 1,
  "name": "Sprint 10",
  "goal": "Implement user authentication and authorization",
  "startDate": "2025-01-06",
  "endDate": "2025-01-19",
  "lengthWeeks": 2,
  "status": "PLANNED",
  "teamCapacity": 80,
  "createdAt": "2025-01-04T10:00:00"
}
```

**Event Published**: `SPRINT_CREATED` to Kafka topic `scrum.sprint`

---

### 2. Sprint Planning (Add/Remove Items)

**Add Item**: `POST /api/scrum/sprints/{sprintId}/items/{backlogItemId}`

**Remove Item**: `DELETE /api/scrum/sprints/{sprintId}/items/{backlogItemId}`

**Permission**: `PRODUCT_OWNER`, `SCRUM_MASTER`, `DEVELOPER`, `ORGANIZATION_ADMIN`

**Description**: During sprint planning (PLANNED status), the team can add or remove backlog items.

**Business Rules**:
- ✅ Can add/remove items when sprint status is `PLANNED`
- ❌ **Cannot** add/remove items when sprint is `ACTIVE` (scope protection)
- ❌ **Cannot** add/remove items when sprint is `COMPLETED` or `CANCELLED`

**Item Status Changes**:
- When added: `BACKLOG` → `SPRINT_READY`
- When removed: `SPRINT_READY` → `BACKLOG`

---

### 3. Start Sprint (Scrum Master Only)

**Endpoint**: `POST /api/scrum/sprints/{id}/start`

**Permission**: `SCRUM_MASTER`, `ORGANIZATION_ADMIN`

**Description**: Transition sprint from PLANNED to ACTIVE status. This kicks off the sprint execution phase.

**What Happens**:
1. Sprint status changes to `ACTIVE`
2. `startedAt` timestamp is set
3. All backlog items in sprint change status: `SPRINT_READY` → `IN_SPRINT`
4. Committed story points are calculated
5. Event published to Kafka with committed points

**Requirements**:
- Sprint must be in `PLANNED` status
- Sprint must have at least one backlog item (recommended)

**Response**:
```json
{
  "id": 10,
  "status": "ACTIVE",
  "startedAt": "2025-01-06T09:00:00",
  "committedPoints": 55
}
```

**Event Published**: `SPRINT_STARTED` with committed points

---

### 4. End Sprint (Scrum Master Only)

**Endpoint**: `POST /api/scrum/sprints/{id}/end`

**Permission**: `SCRUM_MASTER`, `ORGANIZATION_ADMIN`

**Description**: Conclude the sprint, calculate velocity, and mark items as complete.

**What Happens**:
1. Sprint status changes to `COMPLETED`
2. `endedAt` timestamp is set
3. **Velocity calculation**:
   - Counts all items with status `DONE` or `ACCEPTED`
   - Sums actual story points completed
   - Tracks number of stories completed
4. Updates `SprintBacklogItem` records:
   - Sets `actualPoints` for completed items
   - Sets `completedAt` timestamp
5. Publishes completion event with metrics

**Metrics Calculated**:
- **Committed Points**: Total story points committed at sprint start
- **Completed Points**: Actual points delivered (velocity)
- **Stories Completed**: Number of user stories finished
- **Velocity**: Completed points (used for future sprint planning)

**Response**:
```json
{
  "id": 10,
  "status": "COMPLETED",
  "endedAt": "2025-01-19T17:00:00",
  "committedPoints": 55,
  "completedPoints": 47,
  "velocity": 47,
  "storiesCompleted": 8
}
```

**Event Published**: `SPRINT_COMPLETED` with full metrics

---

### 5. Cancel Sprint (Scrum Master Only) ✨ NEW

**Endpoint**: `POST /api/scrum/sprints/{id}/cancel`

**Permission**: `SCRUM_MASTER`, `ORGANIZATION_ADMIN`

**Description**: Cancel a sprint that cannot or should not continue.

**What Happens**:
1. Sprint status changes to `CANCELLED`
2. `endedAt` timestamp is set
3. **All backlog items return to BACKLOG** status
4. Sprint scope is freed for future sprints

**When to Use**:
- External circumstances prevent sprint completion
- Team capacity drastically changes mid-sprint
- Sprint goal becomes invalid/irrelevant

**Business Rules**:
- ✅ Can cancel `PLANNED` or `ACTIVE` sprints
- ❌ **Cannot** cancel `COMPLETED` sprints
- ❌ **Cannot** cancel already `CANCELLED` sprints

**Response**:
```json
{
  "id": 10,
  "status": "CANCELLED",
  "endedAt": "2025-01-12T14:30:00"
}
```

**Event Published**: `SPRINT_CANCELLED`

---

### 6. Sprint Retrospective ✨ NEW

**Create Retrospective**: `POST /api/scrum/retrospectives`

**Update Retrospective**: `PUT /api/scrum/retrospectives/{id}`

**Get Retrospective**: `GET /api/scrum/retrospectives/sprint/{sprintId}`

**Permission**:
- Create/Update: `SCRUM_MASTER`, `ORGANIZATION_ADMIN`
- Read: All team members

**Description**: Capture team feedback and action items after each sprint.

**Request Body**:
```json
{
  "sprintId": 10,
  "wentWell": [
    "Daily standups were well attended",
    "Good collaboration between frontend and backend",
    "CI/CD pipeline worked smoothly"
  ],
  "improvements": [
    "Reduce meeting times",
    "Better estimation for complex stories",
    "Improve test coverage before code review"
  ],
  "actionItems": [
    "Set up automated code quality checks",
    "Schedule estimation training session",
    "Create definition of done checklist"
  ],
  "overallNotes": "Team showed great collaboration. Sprint goal achieved 85%.",
  "teamMood": 4
}
```

**Response**:
```json
{
  "id": 15,
  "sprintId": 10,
  "facilitatedBy": 3,
  "createdAt": "2025-01-19T18:00:00",
  "wentWell": [...],
  "improvements": [...],
  "actionItems": [...],
  "overallNotes": "...",
  "teamMood": 4
}
```

**Business Rules**:
- One retrospective per sprint
- Can be created for `ACTIVE` or `COMPLETED` sprints
- Team mood rated 1-5 (1=poor, 5=excellent)
- Facilitated by Scrum Master

---

### 7. Get Sprint Information

**Get All Sprints**: `GET /api/scrum/sprints/project/{projectId}`

**Get Single Sprint**: `GET /api/scrum/sprints/{id}`

**Permission**: All team members

**Description**: Retrieve sprint information for tracking and planning.

**Response Example**:
```json
[
  {
    "id": 9,
    "name": "Sprint 9",
    "status": "COMPLETED",
    "goal": "Implement reporting dashboard",
    "startDate": "2024-12-23",
    "endDate": "2025-01-05",
    "committedPoints": 50,
    "completedPoints": 48,
    "velocity": 48
  },
  {
    "id": 10,
    "name": "Sprint 10",
    "status": "ACTIVE",
    "goal": "Implement user authentication",
    "startDate": "2025-01-06",
    "endDate": "2025-01-19"
  }
]
```

---

## Sprint Status Lifecycle

```
PLANNED ──────────► ACTIVE ──────────► COMPLETED
   │                  │
   │                  │
   └──────────────────┴───────────────► CANCELLED
```

### Status Definitions

| Status | Description | Allowed Operations |
|--------|-------------|-------------------|
| **PLANNED** | Sprint created, planning in progress | Add/remove items, Start, Cancel |
| **ACTIVE** | Sprint execution in progress | End, Cancel |
| **COMPLETED** | Sprint successfully finished | View only (read-only) |
| **CANCELLED** | Sprint was terminated early | View only (read-only) |

---

## Permission Matrix

| Operation | PRODUCT_OWNER | SCRUM_MASTER | DEVELOPER | ORGANIZATION_ADMIN |
|-----------|---------------|--------------|-----------|-------------------|
| Create Sprint | ❌ | ✅ | ❌ | ✅ |
| Start Sprint | ❌ | ✅ | ❌ | ✅ |
| End Sprint | ❌ | ✅ | ❌ | ✅ |
| Cancel Sprint | ❌ | ✅ | ❌ | ✅ |
| Add Item to Sprint | ✅ | ✅ | ✅ | ✅ |
| Remove Item from Sprint | ✅ | ✅ | ❌ | ✅ |
| View Sprints | ✅ | ✅ | ✅ | ✅ |
| Create Retrospective | ❌ | ✅ | ❌ | ✅ |
| Update Retrospective | ❌ | ✅ | ❌ | ✅ |
| View Retrospective | ✅ | ✅ | ✅ | ✅ |

---

## Event-Driven Architecture

All sprint lifecycle changes publish events to Kafka topic: `scrum.sprint`

### Event Types

1. **SPRINT_CREATED**
   - Published when: Sprint is created
   - Contains: Sprint metadata, goal, dates

2. **SPRINT_STARTED**
   - Published when: Sprint transitions to ACTIVE
   - Contains: Committed points, team capacity

3. **SPRINT_COMPLETED**
   - Published when: Sprint ends successfully
   - Contains: Committed points, completed points, velocity, stories completed

4. **SPRINT_CANCELLED**
   - Published when: Sprint is cancelled
   - Contains: Cancellation timestamp, sprint metadata

### Event Consumers

These events can be consumed by:
- **Reporting Service**: Calculate team velocity trends, burndown charts
- **Notification Service**: Alert team members of sprint changes
- **Analytics Service**: Track sprint metrics over time

---

## Database Schema

### sprint_retrospectives Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| sprint_id | BIGINT | Foreign key to sprints (unique) |
| facilitated_by | BIGINT | User ID of facilitator (SM) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| overall_notes | TEXT | General retrospective notes |
| team_mood | INTEGER | Team morale rating (1-5) |

### retrospective_went_well Table

| Column | Type | Description |
|--------|------|-------------|
| retrospective_id | BIGINT | Foreign key to sprint_retrospectives |
| item | TEXT | What went well item |

### retrospective_improvements Table

| Column | Type | Description |
|--------|------|-------------|
| retrospective_id | BIGINT | Foreign key to sprint_retrospectives |
| item | TEXT | Improvement suggestion |

### retrospective_action_items Table

| Column | Type | Description |
|--------|------|-------------|
| retrospective_id | BIGINT | Foreign key to sprint_retrospectives |
| item | TEXT | Action item for next sprint |

---

## Real-World Scrum Alignment

### ✅ Scrum Principles Implemented

1. **SM Owns Sprint Facilitation**: Only Scrum Masters can create, start, end, or cancel sprints
2. **Protected Sprint Scope**: Once active, sprint scope cannot be changed (no adding/removing items)
3. **Team Self-Organization**: All team members can participate in sprint planning (adding items)
4. **Transparency**: All team members can view sprint progress and retrospectives
5. **Continuous Improvement**: Retrospective feature captures lessons learned
6. **Velocity Tracking**: Automated calculation helps with future planning

### 🎯 Best Practices

1. **Sprint Duration**: Keep sprints to 1-4 weeks (configured via `lengthWeeks`)
2. **Sprint Goal**: Always define a clear, achievable goal
3. **Retrospective**: Hold after every sprint, not just when issues arise
4. **Action Items**: Follow up on retrospective action items in next sprint
5. **Velocity**: Use completed points (not committed) for forecasting
6. **Cancellation**: Rare event - should trigger team discussion

---

## Testing the Features

### 1. Create Sprint
```bash
curl -X POST http://team.local/api/scrum/sprints \
  -H 'Authorization: Bearer <SM_JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": 1,
    "teamId": 1,
    "name": "Sprint 11",
    "goal": "Improve performance",
    "startDate": "2025-01-20",
    "endDate": "2025-02-02",
    "lengthWeeks": 2,
    "teamCapacity": 85
  }'
```

### 2. Start Sprint
```bash
curl -X POST http://team.local/api/scrum/sprints/11/start \
  -H 'Authorization: Bearer <SM_JWT_TOKEN>'
```

### 3. End Sprint
```bash
curl -X POST http://team.local/api/scrum/sprints/11/end \
  -H 'Authorization: Bearer <SM_JWT_TOKEN>'
```

### 4. Create Retrospective
```bash
curl -X POST http://team.local/api/scrum/retrospectives \
  -H 'Authorization: Bearer <SM_JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "sprintId": 11,
    "wentWell": ["Good collaboration", "Met sprint goal"],
    "improvements": ["Better estimates needed"],
    "actionItems": ["Schedule estimation workshop"],
    "teamMood": 4
  }'
```

---

## Files Modified/Created

### Modified
- `SprintController.java` - Added cancel endpoint, updated create permissions
- `SprintService.java` - Added cancelSprint(), fixed velocity calculation in endSprint()

### Created
- `SprintRetrospective.java` (Entity)
- `CreateRetrospectiveRequest.java` (DTO)
- `RetrospectiveDto.java` (DTO)
- `SprintRetrospectiveRepository.java` (Repository)
- `RetrospectiveService.java` (Service)
- `RetrospectiveController.java` (Controller)
- `V3__add_sprint_retrospective.sql` (Migration)

---

## Next Steps for Complete Sprint Management

### Recommended Additions

1. **Sprint Burndown Chart Data**
   - Track remaining work daily
   - Store daily snapshots of incomplete points
   - Endpoint: `GET /api/scrum/sprints/{id}/burndown`

2. **Daily Standup Tracking**
   - Record blockers, progress, and plans
   - Link to sprint backlog items
   - Endpoint: `POST /api/scrum/sprints/{id}/standups`

3. **Sprint Review**
   - Capture stakeholder feedback
   - Track demo outcomes
   - Link acceptance criteria validation

4. **Sprint Metrics Dashboard**
   - Velocity trends over time
   - Sprint success rate
   - Average team mood from retrospectives

---

**Status**: ✅ Sprint Management features ready for Scrum Master use
**Next**: Rebuild services to apply changes: `./rebuild-services.sh`
