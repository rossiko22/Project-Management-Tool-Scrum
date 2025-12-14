-- Add PO acceptance/rejection fields to product_backlog_items table
ALTER TABLE product_backlog_items
ADD COLUMN reviewed_by BIGINT,
ADD COLUMN reviewed_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT;

-- Add new statuses to support PO acceptance workflow
-- Note: The enum is already in code, this is just documentation
-- New statuses: PENDING_ACCEPTANCE, ACCEPTED, REJECTED
