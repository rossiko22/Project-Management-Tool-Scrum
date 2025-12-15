# TODO List for Next Session - Copy & Paste This

## 🔴 CRITICAL - Must Do First

### 1. Build & Deploy Changes
```bash
cd /home/unknown/Desktop/Proekt
./rebuild-services.sh
```
**Why**: All code changes (sprint management, JWT HS256, retrospectives) need to be compiled into JARs

**Files Changed**:
- `SprintController.java` - Added cancel endpoint, fixed create permissions
- `SprintService.java` - Fixed velocity calculation, added cancelSprint()
- `JwtUtil.java` (both services) - Enforced HS256 algorithm
- Created: Retrospective entity, DTOs, service, controller, repository
- Created: `V3__add_sprint_retrospective.sql` migration

### 2. Verify Database Migrations Run
```bash
# Check Flyway migration status
docker exec scrum-core-db psql -U postgres -d scrum_core_db -c "SELECT version, description, success FROM flyway_schema_history;"

# Should show:
# V1__init_schema - success
# V2__add_acceptance_fields - success
# V3__add_sprint_retrospective - success (NEW)
```
**If V3 didn't run**: Migration file was created but service wasn't rebuilt

### 3. Test Sprint Management End-to-End
Login as Scrum Master (`sm123@example.com` / `admin123`) and test:
1. Create sprint → Should work (SM only now)
2. Add items to sprint → Should work
3. Start sprint → Should work (SM only)
4. Try to add item to ACTIVE sprint → Should FAIL (scope protected)
5. End sprint → Should work (with velocity calculated)
6. Create retrospective → Should work (SM only)
7. Cancel sprint → Test on a new sprint

---

## 🟡 IMPORTANT - Scrum Alignment & Permissions

### 4. Verify ALL Permission Changes Applied
Review these endpoints and confirm correct roles:

**Identity Service**:
- ✅ Authentication endpoints public
- ✅ User management (admin only?)

**Scrum Core Service**:
- ✅ Sprint create: SCRUM_MASTER only ✓
- ✅ Sprint start/end/cancel: SCRUM_MASTER only ✓
- ✅ Task CRUD: DEVELOPER only (was this done?)
- ✅ Backlog create: PO + DEVELOPER (SM removed?)
- ✅ Sprint planning (add/remove items): PO + SM + DEV
- ✅ Retrospective create/update: SCRUM_MASTER only ✓
- ❓ Impediment management: Who can create/resolve?

**CHECK**: Review `SCRUM_ALIGNMENT_IMPLEMENTATION.md` from previous session - were ALL Phase 1 & Phase 2 items implemented?

### 5. Implement Missing Scrum Features from Previous Plan

**From SCRUM_ALIGNMENT_IMPLEMENTATION.md - Phase 2**:

**a) Product Owner Acceptance Workflow**
- Backend: `acceptBacklogItem()` and `rejectBacklogItem()` were added to BacklogService
- Frontend: Missing UI buttons in backlog component
- Status: ⚠️ Backend done, frontend NOT done

**b) Impediment Management**
- Controller: `ImpedimentController.java` was created
- Service: Needs verification
- Status: ⚠️ Partially done, needs testing

**c) Task Self-Assignment Enforcement**
- Service: `TaskService.java` modified with validation
- Status: ✅ Done (verify it works)

**CHECK THESE FILES**:
```bash
# Verify these exist and have correct logic:
backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/service/BacklogService.java
backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/service/TaskService.java
backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/controller/ImpedimentController.java
```

---

## 🟢 ENHANCEMENTS - Nice to Have

### 6. Additional Sprint Features (Optional)

**Sprint Burndown Chart**:
- Create `DailyBurndown` entity
- Track remaining work daily
- Endpoint: `GET /api/scrum/sprints/{id}/burndown`
- Migration: `V4__add_burndown_tracking.sql`

**Daily Standup Tracking**:
- Create `DailyStandup` entity
- Track blockers, progress, plans
- Endpoint: `POST /api/scrum/sprints/{id}/standups`
- Migration: `V5__add_daily_standups.sql`

**Sprint Review**:
- Create `SprintReview` entity
- Capture stakeholder feedback
- Link to demo outcomes
- Migration: `V6__add_sprint_review.sql`

### 7. Frontend Integration

