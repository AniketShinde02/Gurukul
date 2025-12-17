-- ============================================
-- PRODUCTION-GRADE DATABASE INDEXES
-- ULTRA MINIMAL & 100% SAFE VERSION
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- PROFILES TABLE
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online) WHERE is_online = true;

-- STUDY_ROOMS TABLE
CREATE INDEX IF NOT EXISTS idx_study_rooms_created_by ON study_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_study_rooms_created_at ON study_rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_rooms_name_trgm ON study_rooms USING gin(name gin_trgm_ops);

-- ROOM_PARTICIPANTS TABLE
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_user ON room_participants(room_id, user_id);

-- ANALYZE
ANALYZE profiles;
ANALYZE study_rooms;
ANALYZE room_participants;

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ Indexes created successfully!';
END $$;
