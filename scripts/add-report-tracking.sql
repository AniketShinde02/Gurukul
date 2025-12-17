-- ============================================
-- ADD REPORT TRACKING FEATURES
-- ============================================

-- Add tracking columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_ip TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_ip ON reports(user_ip);

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ Report tracking columns added!';
    RAISE NOTICE '📊 New columns: user_ip, user_agent, device_info, screenshot_url';
END $$;