**Angular Team Portal** (`frontend/team-portal/src/app/components/`):

**Sprint Component** - Update to use new endpoints:
- Add "Cancel Sprint" button (SM only)
- Show velocity on completed sprints
- Display retrospective link

**Retrospective Component** - Create new:
- Form for creating retrospective
- Display went well / improvements / action items
- Team mood selector (1-5 stars)

**Backlog Component** - Add PO acceptance:
- "Accept" button (PO only)
- "Reject" button with reason input (PO only)
- Show acceptance status badges

**Board Component** - Verify task restrictions:
- Developers can only move their own tasks
- Self-assignment only

### 8. Reporting Service Integration

**Consume Sprint Events** from Kafka:
- Listen to `scrum.sprint` topic
- Store metrics in reporting database:
  - Velocity trends over time
  - Sprint success rate
  - Average team mood
  - Burndown data (when implemented)

**Create Reporting Endpoints**:
- `GET /api/reporting/velocity/{projectId}` - Velocity chart data
- `GET /api/reporting/sprint-metrics/{projectId}` - Sprint health metrics
- `GET /api/reporting/team-mood/{teamId}` - Team morale trends

---

## 🔵 VERIFICATION & TESTING

### 9. End-to-End Testing Scenarios

**Scenario 1: Full Sprint Lifecycle (Happy Path)**
1. Login as SM → Create sprint
2. Login as PO → Add backlog items
3. Login as SM → Start sprint
4. Login as DEV → Self-assign tasks, move to IN_PROGRESS
5. Login as DEV → Complete tasks, move items to DONE
6. Login as PO → Accept completed items
7. Login as SM → End sprint (verify velocity calculated)
8. Login as SM → Create retrospective

**Scenario 2: Sprint Scope Protection**
1. Login as SM → Create and start sprint
2. Login as PO → Try to add item → Should FAIL with error
3. Login as DEV → Try to remove item → Should FAIL with error

**Scenario 3: Permission Enforcement**
1. Login as PO → Try to create sprint → Should FAIL (403)
2. Login as PO → Try to start sprint → Should FAIL (403)
3. Login as DEV → Try to create retrospective → Should FAIL (403)
4. Login as DEV → Try to assign task to another dev → Should FAIL

**Scenario 4: Sprint Cancellation**
1. Login as SM → Create sprint, add items
2. Login as SM → Start sprint
3. Login as SM → Cancel sprint
4. Verify all items returned to BACKLOG status

### 10. API Documentation

**Update Swagger/OpenAPI docs**:
- Retrospective endpoints documented
- Sprint cancel endpoint documented
- Permission requirements clear
- Example requests/responses

**Create Postman Collection**:
- All sprint management endpoints
- All retrospective endpoints
- Include auth tokens
- Organize by role (SM, PO, DEV)

---

## 📋 QUICK COMMAND CHECKLIST

### On Service Restart:
```bash
# 1. Rebuild services
cd /home/unknown/Desktop/Proekt
./rebuild-services.sh

# 2. Verify services healthy
docker compose ps

# 3. Check migrations
docker exec scrum-core-db psql -U postgres -d scrum_core_db -c "\dt"

# 4. Test authentication
curl -X POST http://team.local/api/identity/auth/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"email":"sm123@example.com","password":"admin123"}'

# 5. Test sprint creation (use token from step 4)
curl -X POST http://team.local/api/scrum/sprints \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"projectId":1,"teamId":1,"name":"Test Sprint","goal":"Test","startDate":"2025-01-20","endDate":"2025-02-02","lengthWeeks":2}'
```

---

## 📝 KNOWN ISSUES TO INVESTIGATE

1. **Flyway Auto-Run Issue**:
   - Migrations weren't running automatically on previous attempts
   - Had to run manually via `docker exec`
   - Check if fixed after rebuild
   - Location: `application.yml` vs `application.properties` conflict?

2. **JWT Signature Verification**:
   - Was failing with "Valid JWT, Invalid Signature"
   - Fixed by enforcing HS256 in both services
   - Verify new tokens sign correctly after rebuild

3. **Password Encoding**:
   - BCrypt $2a$ vs $2b$ format issue
   - V1 migration has correct $2a$ format
   - Verify PasswordEncoder uses BCryptPasswordEncoder (not delegating)

