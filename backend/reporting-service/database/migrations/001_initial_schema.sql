-- Reporting Service Database Schema (reporting_db)
-- Based on architecture.md specifications

-- Sprint Metrics table
CREATE TABLE sprint_metrics (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    committed_points INT,
    completed_points INT,
    carried_over_points INT,
    velocity INT,
    stories_completed INT,
    stories_carried_over INT,
    bugs_fixed INT,
    impediments_count INT,
    sprint_start DATE,
    sprint_end DATE,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sprint_metrics_sprint ON sprint_metrics(sprint_id);
CREATE INDEX idx_sprint_metrics_project ON sprint_metrics(project_id);
CREATE INDEX idx_sprint_metrics_team ON sprint_metrics(team_id);

-- Daily Burndown table
CREATE TABLE daily_burndown (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    date DATE NOT NULL,
    remaining_points INT NOT NULL,
    ideal_remaining_points INT NOT NULL, -- for ideal line
    completed_points INT,
    added_points INT, -- scope changes
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sprint_id, date)
);

CREATE INDEX idx_burndown_sprint ON daily_burndown(sprint_id, date);

-- Cumulative Flow table
CREATE TABLE cumulative_flow (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    date DATE NOT NULL,
    to_do_count INT DEFAULT 0,
    in_progress_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    done_count INT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sprint_id, date)
);

CREATE INDEX idx_cfd_sprint ON cumulative_flow(sprint_id, date);

-- Team Velocity table
CREATE TABLE team_velocity (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    sprint_id BIGINT NOT NULL,
    velocity INT NOT NULL,
    sprint_end_date DATE NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_velocity_team ON team_velocity(team_id, sprint_end_date DESC);
