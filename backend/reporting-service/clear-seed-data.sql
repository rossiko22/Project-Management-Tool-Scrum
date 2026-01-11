-- Clear all seed data to start fresh with real sprint data

-- Clear project burndown data
TRUNCATE project_burndown RESTART IDENTITY CASCADE;

-- Optionally clear team velocity data (uncomment if you want to start completely fresh)
-- TRUNCATE team_velocity RESTART IDENTITY CASCADE;

-- Verify data is cleared
SELECT 'project_burndown' as table_name, COUNT(*) as record_count FROM project_burndown
UNION ALL
SELECT 'team_velocity' as table_name, COUNT(*) as record_count FROM team_velocity;

SELECT 'Data cleared successfully! Ready for real sprint testing.' as message;