4. **Team/Project Access Control**:
   - Some endpoints manually check project access
   - Others rely on JWT projectIds claim
   - Verify consistency across all endpoints

---

## 💾 FILES TO REVIEW IN DETAIL

### Backend - Sprint Management
- `SprintController.java` - Verify cancel endpoint, permissions
- `SprintService.java` - Verify cancelSprint(), endSprint() velocity calc
- `SprintRetrospective.java` - New entity, verify schema
- `RetrospectiveController.java` - New controller, verify permissions
- `V3__add_sprint_retrospective.sql` - New migration, needs to run

### Backend - Task Management (From Previous Session)
- `TaskController.java` - Should restrict to DEVELOPER only
- `TaskService.java` - Should enforce self-assignment
- Verify these changes were actually saved

### Backend - Backlog Management (From Previous Session)
- `BacklogController.java` - SM should NOT be able to create items
- `BacklogService.java` - Should have acceptBacklogItem() and rejectBacklogItem()
- Verify PO acceptance workflow works

### Backend - Impediment Management (From Previous Session)
- `ImpedimentController.java` - Verify exists and has correct endpoints
- `ImpedimentService.java` - Verify business logic
- Who can create impediments? Who can resolve? (SM only for resolve?)

### Frontend - To Be Updated
- `sprint.component.ts` - Add cancel button, show velocity
- `backlog.component.ts` - Add PO accept/reject buttons
- `board.component.ts` - Verify task restrictions enforced
- `retrospective.component.ts` - CREATE THIS (doesn't exist yet)

---

## 🎯 PRIORITY ORDER FOR NEXT SESSION

**MUST DO (in order)**:
1. Rebuild services (`./rebuild-services.sh`)
2. Verify V3 migration ran
3. Test SM can create/start/end/cancel sprints
4. Test SM can create retrospectives
5. Verify JWT tokens still work with HS256

**SHOULD DO**:
6. Test task self-assignment (DEV only)
7. Test PO acceptance workflow
8. Review all permission changes from SCRUM_ALIGNMENT_IMPLEMENTATION.md
9. Verify impediment management works

**NICE TO HAVE**:
10. Implement burndown tracking
11. Implement daily standup
12. Update Angular frontend
13. Reporting service integration

---

## 📄 REFERENCE DOCUMENTS CREATED

These files have important context:
- `SCRUM_MASTER_SPRINT_MANAGEMENT.md` - Complete sprint management guide
- `SCRUM_ALIGNMENT_IMPLEMENTATION.md` - Original Scrum alignment plan
- `JWT_FIX.md` - JWT HS256 implementation details
- `AUTH_FIX_SUMMARY.md` - Authentication troubleshooting guide
- `QUICK_START_AUTH_FIX.md` - Quick auth fix guide

---

## ⚠️ IMPORTANT NOTES

1. **All code changes are in source** - NOT deployed yet, need rebuild
2. **V3 migration won't run** until scrum-core-service JAR is rebuilt
3. **JWT tokens are HS256** - verify secret matches in all services
4. **Database is live** - V1 and V2 migrations already applied
5. **Services are running** - but with OLD code (before today's changes)

---

## 🚀 PASTE THIS TO CLAUDE IN NEXT SESSION:

```
I need to continue implementing Scrum Master sprint management functionality.

Context:
- JWT authentication is working (HS256 enforced)
- Database migrations V1 and V2 are applied
- Services are running but need rebuild with new code

Completed (code written, NOT deployed):
- Sprint creation restricted to SCRUM_MASTER only
- Sprint cancel functionality added
- Sprint velocity calculation fixed in endSprint()
- Sprint retrospective feature (full CRUD with entity, DTOs, service, controller)
- V3 migration created for retrospective tables

Next Steps:
1. Rebuild services to deploy changes: ./rebuild-services.sh
2. Verify V3 migration runs
3. Test sprint lifecycle (create → start → end → retrospective)
4. Test sprint cancel functionality
5. Review SCRUM_ALIGNMENT_IMPLEMENTATION.md to verify all Phase 1 & 2 items

Key files modified:
- SprintController.java - added cancel endpoint
- SprintService.java - added cancelSprint(), fixed velocity
- Created: SprintRetrospective.java, RetrospectiveController.java, RetrospectiveService.java
- Created: V3__add_sprint_retrospective.sql

See TODO_NEXT_SESSION.md for complete task list.
```
