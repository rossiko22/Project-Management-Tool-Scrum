# Notification System Testing Guide

## Complete Approval Workflow with Notifications

### Prerequisites
1. All services running:
   - Scrum Core Service (port 8081)
   - Collaboration Service (port 3000)
   - Frontend Team Portal (port 4200)
   - PostgreSQL databases

2. Users configured:
   - **Developer**: bob.johnson@company.com / password123 (user ID: 4)
   - **Product Owner**: jane.smith@company.com / password123 (user ID: 2)

3. At least one PLANNED sprint exists in the system

---

## Testing Flow

### Step 1: Developer Creates Item for Approval

**As Developer (Bob Johnson)**:

1. **Login**
   - Go to http://localhost:4200
   - Email: `bob.johnson@company.com`
   - Password: `password123`

2. **Navigate to Backlog**
   - Click "Backlog" in the navigation menu

3. **Create New Item**
   - Click "Create Item" button
   - Fill in the form:
     - **Type**: Bug (or Technical Task)
     - **Title**: "Test Approval Workflow"
     - **Description**: "Testing notifications"
     - **Story Points**: 3
     - **Priority**: Medium
     - **Status**: Select "SPRINT_READY" ⚠️ **This triggers the notification!**
     - **Select Sprint**: Choose a PLANNED sprint from dropdown

4. **Save the Item**
   - Click "Create" button
   - Item status should change to "PENDING_APPROVAL"
   - **Backend logs should show**:
     ```
     🔔 Starting approval workflow for backlog item X ('Test Approval Workflow')
        Requester ID: 4, Team members to notify: [2]
     ✅ Created approval request for Product Owner 2 for backlog item X in sprint Y
     ✅ Notification sent to user 2 (type: BACKLOG_ITEM_APPROVAL_REQUEST)
     🔔 Notification sent to Product Owner 2
     ```

5. **Logout**
   - Click logout button

---

### Step 2: Product Owner Receives Notification

**As Product Owner (Jane Smith)**:

1. **Login**
   - Email: `jane.smith@company.com`
   - Password: `password123`

2. **Check Notification Bell** 🔔
   - Look at top-right corner of navbar
   - Should see **notification bell with unread badge** (red number)

3. **Click Notification Bell**
   - Dropdown should open showing:
     ```
     🔔 Approval Request
     Developer requested approval: Please review 'Test Approval Workflow' for sprint 'Sprint X'
     [time ago]
     ```

4. **Go to Backlog Page**
   - Click "Backlog" in navigation
   - Find the item "Test Approval Workflow"
   - Status should be "PENDING_APPROVAL"
   - Should see **Approve** and **Reject** buttons

---

### Step 3: Product Owner Approves Item

**Still as Product Owner**:

1. **Approve the Item**
   - Click the **"Approve"** button on the pending item
   - Item status should change to "IN_SPRINT"
   - **Backend logs should show**:
     ```
     🔔 Sending approval notification to developer 4 for item 'Test Approval Workflow'
     ✅ Notification sent to user 4 (type: BACKLOG_ITEM_APPROVED)
     ```

2. **Logout**
   - Click logout button

---

### Step 4: Developer Receives Approval Notification

**As Developer (Bob Johnson)**:

1. **Login Again**
   - Email: `bob.johnson@company.com`
   - Password: `password123`

2. **Check Notification Bell** 🔔
   - Should see **notification bell with unread badge**

3. **Click Notification Bell**
   - Should see:
     ```
     ✅ Item Approved
     Product Owner approved your item 'Test Approval Workflow' for sprint 'Sprint X'
     [time ago]
     ```

4. **Click the Notification**
   - Notification should be marked as read
   - Badge number should decrease

---

## Alternative Flow: Product Owner Rejects Item

### Step 3 Alternative: Product Owner Rejects

**As Product Owner**:

1. **Reject the Item**
   - Click the **"Reject"** button
   - Modal opens asking for rejection reason
   - Enter: "Needs more details about the bug reproduction steps"
   - Click "Reject Item"

