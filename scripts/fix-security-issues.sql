-- ============================================
-- FIX SUPABASE SECURITY ISSUES - SIMPLIFIED
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENABLE RLS ON verification_requirements
-- ============================================

ALTER TABLE verification_requirements ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read (no writes)
CREATE POLICY "Authenticated users can read" ON verification_requirements
FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can write (backend only)
CREATE POLICY "Service role can write" ON verification_requirements
FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 2. FIX FUNCTION SEARCH PATHS
-- ============================================

ALTER FUNCTION search_dm_messages SET search_path = public, pg_temp;
ALTER FUNCTION is_admin SET search_path = public, pg_temp;
ALTER FUNCTION log_user_ban SET search_path = public, pg_temp;
ALTER FUNCTION handle_new_user SET search_path = public, pg_temp;
ALTER FUNCTION is_adult SET search_path = public, pg_temp;
ALTER FUNCTION verify_user_age SET search_path = public, pg_temp;
ALTER FUNCTION log_age_verification SET search_path = public, pg_temp;
ALTER FUNCTION search_room_messages SET search_path = public, pg_temp;
ALTER FUNCTION match_and_update_atomic SET search_path = public, pg_temp;
ALTER FUNCTION handle_user_delete SET search_path = public, pg_temp;
ALTER FUNCTION calculate_age SET search_path = public, pg_temp;
ALTER FUNCTION log_room_creation SET search_path = public, pg_temp;
ALTER FUNCTION auto_ban_user SET search_path = public, pg_temp;
ALTER FUNCTION is_user_banned SET search_path = public, pg_temp;
ALTER FUNCTION expire_old_bans SET search_path = public, pg_temp;
ALTER FUNCTION check_user_verification SET search_path = public, pg_temp;
ALTER FUNCTION update_verification_status SET search_path = public, pg_temp;

-- ============================================
-- VERIFY FIXES
-- ============================================

-- Check RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'verification_requirements';

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ Security fixes applied!';
    RAISE NOTICE '⚠️  Remember to:';
    RAISE NOTICE '   1. Enable leaked password protection in Auth settings';
    RAISE NOTICE '   2. Review Security Definer views manually';
    RAISE NOTICE '   3. Re-run Supabase linter to verify';
END $$;
