# Approval Workflow Changes

## Summary
The approval workflow has been updated to require approval from **all team members** (developers + product owner) **except the person who added the item** to the sprint.

---

## What Changed

### Backend Changes:

1. **ApprovalService.java**:
   - `requestApprovals()` now requires ALL team member IDs and requester ID
   - Creates approval records for everyone EXCEPT the requester
   - Removed notification event publishing (no more Kafka events sent to collaboration service)
   - When ANY team member rejects: item is removed from sprint and returned to BACKLOG status

2. **SprintService.java**:
   - `addItemToSprint()` now accepts team member IDs and requester ID
   - Triggers approval workflow instead of directly adding items
   - Item gets `PENDING_APPROVAL` status

3. **SprintController.java**:
   - `/sprints/{sprintId}/items` endpoint now accessible by ALL roles (PO, SM, DEV)
   - Auto-captures requester ID from JWT token

4. **ApprovalController.java**:
   - ALL endpoints updated to allow PO, SM, and DEV roles
   - `/approvals/{backlogItemId}/sprint/{sprintId}/approve` - Approve endpoint
   - `/approvals/{backlogItemId}/sprint/{sprintId}/reject` - Reject endpoint
   - `/approvals/my-pending` - Get pending approvals for current user

---

## How It Works Now

### Adding Item to Sprint:
```
1. Team member (PO/SM/DEV) adds backlog item to sprint
   ↓
2. System creates approval requests for ALL other team members
   ↓
3. Item status → PENDING_APPROVAL
   ↓
4. Item appears in backlog with "Pending Approval" badge
```

### Approval Process:
```
For each team member (except requester):
  - See item in backlog with status: PENDING_APPROVAL
  - Two buttons appear next to the item:
    ✓ Green "Approve" button
    ✗ Red "Reject" button
```

### Approval Outcomes:
```
✓ ALL team members approve → Item added to sprint → Status: SPRINT_READY
✗ ANY team member rejects → Item removed from sprint → Status: BACKLOG
```

---

## API Endpoints

### Add Item to Sprint (Triggers Approval):
```http
POST /api/scrum/sprints/{sprintId}/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "backlogItemId": 1,
  "assignedDeveloperIds": [2, 3, 4]  // ALL team member IDs (PO + devs)
}
```

### Approve Item:
```http
POST /api/scrum/approvals/{backlogItemId}/sprint/{sprintId}/approve
Authorization: Bearer {token}
```

### Reject Item:
```http
POST /api/scrum/approvals/{backlogItemId}/sprint/{sprintId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "rejectionReason": "Not ready for this sprint"
}
```

### Get My Pending Approvals:
```http
GET /api/scrum/approvals/my-pending
Authorization: Bearer {token}
```

---

## Frontend Requirements

The frontend needs to:

1. **Show PENDING_APPROVAL items in backlog** with a distinct badge/indicator

2. **For each pending approval item**, check if current user needs to approve:
   - Call `/api/scrum/approvals/{backlogItemId}/sprint/{sprintId}` to get approval status
   - If current user has PENDING status → Show Approve/Reject buttons
   - If current user already APPROVED → Show "✓ You approved" badge
   - If current user REJECTED → Show "✗ You rejected" badge
   - If current user is the requester → Show "Waiting for team approval"

3. **Approve button** (Green):
   - Calls `POST /api/scrum/approvals/{backlogItemId}/sprint/{sprintId}/approve`
   - On success: Update UI to show approval status

4. **Reject button** (Red):
   - Shows modal/prompt for rejection reason
   - Calls `POST /api/scrum/approvals/{backlogItemId}/sprint/{sprintId}/reject`
   - On success: Item returns to regular BACKLOG status

---

## Database Changes

No schema changes required! Using existing `backlog_item_approvals` table:
- `developer_id` field now stores ANY team member ID (not just developers)
- Status values: `PENDING`, `APPROVED`, `REJECTED`

---

## Testing the Workflow

### Test Scenario:
1. Login as Product Owner (po123@example.com)
2. Add backlog item to sprint → Triggers approval workflow
3. Login as Developer (dev123@example.com)
4. Check `/api/scrum/approvals/my-pending` → Should see pending approval
5. Approve the item
6. Login as Scrum Master (sm123@example.com)
7. Approve the item
8. Item should now be in sprint with SPRINT_READY status

### Test Rejection:
1. Login as any team member
2. Reject item with reason
3. Item should return to BACKLOG status
4. All approval records deleted

---

## Key Benefits

✓ Democratic team decision-making
✓ Everyone has visibility and input
✓ No notifications spam (approval happens in-app)
✓ Clear rejection workflow
✓ Requester excluded from approval (avoids self-approval)
