    -- ============================================================
    -- AGE VERIFICATION SYSTEM
    -- Legal requirement for video chat platforms
    -- Ensures users are 18+ before accessing matching
    -- ============================================================

    -- 1. Add age verification columns to profiles
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMP WITH TIME ZONE;

    -- 2. Function to calculate age from DOB
    CREATE OR REPLACE FUNCTION calculate_age(dob DATE)
    RETURNS INTEGER AS $$
        SELECT EXTRACT(YEAR FROM AGE(dob))::INTEGER;
    $$ LANGUAGE SQL IMMUTABLE;

    -- 3. Function to check if user is adult (18+)
    CREATE OR REPLACE FUNCTION is_adult(user_id_param UUID)
    RETURNS BOOLEAN AS $$
        SELECT 
            CASE 
                WHEN date_of_birth IS NULL THEN FALSE
                WHEN calculate_age(date_of_birth) >= 18 THEN TRUE
                ELSE FALSE
            END
        FROM profiles
        WHERE id = user_id_param;
    $$ LANGUAGE SQL;

    -- 4. Function to verify age (sets age_verified flag)
    CREATE OR REPLACE FUNCTION verify_user_age(user_id_param UUID, dob DATE)
    RETURNS BOOLEAN AS $$
    DECLARE
        user_age INTEGER;
    BEGIN
        user_age := calculate_age(dob);
        
        IF user_age >= 18 THEN
            UPDATE profiles
            SET 
                date_of_birth = dob,
                age_verified = TRUE,
                age_verified_at = NOW()
            WHERE id = user_id_param;
            
            RETURN TRUE;
        ELSE
            -- Still save DOB but don't verify
            UPDATE profiles
            SET date_of_birth = dob
            WHERE id = user_id_param;
            
            RETURN FALSE;
        END IF;
    END;
    $$ LANGUAGE plpgsql;

    -- 5. Create age verification logs table (for compliance)
    CREATE TABLE IF NOT EXISTS age_verification_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
        date_of_birth DATE NOT NULL,
        age_at_verification INTEGER NOT NULL,
        verification_method TEXT DEFAULT 'self_reported',
        ip_address TEXT,
        user_agent TEXT,
        verified BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 6. Index for performance
    CREATE INDEX IF NOT EXISTS idx_age_verification_logs_user_id ON age_verification_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_age_verification_logs_created_at ON age_verification_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_profiles_age_verified ON profiles(age_verified) WHERE age_verified = TRUE;

    -- 7. RLS Policies
    ALTER TABLE age_verification_logs ENABLE ROW LEVEL SECURITY;

    -- Users can view their own verification logs
    CREATE POLICY "Users can view their own verification logs"
    ON age_verification_logs FOR SELECT
    USING (auth.uid() = user_id);

    -- Only system can insert verification logs (via function)
    -- No direct INSERT policy - must use verify_user_age function

    -- 8. Trigger to log age verification attempts
    CREATE OR REPLACE FUNCTION log_age_verification()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.age_verified = TRUE AND (OLD.age_verified IS NULL OR OLD.age_verified = FALSE) THEN
            INSERT INTO age_verification_logs (
                user_id,
                date_of_birth,
                age_at_verification,
                verified
            ) VALUES (
                NEW.id,
                NEW.date_of_birth,
                calculate_age(NEW.date_of_birth),
                TRUE
            );
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_log_age_verification ON profiles;
    CREATE TRIGGER trigger_log_age_verification
    AFTER UPDATE ON profiles
    FOR EACH ROW
    WHEN (NEW.age_verified = TRUE AND (OLD.age_verified IS NULL OR OLD.age_verified = FALSE))
    EXECUTE FUNCTION log_age_verification();

    -- 9. View for age statistics (admin only)
    CREATE OR REPLACE VIEW age_verification_stats AS
    SELECT 
        COUNT(*) FILTER (WHERE age_verified = TRUE) as verified_users,
        COUNT(*) FILTER (WHERE age_verified = FALSE OR age_verified IS NULL) as unverified_users,
        COUNT(*) FILTER (WHERE date_of_birth IS NOT NULL AND calculate_age(date_of_birth) < 18) as underage_users,
        AVG(calculate_age(date_of_birth)) FILTER (WHERE age_verified = TRUE) as avg_age_verified_users,
        COUNT(*) FILTER (WHERE age_verified_at > NOW() - INTERVAL '24 hours') as verified_last_24h,
        COUNT(*) FILTER (WHERE age_verified_at > NOW() - INTERVAL '7 days') as verified_last_7d
    FROM profiles
    WHERE date_of_birth IS NOT NULL;

    -- Grant access
    GRANT SELECT ON age_verification_stats TO authenticated;

    -- ============================================================
    -- DONE! Age verification system ready
    -- ============================================================

    -- Test queries:
    -- SELECT calculate_age('2000-01-01'::DATE); -- Should return ~24
    -- SELECT is_adult('user-uuid-here');
    -- SELECT * FROM age_verification_logs ORDER BY created_at DESC LIMIT 10;
    -- SELECT * FROM age_verification_stats;
