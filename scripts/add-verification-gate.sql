                                -- ============================================================
                                -- VERIFICATION GATE SYSTEM
                                -- Single source of truth for user verification status
                                -- ============================================================

                                -- 1. Add verification columns to profiles (if not exists)
                                ALTER TABLE profiles 
                                ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
                                ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'none' CHECK (verification_level IN ('none', 'basic', 'full')),
                                ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

                                -- 2. Create verification requirements table (future-proof)
                                CREATE TABLE IF NOT EXISTS verification_requirements (
                                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                                    requirement_key TEXT UNIQUE NOT NULL, -- e.g., 'age_verified', 'email_verified'
                                    requirement_name TEXT NOT NULL,
                                    is_required BOOLEAN DEFAULT TRUE,
                                    required_for_level TEXT DEFAULT 'basic' CHECK (required_for_level IN ('basic', 'full')),
                                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                                );

                                -- 3. Insert default requirements
                                INSERT INTO verification_requirements (requirement_key, requirement_name, is_required, required_for_level)
                                VALUES 
                                    ('age_verified', 'Age Verification (18+)', TRUE, 'basic'),
                                    ('email_verified', 'Email Verification', TRUE, 'basic')
                                ON CONFLICT (requirement_key) DO NOTHING;

                                -- 4. Function to check if user meets all requirements
                                CREATE OR REPLACE FUNCTION check_user_verification(user_id_param UUID)
                                RETURNS TABLE(
                                    is_verified BOOLEAN,
                                    verification_level TEXT,
                                    missing_requirements TEXT[]
                                ) AS $$
                                DECLARE
                                    user_age_verified BOOLEAN;
                                    user_email_verified BOOLEAN;
                                    missing TEXT[];
                                BEGIN
                                    -- Get user verification status from PROFILES only
                                    SELECT 
                                        COALESCE(age_verified, FALSE)
                                    INTO user_age_verified
                                    FROM profiles
                                    WHERE id = user_id_param;
                                    
                                    -- Check missing requirements
                                    missing := ARRAY[]::TEXT[];
                                    
                                    IF NOT user_age_verified THEN
                                        missing := array_append(missing, 'age_verified');
                                    END IF;
                                    
                                    -- Note: Email verification check removed from DB function as it lives in auth.users
                                    -- The API route will handle email verification status checks via Supabase Auth
                                    
                                    -- Return verification status
                                    RETURN QUERY SELECT 
                                        (array_length(missing, 1) IS NULL OR array_length(missing, 1) = 0),
                                        CASE 
                                            WHEN array_length(missing, 1) IS NULL OR array_length(missing, 1) = 0 THEN 'basic'::TEXT
                                            ELSE 'none'::TEXT
                                        END,
                                        missing;
                                END;
                                $$ LANGUAGE plpgsql;

                                -- 5. Trigger to auto-update is_verified flag
                                CREATE OR REPLACE FUNCTION update_verification_status()
                                RETURNS TRIGGER AS $$
                                DECLARE
                                    verification_result RECORD;
                                BEGIN
                                    -- Check verification status
                                    SELECT * INTO verification_result
                                    FROM check_user_verification(NEW.id);
                                    
                                    -- Update is_verified and verification_level
                                    NEW.is_verified := verification_result.is_verified;
                                    NEW.verification_level := verification_result.verification_level;
                                    
                                    IF NEW.is_verified AND OLD.is_verified = FALSE THEN
                                        NEW.verified_at := NOW();
                                    END IF;
                                    
                                    RETURN NEW;
                                END;
                                $$ LANGUAGE plpgsql;

                                DROP TRIGGER IF EXISTS trigger_update_verification_status ON profiles;
                                CREATE TRIGGER trigger_update_verification_status
                                BEFORE UPDATE ON profiles
                                FOR EACH ROW
                                WHEN (
                                    NEW.age_verified IS DISTINCT FROM OLD.age_verified
                                )
                                EXECUTE FUNCTION update_verification_status();

                                -- 6. Create view for verification dashboard
                                -- Note: Email verification status comes from auth.users, not profiles
                                CREATE OR REPLACE VIEW user_verification_status AS
                                SELECT 
                                    p.id,
                                    p.username,
                                    p.email,
                                    p.is_verified,
                                    p.verification_level,
                                    p.age_verified,
                                    p.verified_at,
                                    p.created_at
                                FROM profiles p;

                                -- 7. Index for performance
                                CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified) WHERE is_verified = TRUE;
                                CREATE INDEX IF NOT EXISTS idx_profiles_verification_level ON profiles(verification_level);

                                -- ============================================================
                                -- DONE! Verification gate system ready
                                -- ============================================================

                                -- Test queries:
                                -- SELECT * FROM check_user_verification(auth.uid());
                                -- SELECT * FROM user_verification_status WHERE id = auth.uid();
                                -- SELECT * FROM verification_requirements;
