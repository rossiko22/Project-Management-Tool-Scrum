-- Scrum Core Service Database Schema (scrum_core_db)
-- Consolidated migration including all features:
-- - Base schema for sprints, backlog items, tasks, impediments
-- - Product Owner acceptance workflow
-- - Developer approval workflow for sprint planning
-- - Sprint retrospectives
-- - Sprint board column tracking
-- - Project context validation

-- ============================================
-- Product Backlog Items table
-- ============================================
CREATE TABLE product_backlog_items (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- STORY, EPIC, BUG, TECHNICAL_TASK
    story_points INT,
    priority INT DEFAULT 0,
    position INT NOT NULL, -- for drag-and-drop ordering
    status VARCHAR(50) DEFAULT 'BACKLOG', -- BACKLOG, PENDING_APPROVAL, SPRINT_READY, IN_SPRINT, DONE, PENDING_ACCEPTANCE, ACCEPTED, REJECTED
    acceptance_criteria TEXT,
    created_by BIGINT NOT NULL,
    created_by_role VARCHAR(50), -- To track if PO or Dev created it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- PO acceptance/rejection fields (from V2)
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,

    -- Sprint board column tracking (from V7)
    board_column VARCHAR(20),

    -- Board column constraint
    CONSTRAINT chk_board_column
        CHECK (board_column IS NULL OR board_column IN ('TO_DO', 'IN_PROGRESS', 'REVIEW', 'DONE'))
);

CREATE INDEX idx_backlog_project ON product_backlog_items(project_id);
CREATE INDEX idx_backlog_project_id ON product_backlog_items(project_id);
CREATE INDEX idx_backlog_status ON product_backlog_items(status);
CREATE INDEX idx_backlog_position ON product_backlog_items(project_id, position);
CREATE INDEX idx_backlog_board_column ON product_backlog_items(board_column)
    WHERE board_column IS NOT NULL;

-- Column documentation
COMMENT ON COLUMN product_backlog_items.project_id IS
    'References projects.id in identity-service database.
     Product backlog items must always belong to a specific project.
     Application-level validation ensures backlog items and sprints belong to same project.';

COMMENT ON COLUMN product_backlog_items.status IS
    'Backlog item status lifecycle:
     BACKLOG: Item is in product backlog, not yet proposed for any sprint
     PENDING_APPROVAL: PO has requested developer approval for sprint inclusion (awaiting developer responses)
     SPRINT_READY: All assigned developers have approved, item can be added to sprint
     IN_SPRINT: Sprint is active, item is being worked on
     DONE: Development complete, awaiting PO acceptance
     PENDING_ACCEPTANCE: Deprecated - use DONE instead
     ACCEPTED: PO has accepted the completed work
     REJECTED: PO has rejected the completed work, may return to backlog';

COMMENT ON COLUMN product_backlog_items.board_column IS
    'Sprint board column position. Used only when item status is IN_SPRINT.
     Columns: TO_DO (initial), IN_PROGRESS (being worked on), REVIEW (code review), DONE (completed).
     Items can move between columns in any order per Scrum flexibility.
     When sprint starts, all items are set to TO_DO.
     When item reaches DONE column, status changes to DONE for Product Owner review.';

-- ============================================
-- Sprints table
-- ============================================
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
CREATE INDEX idx_sprint_project_id ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);

COMMENT ON COLUMN sprints.project_id IS
    'References projects.id in identity-service database.
     Sprints must always belong to a specific project.
     Application-level validation ensures all sprint items belong to same project.';

-- ============================================
-- Sprint Backlog Items (junction)
-- ============================================
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

-- ============================================
-- Developer Approval Workflow (from V4)
-- ============================================
CREATE TABLE backlog_item_approvals (
    backlog_item_id BIGINT NOT NULL,
    sprint_id BIGINT NOT NULL,
    developer_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,

    PRIMARY KEY (backlog_item_id, sprint_id, developer_id),

    CONSTRAINT fk_approval_backlog_item
        FOREIGN KEY (backlog_item_id)
        REFERENCES product_backlog_items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_approval_sprint
        FOREIGN KEY (sprint_id)
        REFERENCES sprints(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_approval_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_approval_developer ON backlog_item_approvals(developer_id, status);
CREATE INDEX idx_approval_sprint ON backlog_item_approvals(sprint_id);
CREATE INDEX idx_approval_item_sprint ON backlog_item_approvals(backlog_item_id, sprint_id);

COMMENT ON TABLE backlog_item_approvals IS
    'Developer approval workflow for sprint planning. Enforces Scrum methodology by requiring all assigned developers to approve backlog items before they can be added to a sprint.';

COMMENT ON COLUMN backlog_item_approvals.status IS
    'Approval status: PENDING (awaiting response), APPROVED (developer committed), REJECTED (developer declined with reason)';

COMMENT ON COLUMN backlog_item_approvals.rejection_reason IS
    'Required when status is REJECTED. Developer must provide reason for declining the backlog item.';

-- ============================================
-- Tasks table
-- ============================================
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

-- ============================================
-- Impediments table
-- ============================================
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

-- ============================================
-- Scrum Events table
-- ============================================
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

-- ============================================
-- Definition of Done table
-- ============================================
CREATE TABLE definition_of_done (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    criteria JSONB NOT NULL, -- [{id: 1, text: "Code reviewed"}, {id: 2, text: "Tests passed"}]
    version INT DEFAULT 1,
    effective_from DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dod_project ON definition_of_done(project_id);

-- ============================================
-- Sprint Retrospective Tables (from V3)
-- ============================================
CREATE TABLE sprint_retrospectives (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    facilitated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_notes TEXT,
    team_mood INTEGER CHECK (team_mood >= 1 AND team_mood <= 5),
    CONSTRAINT unique_sprint_retrospective UNIQUE (sprint_id)
);

CREATE INDEX idx_retrospectives_sprint ON sprint_retrospectives(sprint_id);

-- What went well items
CREATE TABLE retrospective_went_well (
    retrospective_id BIGINT NOT NULL REFERENCES sprint_retrospectives(id) ON DELETE CASCADE,
    item TEXT NOT NULL
);

CREATE INDEX idx_went_well_retrospective ON retrospective_went_well(retrospective_id);

-- Improvement items
CREATE TABLE retrospective_improvements (
    retrospective_id BIGINT NOT NULL REFERENCES sprint_retrospectives(id) ON DELETE CASCADE,
    item TEXT NOT NULL
);

CREATE INDEX idx_improvements_retrospective ON retrospective_improvements(retrospective_id);

-- Action items for next sprint
CREATE TABLE retrospective_action_items (
    retrospective_id BIGINT NOT NULL REFERENCES sprint_retrospectives(id) ON DELETE CASCADE,
    item TEXT NOT NULL
);

CREATE INDEX idx_action_items_retrospective ON retrospective_action_items(retrospective_id);
