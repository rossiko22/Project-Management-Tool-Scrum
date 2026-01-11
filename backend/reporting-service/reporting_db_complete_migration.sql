-- ============================================================
-- REPORTING SERVICE DATABASE MIGRATION
-- Database: reporting_db
-- Port: 5435 (as configured in your .env)
-- ============================================================
-- Run this script with:
-- PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db -f reporting_db_complete_migration.sql
-- ============================================================

-- Drop existing tables if they exist (WARNING: This will delete all data)
DROP TABLE IF EXISTS cumulative_flow CASCADE;
DROP TABLE IF EXISTS daily_burndown CASCADE;
DROP TABLE IF EXISTS team_velocity CASCADE;
DROP TABLE IF EXISTS sprint_metrics CASCADE;

-- ============================================================
-- Sprint Metrics Table
-- Tracks overall metrics for each sprint
-- ============================================================
CREATE TABLE sprint_metrics (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    committed_points INT DEFAULT 0,
    completed_points INT DEFAULT 0,
    carried_over_points INT DEFAULT 0,
    velocity INT DEFAULT 0,
    stories_completed INT DEFAULT 0,
    stories_carried_over INT DEFAULT 0,
    bugs_fixed INT DEFAULT 0,
    impediments_count INT DEFAULT 0,
    sprint_start DATE,
    sprint_end DATE,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sprint_metrics_sprint UNIQUE (sprint_id)
);

CREATE INDEX idx_sprint_metrics_sprint ON sprint_metrics(sprint_id);
CREATE INDEX idx_sprint_metrics_project ON sprint_metrics(project_id);
CREATE INDEX idx_sprint_metrics_team ON sprint_metrics(team_id);

COMMENT ON TABLE sprint_metrics IS 'Overall metrics calculated for each sprint';
COMMENT ON COLUMN sprint_metrics.velocity IS 'Story points completed in the sprint';

-- ============================================================
-- Daily Burndown Table
-- Tracks daily progress within a sprint
-- ============================================================
CREATE TABLE daily_burndown (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    date DATE NOT NULL,
    remaining_points INT NOT NULL DEFAULT 0,
    ideal_remaining_points INT NOT NULL DEFAULT 0,
    completed_points INT DEFAULT 0,
    added_points INT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_burndown_sprint_date UNIQUE(sprint_id, date)
);

CREATE INDEX idx_burndown_sprint ON daily_burndown(sprint_id, date);
CREATE INDEX idx_burndown_date ON daily_burndown(date);

COMMENT ON TABLE daily_burndown IS 'Daily burndown chart data for sprints';
COMMENT ON COLUMN daily_burndown.ideal_remaining_points IS 'Ideal burndown line value';
COMMENT ON COLUMN daily_burndown.added_points IS 'Story points added as scope changes';

-- ============================================================
-- Cumulative Flow Diagram Table
-- Tracks story status counts over time
-- ============================================================
CREATE TABLE cumulative_flow (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    date DATE NOT NULL,
    to_do_count INT DEFAULT 0,
    in_progress_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    done_count INT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cfd_sprint_date UNIQUE(sprint_id, date)
);

CREATE INDEX idx_cfd_sprint ON cumulative_flow(sprint_id, date);
CREATE INDEX idx_cfd_date ON cumulative_flow(date);

COMMENT ON TABLE cumulative_flow IS 'Cumulative flow diagram data showing work item status distribution';

-- ============================================================
-- Team Velocity Table
-- Tracks velocity history for teams across sprints
-- ============================================================
CREATE TABLE team_velocity (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    sprint_id BIGINT NOT NULL,
    sprint_name VARCHAR(255) NOT NULL,
    velocity INT NOT NULL DEFAULT 0,
    sprint_end_date DATE NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_velocity_sprint UNIQUE (sprint_id)
);

CREATE INDEX idx_velocity_team ON team_velocity(team_id, sprint_end_date DESC);
CREATE INDEX idx_velocity_sprint ON team_velocity(sprint_id);

COMMENT ON TABLE team_velocity IS 'Historical velocity data for teams';
COMMENT ON COLUMN team_velocity.velocity IS 'Story points completed in the sprint';

-- ============================================================
-- INSERT SAMPLE TEST DATA (Optional - Remove if not needed)
-- ============================================================

-- Sample velocity data for team 1 (last 10 sprints)
INSERT INTO team_velocity (team_id, sprint_id, sprint_name, velocity, sprint_end_date) VALUES
(1, 1, 'Sprint 1', 32, CURRENT_DATE - INTERVAL '140 days'),
(1, 2, 'Sprint 2', 28, CURRENT_DATE - INTERVAL '126 days'),
(1, 3, 'Sprint 3', 31, CURRENT_DATE - INTERVAL '112 days'),
(1, 4, 'Sprint 4', 25, CURRENT_DATE - INTERVAL '98 days'),
(1, 5, 'Sprint 5', 30, CURRENT_DATE - INTERVAL '84 days'),
(1, 6, 'Sprint 6', 26, CURRENT_DATE - INTERVAL '70 days'),
(1, 7, 'Sprint 7', 29, CURRENT_DATE - INTERVAL '56 days'),
(1, 8, 'Sprint 8', 23, CURRENT_DATE - INTERVAL '42 days'),
(1, 9, 'Sprint 9', 27, CURRENT_DATE - INTERVAL '28 days'),
(1, 10, 'Sprint 10', 30, CURRENT_DATE - INTERVAL '14 days')
ON CONFLICT (sprint_id) DO NOTHING;

-- Sample burndown data for sprint 1 (last 2 weeks)
DO $$
DECLARE
  v_sprint_id INT := 1;
  committed_points INT := 50;
  start_date DATE := CURRENT_DATE - INTERVAL '14 days';
  day INT;
  ideal_remaining FLOAT;
  actual_remaining FLOAT;
  completed FLOAT;
  progress FLOAT;
BEGIN
  -- Delete existing data for this sprint
  DELETE FROM daily_burndown WHERE sprint_id = v_sprint_id;

  -- Generate burndown for each day
  FOR day IN 0..14 LOOP
    ideal_remaining := GREATEST(0, committed_points * (1 - day::FLOAT / 14));

    -- Simulate realistic progress (slightly behind ideal at first, catching up later)
    IF day < 7 THEN
      progress := day::FLOAT / 16; -- Slower at start
    ELSE
      progress := LEAST(1, (day::FLOAT / 14) + 0.05); -- Catching up
    END IF;

    actual_remaining := GREATEST(0, committed_points * (1 - progress));
    completed := committed_points - actual_remaining;

    INSERT INTO daily_burndown (sprint_id, date, remaining_points, ideal_remaining_points, completed_points, added_points)
    VALUES (
      v_sprint_id,
      start_date + (day || ' days')::INTERVAL,
      ROUND(actual_remaining),
      ROUND(ideal_remaining),
      ROUND(completed),
      0
    );
  END LOOP;

  RAISE NOTICE 'Sample burndown data created for sprint %', v_sprint_id;
END $$;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT 'Velocity Records: ' || COUNT(*) FROM team_velocity;
SELECT 'Burndown Records: ' || COUNT(*) FROM daily_burndown;

-- Display sample data
SELECT * FROM team_velocity ORDER BY sprint_end_date DESC LIMIT 5;
SELECT * FROM daily_burndown WHERE sprint_id = 1 ORDER BY date LIMIT 5;

RAISE NOTICE '✓ Reporting database migration completed successfully';
