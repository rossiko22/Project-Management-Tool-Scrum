# Scrum Enforcement Implementation Plan

## Phase 1: CRITICAL FIXES (✅ COMPLETED)

### 1.1 Developer Approval System
- ✅ Created `BacklogItemApproval` entity with composite primary key
- ✅ Created `BacklogItemApprovalRepository` with query methods
- ✅ Created `ApprovalService` with approval workflow logic
- ✅ Created `ApprovalController` with REST endpoints
- ✅ Added `PENDING_APPROVAL` status to `ProductBacklogItem.ItemStatus`
- ✅ Modified `SprintService.addItemToSprint()` to trigger approval workflow
- ✅ Updated `SprintController` endpoint to accept developer IDs
- ✅ Created database migration V4 for approvals table

### 1.2 Sprint End Logic Fix
- ✅ Modified `SprintService.endSprint()` to:
  - Return unfinished items to `BACKLOG` status
  - Remove unfinished items from `sprint_backlog_items` table
  - Only keep completed items in sprint history

### 1.3 Permission Fixes
- ✅ Restricted `BacklogController.createBacklogItem()` to Product Owner only
- ✅ Restricted `SprintController.addItemToSprint()` to Product Owner only
- ✅ Restricted `SprintController.removeItemFromSprint()` to Product Owner only

### 1.4 Sprint Start Validations
- ✅ Added validation: Sprint must have a Sprint Goal
- ✅ Added validation: Sprint must have at least one approved item
- ✅ Added validation: All items must be in `SPRINT_READY` status

### 1.5 Notifications
- ✅ Added new notification types to `NotificationType` enum:
  - `BACKLOG_ITEM_APPROVAL_REQUEST`
  - `BACKLOG_ITEM_APPROVED`
  - `BACKLOG_ITEM_REJECTED`
  - `BACKLOG_ITEM_READY_FOR_SPRINT`
  - `ITEM_MOVED_TO_REVIEW`
  - `ITEM_RETURNED_TO_BACKLOG`

### 1.6 Database Migrations
- ✅ Created V4: Add backlog_item_approvals table
- ✅ Created V5: Document PENDING_APPROVAL status

---

## Phase 2: INTEGRATION TASKS (TO BE IMPLEMENTED)

### 2.1 Notification Service Integration
**Priority: HIGH**
**Estimated Effort: 2-3 hours**

#### Current State
- Notification entity exists in collaboration-service
- New notification types added to enum
- ApprovalService has TODO comments for notification integration

#### Implementation Steps

1. **Create or locate NotificationService client in scrum-core-service**
   ```java
   @Service
   public class NotificationServiceClient {
       @Value("${collaboration.service.url}")
       private String collaborationServiceUrl;

       private final RestTemplate restTemplate;

       public void sendNotification(Long recipientId, NotificationType type, Map<String, Object> payload) {
           // HTTP POST to collaboration-service/notifications
       }
   }
   ```

2. **Integrate in ApprovalService**
   - Line 61: Implement `sendApprovalRequest(developerId, backlogItemId, sprintId, title)`
   - Line 92: Implement `notifyApprovalGiven(backlogItemId, sprintId, developerId, approved)`
   - Line 124: Implement `notifyApprovalGiven(backlogItemId, sprintId, developerId, rejected)`
   - Line 160: Implement `notifyItemApprovedForSprint(backlogItemId, sprintId)`
   - Line 180: Implement `notifyItemRejectedForSprint(backlogItemId, sprintId)`

3. **Add notification on sprint end for returned items**
   - In `SprintService.endSprint()` after line 171
   - Notify team members when items are returned to backlog

4. **Add notification when task moves to REVIEW**
   - In `TaskService.updateTaskStatus()` when status changes to `REVIEW`
   - Notify Product Owner for review

### 2.2 Project Context Validation
**Priority: MEDIUM**
**Estimated Effort: 1-2 hours**

#### Implementation Steps

1. **Add foreign key constraint to database**
   Create migration V6:
   ```sql
   ALTER TABLE product_backlog_items
   ADD CONSTRAINT fk_backlog_project
       FOREIGN KEY (project_id)
       REFERENCES projects(id)
       ON DELETE CASCADE;
   ```

2. **Add @NotNull validation to CreateBacklogItemRequest**
   ```java
   @NotNull(message = "Project ID is required")
   private Long projectId;
   ```

3. **Validate project ownership in BacklogService**
   ```java
   // In createBacklogItem() - verify user has access to project
   ```

