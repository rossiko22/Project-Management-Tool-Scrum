-- Scrum Core Service Database Schema (scrum_core_db)
-- Based on architecture.md specifications

-- Product Backlog Items table
CREATE TABLE product_backlog_items (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- STORY, EPIC, BUG, TECHNICAL_TASK
    story_points INT,
    priority INT DEFAULT 0,
    position INT NOT NULL, -- for drag-and-drop ordering
    status VARCHAR(50) DEFAULT 'BACKLOG', -- BACKLOG, SPRINT_READY, IN_SPRINT, DONE
    acceptance_criteria TEXT,
    created_by BIGINT NOT NULL,
    created_by_role VARCHAR(50), -- To track if PO or Dev created it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backlog_project ON product_backlog_items(project_id);
CREATE INDEX idx_backlog_status ON product_backlog_items(status);
CREATE INDEX idx_backlog_position ON product_backlog_items(project_id, position);

-- Sprints table
CREATE TABLE sprints (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date DATE,
    end_date DATE,
    length_weeks INT, -- 1-4
    status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, ACTIVE, COMPLETED, CANCELLED
    team_capacity INT, -- total story points team can handle
    created_by BIGINT NOT NULL, -- should be Scrum Master
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);

-- Sprint Backlog Items (junction)
CREATE TABLE sprint_backlog_items (
    sprint_id BIGINT REFERENCES sprints(id) ON DELETE CASCADE,
    backlog_item_id BIGINT REFERENCES product_backlog_items(id) ON DELETE CASCADE,
    committed_points INT,
    actual_points INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    PRIMARY KEY (sprint_id, backlog_item_id)
);

CREATE INDEX idx_sprint_backlog_sprint ON sprint_backlog_items(sprint_id);

-- Tasks table
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    backlog_item_id BIGINT REFERENCES product_backlog_items(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assignee_id BIGINT, -- references users.id (cross-service reference)
    status VARCHAR(50) DEFAULT 'TO_DO', -- TO_DO, IN_PROGRESS, REVIEW, DONE
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_tasks_backlog_item ON tasks(backlog_item_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Impediments table
CREATE TABLE impediments (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT REFERENCES sprints(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED
    reported_by BIGINT NOT NULL,
    assigned_to BIGINT, -- usually Scrum Master
    resolved_by BIGINT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution TEXT
);

CREATE INDEX idx_impediments_sprint ON impediments(sprint_id);
CREATE INDEX idx_impediments_status ON impediments(status);

-- Scrum Events table
CREATE TABLE scrum_events (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT REFERENCES sprints(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- PLANNING, DAILY, REVIEW, RETROSPECTIVE
    notes TEXT,
    outcomes JSONB, -- flexible JSON for different event types
    action_items JSONB, -- array of action items from retros
    facilitator_id BIGINT NOT NULL,
    attendees BIGINT[], -- array of user IDs
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scrum_events_sprint ON scrum_events(sprint_id);
CREATE INDEX idx_scrum_events_type ON scrum_events(type);

-- Definition of Done table
CREATE TABLE definition_of_done (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    criteria JSONB NOT NULL, -- [{id: 1, text: "Code reviewed"}, {id: 2, text: "Tests passed"}]
    version INT DEFAULT 1,
    effective_from DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dod_project ON definition_of_done(project_id);
