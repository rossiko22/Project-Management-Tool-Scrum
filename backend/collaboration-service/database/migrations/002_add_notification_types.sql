-- Add new notification types for Scrum events
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'DAILY_SCRUM_INVITATION';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'RETROSPECTIVE_ITEM_ADDED';
