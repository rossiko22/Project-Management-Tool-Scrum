-- Add sprint_name column to team_velocity table
ALTER TABLE team_velocity ADD COLUMN IF NOT EXISTS sprint_name VARCHAR(255);
