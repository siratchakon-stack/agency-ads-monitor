-- Add notes column to ad_accounts
ALTER TABLE ad_accounts ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Add weekly_report_enabled to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_user_id TEXT;
