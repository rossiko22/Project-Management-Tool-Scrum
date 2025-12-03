-- Collaboration Service Database Schema (collaboration_db)
-- Based on architecture.md specifications

-- Comments table
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- BACKLOG_ITEM, TASK, SPRINT, IMPEDIMENT
    entity_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id BIGINT REFERENCES comments(id), -- for threaded comments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- soft delete
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_author ON comments(author_id);

-- Activity logs table
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL, -- CREATED, UPDATED, DELETED, STATUS_CHANGED, etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    project_id BIGINT,
    details JSONB, -- old/new values, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_project ON activity_logs(project_id, timestamp DESC);
CREATE INDEX idx_activity_actor ON activity_logs(actor_id);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);

-- Notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- TASK_ASSIGNED, COMMENT_ADDED, SPRINT_STARTED, etc.
    payload JSONB NOT NULL, -- {taskId: 123, taskTitle: "...", assignedBy: "..."}
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