### 2.3 Sprint Cancellation Cleanup
**Priority: MEDIUM**
**Estimated Effort: 1 hour**

#### Current State
- `SprintService.cancelSprint()` returns items to backlog
- But doesn't clean up pending approvals

#### Implementation Steps

1. **Modify `SprintService.cancelSprint()`**
   Add after line 217:
   ```java
   // Cancel all pending approvals for this sprint
   approvalService.cancelApprovalsForSprint(id);
   ```

### 2.4 Frontend State Management
**Priority: HIGH**
**Estimated Effort: 4-6 hours**

#### Implementation Steps

1. **Update Backlog Component**
   - Only show backlog when project is selected
   - Add "Request Approval" button for Product Owner
   - Show approval status badges on each item
   - Display assigned developers and their approval status

2. **Create Developer Approvals View**
   - List all pending approval requests
   - Show item details (title, story points, acceptance criteria)
   - Approve/Reject buttons
   - Rejection reason form

3. **Update Sprint Planning View**
   - Show only SPRINT_READY items in sprint backlog
   - Indicate PENDING_APPROVAL items differently
   - Prevent sprint start if items not approved

4. **Add Notifications Panel**
   - Display approval requests to developers
   - Show approval status to Product Owner
   - Link to pending approval actions

### 2.5 Additional Validations
**Priority: LOW**
**Estimated Effort: 1 hour**

#### Implementation Steps

1. **Validate developer belongs to project team**
   In `ApprovalService.requestApprovals()`:
   ```java
   for (Long developerId : developerIds) {
       // Verify developer is assigned to project
       // Verify developer has DEVELOPER role
   }
   ```

2. **Prevent duplicate approval requests**
   Already implemented in `ApprovalService.requestApprovals()` line 49

3. **Validate item belongs to same project as sprint**
   In `SprintService.addItemToSprint()`:
   ```java
   if (!item.getProjectId().equals(sprint.getProjectId())) {
       throw new RuntimeException("Backlog item and sprint must belong to same project");
   }
   ```

---

## Phase 3: TESTING & DOCUMENTATION (TO BE IMPLEMENTED)

### 3.1 Unit Tests
**Priority: HIGH**
**Estimated Effort: 4-6 hours**

#### Files to Create

1. `ApprovalServiceTest.java`
   - Test approval request creation
   - Test approve/reject flows
   - Test automatic sprint addition after all approvals
   - Test rejection handling

2. `SprintServiceTest.java`
   - Test sprint start validations
   - Test sprint end with unfinished items
   - Test sprint scope protection

3. `BacklogControllerTest.java`
   - Test permission restrictions
   - Test Product Owner-only access

### 3.2 Integration Tests
**Priority: MEDIUM**
**Estimated Effort: 3-4 hours**

#### Test Scenarios

1. **Full Approval Workflow**
   - PO requests approval → Developers approve → Item added to sprint → Sprint starts → Sprint ends

2. **Rejection Scenario**
   - PO requests approval → Developer rejects → Item returns to backlog

3. **Partial Approval**
   - PO requests approval → Some approve, one rejects → Item returns to backlog

### 3.3 API Documentation
**Priority: LOW**
**Estimated Effort: 1-2 hours**

#### Update Swagger/OpenAPI

1. Document new approval endpoints
2. Document updated sprint planning flow
3. Add request/response examples
4. Document error scenarios

### 3.4 User Documentation
**Priority: LOW**
**Estimated Effort: 2-3 hours**

#### Create Documentation

1. **Scrum Workflow Guide**
   - Sprint planning process with approvals
   - Developer approval responsibilities
   - Sprint lifecycle rules

2. **API Integration Guide**
   - How to integrate with approval workflow
   - Notification handling
   - Error handling best practices

---

## Phase 4: OPTIMIZATION (FUTURE)

### 4.1 Performance Optimizations
- Add caching for approval status checks
- Batch notification sending
- Optimize queries with JPA projections

### 4.2 Advanced Features
- Configurable approval thresholds (e.g., require 2 out of 3 approvals)
- Approval delegation (senior dev approves on behalf of team)
- Sprint commitment velocity warnings
- Automatic rollover of unfinished items to next sprint

---

## Implementation Priority Order