2. **Item Status Changes**
   - Status changes back to "BACKLOG"
   - **Backend logs should show**:
     ```
     🔔 Sending rejection notification to developer 4 for item 'Test Approval Workflow'
     ✅ Notification sent to user 4 (type: BACKLOG_ITEM_REJECTED)
     ```

3. **Logout**

### Step 4 Alternative: Developer Receives Rejection

**As Developer**:

1. **Login and Check Notifications**
   - Should see notification bell with unread badge

2. **Click Notification Bell**
   - Should see:
     ```
     ❌ Item Rejected
     Product Owner rejected your item 'Test Approval Workflow' for sprint 'Sprint X'.
     Reason: Needs more details about the bug reproduction steps
     [time ago]
     ```

---

## Troubleshooting

### No Notification Appears

1. **Check Browser Console** (F12)
   - Look for errors in the Network tab
   - Check if GET /notifications request succeeds

2. **Check Backend Logs**
   - Scrum Core Service: Look for 🔔 emoji in logs
   - Collaboration Service: Check for POST /notifications requests

3. **Verify Database**
   ```bash
   PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db \
     -c "SELECT id, recipient_id, type, payload->>'title' as title, read FROM notifications ORDER BY created_at DESC LIMIT 5;"
   ```

### Notification Not Showing Correct User

1. **Check User IDs**
   - Developer (Bob): ID should be 4
   - Product Owner (Jane): ID should be 2

2. **Verify Team Membership**
   ```bash
   PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d identity_db \
     -c "SELECT * FROM team_members WHERE team_id = 1;"
   ```

### Item Stays in BACKLOG Instead of PENDING_APPROVAL

1. **Check Sprint Selection**
   - Must select a PLANNED sprint
   - Sprint dropdown must have a value

2. **Check Backend Logs**
   - Look for "Starting approval workflow" message
   - If missing, approval wasn't triggered

---

## Expected Notification Types

| Event | Sender | Receiver | Type | Icon | Title |
|-------|--------|----------|------|------|-------|
| Developer creates SPRINT_READY item | Developer | Product Owner | `BACKLOG_ITEM_APPROVAL_REQUEST` | 🔔 | Approval Request |
| PO approves item | Product Owner | Developer | `BACKLOG_ITEM_APPROVED` | ✅ | Item Approved |
| PO rejects item | Product Owner | Developer | `BACKLOG_ITEM_REJECTED` | ❌ | Item Rejected |

---

## Database Verification

### Check Notifications
```bash
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -c "
SELECT
  id,
  recipient_id,
  type,
  payload->>'title' as title,
  payload->>'message' as message,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
"
```

### Check Approvals
```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d scrum_db -c "
SELECT
  id,
  backlog_item_id,
  sprint_id,
  developer_id as approver_id,
  status,
  requested_at,
  responded_at
FROM backlog_item_approvals
ORDER BY requested_at DESC
LIMIT 5;
"
```

---

## Success Criteria

✅ **Complete Flow Success** when:
1. Developer sees item status change to "PENDING_APPROVAL" ✓
2. Product Owner sees notification bell with badge ✓
3. Product Owner sees approval request notification ✓
4. Product Owner can approve/reject from backlog page ✓
5. Developer sees notification bell with badge ✓
6. Developer sees approval/rejection notification ✓
7. Item status updates correctly (IN_SPRINT or BACKLOG) ✓

---

## Quick Test Commands

### Create Test Notification Directly
```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": 2,
    "type": "BACKLOG_ITEM_APPROVAL_REQUEST",
    "payload": {
      "title": "Quick Test",
      "message": "Testing notification system",
      "entityType": "BACKLOG_ITEM",
      "entityId": 999
    }
  }'
```

### Clear All Notifications for Testing
```bash
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db \
  -c "DELETE FROM notifications WHERE recipient_id IN (2, 4);"
```
