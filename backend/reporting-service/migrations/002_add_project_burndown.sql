-- Migration to add project_burndown table for tracking backlog reduction across sprints

CREATE TABLE IF NOT EXISTS project_burndown (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    sprint_id BIGINT NOT NULL,
    sprint_number INT NOT NULL,
    sprint_name VARCHAR(255) NOT NULL,
    backlog_items_remaining INT NOT NULL,
    items_completed_in_sprint INT NOT NULL DEFAULT 0,
    completed_points INT NOT NULL DEFAULT 0,
    sprint_end_date DATE NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_sprint_burndown UNIQUE(sprint_id)
);

-- Create index for faster project lookups
CREATE INDEX idx_project_burndown_project_id ON project_burndown(project_id);

-- Create index for faster sprint number ordering
CREATE INDEX idx_project_burndown_sprint_number ON project_burndown(project_id, sprint_number);

-- Add comments for documentation
COMMENT ON TABLE project_burndown IS 'Tracks backlog reduction across sprints for project-level burndown charts';
COMMENT ON COLUMN project_burndown.backlog_items_remaining IS 'Total backlog items remaining after sprint completion';
COMMENT ON COLUMN project_burndown.items_completed_in_sprint IS 'Number of items completed in this sprint';
COMMENT ON COLUMN project_burndown.sprint_number IS 'Sequential sprint number for this project (1, 2, 3, ...)';
