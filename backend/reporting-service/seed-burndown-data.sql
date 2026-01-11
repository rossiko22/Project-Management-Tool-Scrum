-- Seed data for project_burndown table
-- This creates realistic burndown data based on existing velocity records

-- Clear existing data
TRUNCATE project_burndown RESTART IDENTITY CASCADE;

-- Insert burndown data for project 1
-- Starting with 30 backlog items, reducing as sprints complete

INSERT INTO project_burndown (project_id, sprint_id, sprint_number, sprint_name, backlog_items_remaining, items_completed_in_sprint, completed_points, sprint_end_date) VALUES
-- Sprint 1: Started with 30 items, completed 5 items (32 points)
(1, 1, 1, 'Sprint 1', 25, 5, 32, '2025-09-06'),

-- Sprint 2: 25 items remaining, completed 3 items (20 points)
(1, 2, 2, 'Sprint 2', 22, 3, 20, '2025-09-20'),

-- Sprint 3: 22 items remaining, completed 5 items (31 points)
(1, 3, 3, 'Sprint 3', 17, 5, 31, '2025-10-04'),

-- Sprint 4: 17 items remaining, completed 3 items (20 points)
(1, 4, 4, 'Sprint 4', 14, 3, 20, '2025-10-18'),

-- Sprint 5: 14 items remaining, completed 5 items (30 points)
(1, 5, 5, 'Sprint 5', 9, 5, 30, '2025-11-01'),

-- Sprint 6: 9 items remaining, completed 4 items (26 points)
(1, 6, 6, 'Sprint 6', 5, 4, 26, '2025-11-15'),

-- Sprint 7: 5 items remaining, completed 4 items (26 points)
(1, 7, 7, 'Sprint 7', 1, 4, 26, '2025-11-29'),

-- Sprint 8: 1 item remaining, completed 4 items (23 points) - added 3 new items
(1, 8, 8, 'Sprint 8', 0, 4, 23, '2025-12-13'),

-- Sprint 9: 0 items remaining, completed 4 items (27 points) - added 4 items, completed all
(1, 9, 9, 'Sprint 9', 0, 4, 27, '2025-12-27'),

-- Sprint 10: 0 items remaining, completed 5 items (30 points) - added 5 items
(1, 10, 10, 'Sprint 10', 0, 5, 30, '2026-01-10');

-- Verify data
SELECT
    sprint_number,
    sprint_name,
    backlog_items_remaining,
    items_completed_in_sprint,
    completed_points,
    sprint_end_date
FROM project_burndown
ORDER BY sprint_number;

SELECT 'Seed data inserted successfully!' as message;