1. ✅ **Phase 1: Critical Fixes** (COMPLETED)
2. **Phase 2.1: Notification Service Integration** (HIGH priority)
3. **Phase 2.4: Frontend State Management** (HIGH priority)
4. **Phase 3.1: Unit Tests** (HIGH priority)
5. **Phase 2.3: Sprint Cancellation Cleanup** (MEDIUM priority)
6. **Phase 2.2: Project Context Validation** (MEDIUM priority)
7. **Phase 3.2: Integration Tests** (MEDIUM priority)
8. **Phase 2.5: Additional Validations** (LOW priority)
9. **Phase 3.3 & 3.4: Documentation** (LOW priority)
10. **Phase 4: Optimization** (FUTURE)

---

## Files Modified/Created

### Created Files
- ✅ `entity/BacklogItemApproval.java`
- ✅ `repository/BacklogItemApprovalRepository.java`
- ✅ `service/ApprovalService.java`
- ✅ `controller/ApprovalController.java`
- ✅ `dto/ApprovalRequestDto.java`
- ✅ `dto/ApprovalResponseDto.java`
- ✅ `dto/BacklogItemApprovalDto.java`
- ✅ `dto/AddItemToSprintRequest.java`
- ✅ `migration/V4__add_backlog_item_approvals.sql`
- ✅ `migration/V5__add_pending_approval_status.sql`
- ✅ `SCRUM_ENFORCEMENT_IMPLEMENTATION_PLAN.md` (this file)

### Modified Files
- ✅ `entity/ProductBacklogItem.java` - Added PENDING_APPROVAL status
- ✅ `service/SprintService.java` - Modified addItemToSprint, endSprint, startSprint
- ✅ `controller/SprintController.java` - Updated permissions and endpoint signature
- ✅ `controller/BacklogController.java` - Restricted to Product Owner only
- ✅ `collaboration-service/entities/notification.entity.ts` - Added notification types

---

## Testing the Implementation

### Manual Test Scenarios

1. **Test Developer Approval Workflow**
   ```bash
   # 1. Create backlog item as PO
   POST /backlog

   # 2. Request approval for sprint
   POST /sprints/{sprintId}/items
   Body: { "backlogItemId": 1, "assignedDeveloperIds": [2, 3] }

   # 3. Developer approves
   POST /approvals/1/sprint/1/approve

   # 4. Check approval status
   GET /approvals/item/1/sprint/1

   # 5. Try to start sprint (should fail if not all approved)
   POST /sprints/1/start
   ```

2. **Test Sprint End Logic**
   ```bash
   # 1. Start sprint with items
   POST /sprints/1/start

   # 2. Mark some items as DONE
   PUT /tasks/{taskId}/status?status=DONE

   # 3. End sprint
   POST /sprints/1/end

   # 4. Verify unfinished items returned to backlog
   GET /backlog/project/{projectId}

   # 5. Verify sprint backlog only contains completed items
   GET /sprints/1/backlog
   ```

3. **Test Permission Restrictions**
   ```bash
   # 1. Try to create backlog item as Developer (should fail 403)
   POST /backlog
   Headers: { Authorization: "Bearer {developer-token}" }

   # 2. Try to add item to sprint as Developer (should fail 403)
   POST /sprints/1/items
   Headers: { Authorization: "Bearer {developer-token}" }
   ```

---

## Rollback Plan

If issues arise, rollback in this order:

1. **Revert database migrations**
   ```sql
   -- Rollback V5
   -- (No schema changes, just comments)

   -- Rollback V4
   DROP TABLE IF EXISTS backlog_item_approvals CASCADE;
   ```

2. **Revert code changes**
   ```bash
   git revert <commit-hash>
   ```

3. **Restore previous endpoint behavior**
   - Restore old addItemToSprint endpoint
   - Restore old endSprint logic
   - Restore old permission annotations

---

## Success Criteria

Phase 1 is complete when:
- ✅ Developers must approve items before sprint starts
- ✅ Sprint cannot start without goal and approved items
- ✅ Unfinished items return to backlog on sprint end
- ✅ Only Product Owner can modify backlog and plan sprints
- ✅ All database migrations run successfully
- ✅ No regressions in existing functionality

Phase 2 is complete when:
- Notifications are fully integrated
- Frontend displays approval workflow
- All validations are in place

Phase 3 is complete when:
- Test coverage > 80%
- Documentation is complete
- API is fully documented

---

## Notes

- All changes maintain backward compatibility where possible
- The approval workflow is **mandatory** - there's no way to bypass it
- This enforces true Scrum methodology: "Commit → Lock → Execute → Review → Reset"
- Database migrations are idempotent and can be run multiple times safely
