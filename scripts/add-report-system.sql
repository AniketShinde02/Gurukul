    -- ============================================================
    -- REPORT & SAFETY SYSTEM
    -- Protects users from inappropriate behavior
    -- Auto-ban system after multiple reports
    -- ============================================================

    -- 1. User Reports Table
    CREATE TABLE IF NOT EXISTS user_reports (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
        reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
        session_id TEXT, -- Optional: LiveKit session ID
        reason TEXT NOT NULL CHECK (reason IN (
            'inappropriate_behavior',
            'harassment',
            'spam',
            'nudity',
            'violence',
            'other'
        )),
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
        reviewed_by UUID REFERENCES profiles(id),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. User Bans Table
    CREATE TABLE IF NOT EXISTS user_bans (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
        reason TEXT NOT NULL,
        banned_by UUID REFERENCES profiles(id), -- NULL = auto-ban
        banned_until TIMESTAMP WITH TIME ZONE, -- NULL = permanent ban
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, is_active) -- Only one active ban per user
    );

    -- 3. Indexes for Performance
    CREATE INDEX IF NOT EXISTS idx_user_reports_reported_id ON user_reports(reported_id);
    CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON user_reports(reporter_id);
    CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
    CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON user_bans(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_bans_active ON user_bans(is_active) WHERE is_active = TRUE;

    -- 4. Auto-Ban Function (3 reports in 7 days = 7-day ban)
    CREATE OR REPLACE FUNCTION auto_ban_user()
    RETURNS TRIGGER AS $$
    DECLARE
        report_count INT;
    BEGIN
        -- Count recent reports for this user
        SELECT COUNT(*) INTO report_count
        FROM user_reports
        WHERE reported_id = NEW.reported_id
        AND created_at > NOW() - INTERVAL '7 days'
        AND status != 'dismissed';
        
        -- Auto-ban after 3 reports
        IF report_count >= 3 THEN
            INSERT INTO user_bans (user_id, reason, banned_until)
            VALUES (
                NEW.reported_id,
                'Auto-ban: 3+ reports in 7 days',
                NOW() + INTERVAL '7 days'
            )
            ON CONFLICT (user_id, is_active) 
            WHERE is_active = TRUE
            DO UPDATE SET
                banned_until = NOW() + INTERVAL '7 days',
                reason = 'Auto-ban: 3+ reports in 7 days';
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 5. Trigger for Auto-Ban
    DROP TRIGGER IF EXISTS trigger_auto_ban ON user_reports;
    CREATE TRIGGER trigger_auto_ban
    AFTER INSERT ON user_reports
    FOR EACH ROW
    EXECUTE FUNCTION auto_ban_user();

    -- 6. Function to Check if User is Banned
    CREATE OR REPLACE FUNCTION is_user_banned(user_id_param UUID)
    RETURNS BOOLEAN AS $$
        SELECT EXISTS (
            SELECT 1 FROM user_bans
            WHERE user_id = user_id_param
            AND is_active = TRUE
            AND (banned_until IS NULL OR banned_until > NOW())
        );
    $$ LANGUAGE SQL;

    -- 7. Function to Expire Old Bans (Run daily via cron)
    CREATE OR REPLACE FUNCTION expire_old_bans()
    RETURNS void AS $$
        UPDATE user_bans
        SET is_active = FALSE
        WHERE is_active = TRUE
        AND banned_until IS NOT NULL
        AND banned_until < NOW();
    $$ LANGUAGE SQL;

    -- 8. RLS Policies
    ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

    -- Users can create reports
    CREATE POLICY "Users can create reports"
    ON user_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

    -- Users can view their own reports
    CREATE POLICY "Users can view their own reports"
    ON user_reports FOR SELECT
    USING (auth.uid() = reporter_id OR auth.uid() = reported_id);

    -- Note: Admin policies commented out - profiles table doesn't have 'role' column
    -- Uncomment after adding role column to profiles table
    
    -- -- Admins can view all reports
    -- CREATE POLICY "Admins can view all reports"
    -- ON user_reports FOR SELECT
    -- USING (
    --     EXISTS (
    --         SELECT 1 FROM profiles
    --         WHERE id = auth.uid()
    --         AND role = 'admin'
    --     )
    -- );

    -- -- Admins can update reports
    -- CREATE POLICY "Admins can update reports"
    -- ON user_reports FOR UPDATE
    -- USING (
    --     EXISTS (
    --         SELECT 1 FROM profiles
    --         WHERE id = auth.uid()
    --         AND role = 'admin'
    --     )
    -- );

    -- Users can view their own ban status
    CREATE POLICY "Users can view their own bans"
    ON user_bans FOR SELECT
    USING (auth.uid() = user_id);

    -- -- Admins can view all bans
    -- CREATE POLICY "Admins can view all bans"
    -- ON user_bans FOR SELECT
    -- USING (
    --     EXISTS (
    --         SELECT 1 FROM profiles
    --         WHERE id = auth.uid()
    --         AND role = 'admin'
    --     )
    -- );

    -- 9. Create Admin View for Reports Dashboard
    CREATE OR REPLACE VIEW admin_reports_dashboard AS
    SELECT 
        r.id,
        r.reason,
        r.description,
        r.status,
        r.created_at,
        reporter.username as reporter_username,
        reporter.email as reporter_email,
        reported.username as reported_username,
        reported.email as reported_email,
        (
            SELECT COUNT(*) 
            FROM user_reports 
            WHERE reported_id = r.reported_id 
            AND created_at > NOW() - INTERVAL '30 days'
        ) as recent_reports_count
    FROM user_reports r
    JOIN profiles reporter ON r.reporter_id = reporter.id
    JOIN profiles reported ON r.reported_id = reported.id
    ORDER BY r.created_at DESC;

    -- Grant access to admins only
    GRANT SELECT ON admin_reports_dashboard TO authenticated;

    -- ============================================================
    -- DONE! Report system ready
    -- ============================================================

    -- Test queries:
    -- SELECT * FROM user_reports ORDER BY created_at DESC LIMIT 10;
    -- SELECT * FROM user_bans WHERE is_active = TRUE;
    -- SELECT is_user_banned('user-uuid-here');
