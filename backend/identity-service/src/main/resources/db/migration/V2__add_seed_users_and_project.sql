-- Add seed users for different roles (password: admin123 for all)
-- Using $2a$ BCrypt format for Spring Security compatibility
INSERT INTO users (email, password_hash, first_name, last_name, status)
VALUES
    ('po123@example.com', '$2a$10$yGRlnkVfSm2N39r01a0Aoe9GG1IzHkbu./KapYGc5UuNTSZIFhoHm', 'John', 'Product Owner', 'ACTIVE'),
    ('sm123@example.com', '$2a$10$yGRlnkVfSm2N39r01a0Aoe9GG1IzHkbu./KapYGc5UuNTSZIFhoHm', 'Jane', 'Scrum Master', 'ACTIVE'),
    ('dev123@example.com', '$2a$10$yGRlnkVfSm2N39r01a0Aoe9GG1IzHkbu./KapYGc5UuNTSZIFhoHm', 'Mike', 'Developer', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Assign roles to new users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'po123@example.com' AND r.name = 'PRODUCT_OWNER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'sm123@example.com' AND r.name = 'SCRUM_MASTER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'dev123@example.com' AND r.name = 'DEVELOPER'
ON CONFLICT DO NOTHING;

-- Create a seed team
INSERT INTO teams (name, description, product_owner_id, scrum_master_id)
SELECT 'Development Team Alpha', 'Main development team',
       (SELECT id FROM users WHERE email = 'po123@example.com'),
       (SELECT id FROM users WHERE email = 'sm123@example.com')
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Development Team Alpha');

-- Add developer to team
INSERT INTO team_members (team_id, user_id, role)
SELECT t.id, u.id, 'DEVELOPER'
FROM teams t, users u
WHERE t.name = 'Development Team Alpha' AND u.email = 'dev123@example.com'
ON CONFLICT DO NOTHING;

-- Create a seed project
INSERT INTO projects (name, description, team_id, status, default_sprint_length, timezone, created_by)
SELECT 'Scrum Management System', 'Main project for scrum management',
       t.id, 'ACTIVE', 2, 'UTC',
       (SELECT id FROM users WHERE email = 'admin@example.com')
FROM teams t
WHERE t.name = 'Development Team Alpha'
AND NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Scrum Management System');

-- Update team with project_id
UPDATE teams
SET project_id = (SELECT id FROM projects WHERE name = 'Scrum Management System')
WHERE name = 'Development Team Alpha' AND project_id IS NULL;
