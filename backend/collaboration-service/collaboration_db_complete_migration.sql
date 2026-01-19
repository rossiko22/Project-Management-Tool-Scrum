-- ============================================================
-- COLLABORATION SERVICE DATABASE MIGRATION
-- Database: collaboration_db
-- Port: 5434
-- ============================================================
-- First, create the database if it doesn't exist:
-- PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -c "CREATE DATABASE collaboration_db;"
--
-- Then run this script with:
-- PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db -f collaboration_db_complete_migration.sql
-- ============================================================

-- Drop existing tables if they exist (WARNING: This will delete all data)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS entity_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- ============================================================
-- ENUM TYPES
-- ============================================================

-- Entity types for comments and activity logs
CREATE TYPE entity_type AS ENUM (
    'BACKLOG_ITEM',
    'TASK',
    'SPRINT',
    'IMPEDIMENT'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'TASK_ASSIGNED',
    'COMMENT_ADDED',
    'SPRINT_STARTED',
    'SPRINT_ENDED',
    'MENTION',
    'IMPEDIMENT_REPORTED',
    'IMPEDIMENT_RESOLVED',
    'BACKLOG_ITEM_APPROVAL_REQUEST',
    'BACKLOG_ITEM_APPROVED',
    'BACKLOG_ITEM_REJECTED',
    'BACKLOG_ITEM_READY_FOR_SPRINT',
    'ITEM_MOVED_TO_REVIEW',
    'ITEM_RETURNED_TO_BACKLOG',
    'DAILY_SCRUM_INVITATION',
    'RETROSPECTIVE_ITEM_ADDED'
);

-- ============================================================
-- Comments Table
-- Stores comments on various entities (backlog items, tasks, sprints, impediments)
-- ============================================================
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,
    entity_type entity_type NOT NULL,
    entity_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_parent_comment FOREIGN KEY (parent_comment_id)
        REFERENCES comments(id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_created ON comments(created_at DESC);

COMMENT ON TABLE comments IS 'Comments on backlog items, tasks, sprints, and impediments';
COMMENT ON COLUMN comments.parent_comment_id IS 'For threaded/nested comments';
COMMENT ON COLUMN comments.deleted_at IS 'Soft delete timestamp';

-- ============================================================
-- Activity Logs Table
-- Tracks all user actions for audit trail and activity feeds
-- ============================================================
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    project_id BIGINT,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_activity_actor ON activity_logs(actor_id, timestamp DESC);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_project ON activity_logs(project_id, timestamp DESC);
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_details ON activity_logs USING GIN (details);

COMMENT ON TABLE activity_logs IS 'Audit trail of all user actions';
COMMENT ON COLUMN activity_logs.action IS 'Action performed (e.g., CREATED, UPDATED, DELETED, ASSIGNED)';
COMMENT ON COLUMN activity_logs.details IS 'JSON details of the change (old/new values, etc.)';

-- ============================================================
-- Notifications Table
-- Stores user notifications for various events
-- ============================================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    type notification_type NOT NULL,
    payload JSONB NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_payload ON notifications USING GIN (payload);

COMMENT ON TABLE notifications IS 'User notifications for various system events';
COMMENT ON COLUMN notifications.payload IS 'JSON payload with notification details (entity IDs, names, etc.)';

-- ============================================================
-- INSERT SAMPLE TEST DATA (Optional - Remove if not needed)
-- ============================================================

-- Sample comments (assuming user ID 1 exists in user service)
INSERT INTO comments (author_id, entity_type, entity_id, content) VALUES
(1, 'BACKLOG_ITEM', 1, 'This user story needs more clarification on the acceptance criteria.'),
(1, 'BACKLOG_ITEM', 1, 'Updated the description based on stakeholder feedback.'),
(1, 'TASK', 1, 'Started working on this task, will have it done by EOD.'),
(1, 'SPRINT', 1, 'Great sprint planning session today! Excited to get started.'),
(1, 'IMPEDIMENT', 1, 'This is blocking our progress on the login feature.');

-- Sample nested comment (reply to first comment)
INSERT INTO comments (author_id, entity_type, entity_id, content, parent_comment_id)
SELECT 1, 'BACKLOG_ITEM', 1, 'Agreed, I''ll reach out to the product owner.', id
FROM comments WHERE content LIKE 'This user story needs more%' LIMIT 1;

-- Sample activity logs
INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, project_id, details) VALUES
(1, 'CREATED', 'BACKLOG_ITEM', 1, 1, '{"title": "User Login Feature", "type": "STORY"}'),
(1, 'UPDATED', 'BACKLOG_ITEM', 1, 1, '{"field": "status", "oldValue": "BACKLOG", "newValue": "IN_SPRINT"}'),
(1, 'ASSIGNED', 'TASK', 1, 1, '{"taskTitle": "Implement authentication", "assignedTo": "John Doe"}'),
(1, 'CREATED', 'SPRINT', 1, 1, '{"sprintName": "Sprint 1", "startDate": "2026-01-01"}'),
(1, 'COMPLETED', 'TASK', 1, 1, '{"taskTitle": "Write unit tests", "hoursSpent": 4}');

-- Sample notifications
INSERT INTO notifications (recipient_id, type, payload) VALUES
(1, 'TASK_ASSIGNED', '{"taskId": 1, "taskTitle": "Implement user authentication", "assignedBy": "Jane Smith", "projectId": 1}'),
(1, 'COMMENT_ADDED', '{"commentId": 1, "entityType": "BACKLOG_ITEM", "entityId": 1, "authorName": "John Doe", "preview": "This user story needs more..."}'),
(1, 'SPRINT_STARTED', '{"sprintId": 1, "sprintName": "Sprint 1", "startDate": "2026-01-01", "teamId": 1}'),
(1, 'BACKLOG_ITEM_APPROVAL_REQUEST', '{"itemId": 2, "itemTitle": "New Feature Request", "requestedBy": "Product Owner", "projectId": 1}');

-- Mark one notification as read
UPDATE notifications
SET read = TRUE, read_at = CURRENT_TIMESTAMP
WHERE type = 'COMMENT_ADDED';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT 'Comments: ' || COUNT(*) FROM comments;
SELECT 'Activity Logs: ' || COUNT(*) FROM activity_logs;
SELECT 'Notifications: ' || COUNT(*) FROM notifications;
SELECT 'Unread Notifications: ' || COUNT(*) FROM notifications WHERE read = FALSE;

-- Display sample data
SELECT id, entity_type, LEFT(content, 50) as content_preview, created_at
FROM comments ORDER BY created_at DESC LIMIT 5;

SELECT id, action, entity_type, timestamp
FROM activity_logs ORDER BY timestamp DESC LIMIT 5;

SELECT id, type, read, created_at
FROM notifications ORDER BY created_at DESC LIMIT 5;

-- ============================================================
-- USEFUL HELPER FUNCTIONS (Optional)
-- ============================================================

-- Function to soft delete a comment
CREATE OR REPLACE FUNCTION soft_delete_comment(comment_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE comments
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = comment_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_count(user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE recipient_id = user_id AND read = FALSE;

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE recipient_id = user_id AND read = FALSE;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Test helper functions
SELECT get_unread_count(1) as unread_notifications;

\echo '✓ Collaboration database migration completed successfully'
