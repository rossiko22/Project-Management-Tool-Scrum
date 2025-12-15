-- Sprint Retrospective Tables

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
