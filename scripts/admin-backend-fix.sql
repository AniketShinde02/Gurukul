-- 🛡️ ADMIN BACKEND FIX SCRIPT
-- Run this in Supabase SQL Editor to enable all admin dashboard functionalities

-- 1. Create 'banned_users' table if not exists
CREATE TABLE IF NOT EXISTS banned_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    banned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create 'system_logs' table for the Logs Tab
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
    source TEXT NOT NULL, -- e.g., 'auth', 'database', 'livekit'
    message TEXT NOT NULL,
    details JSONB, -- extra data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast log filtering
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

--------------------------------------------------------------------------------
-- 3. RLS POLICIES (Granting Admin Powers)
--------------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- PROFILES TABLE ---
-- Allow admins to UPDATE any profile (Ban, Make Admin, etc.)
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (is_admin());

-- --- STUDY ROOMS TABLE ---
-- Allow admins to DELETE any room
DROP POLICY IF EXISTS "Admins can delete any room" ON study_rooms;
CREATE POLICY "Admins can delete any room"
ON study_rooms FOR DELETE
USING (is_admin());

-- --- BANNED USERS TABLE ---
-- Allow admins to INSERT/select/delete
DROP POLICY IF EXISTS "Admins can manage banned users" ON banned_users;
CREATE POLICY "Admins can manage banned users"
ON banned_users FOR ALL
USING (is_admin());

-- --- SYSTEM LOGS TABLE ---
-- Allow admins to VIEW logs
DROP POLICY IF EXISTS "Admins can view system logs" ON system_logs;
CREATE POLICY "Admins can view system logs"
ON system_logs FOR SELECT
USING (is_admin());

-- Allow anyone (server side) to insert logs (service role)
DROP POLICY IF EXISTS "Admins can insert system logs" ON system_logs;
CREATE POLICY "Admins can insert system logs"
ON system_logs FOR INSERT
WITH CHECK (is_admin());

--------------------------------------------------------------------------------
-- 4. LOGGING TRIGGERS (Auto-log actions)
--------------------------------------------------------------------------------

-- Log when a user is banned
CREATE OR REPLACE FUNCTION log_user_ban()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_logs (level, source, message, details)
  VALUES (
    'warning', 
    'admin_action', 
    'User banned: ' || NEW.user_id,
    jsonb_build_object('banned_by', NEW.banned_by, 'reason', NEW.reason)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_ban ON banned_users;
CREATE TRIGGER on_user_ban
AFTER INSERT ON banned_users
FOR EACH ROW EXECUTE FUNCTION log_user_ban();

-- Log when a room is created (just for fun stats)
CREATE OR REPLACE FUNCTION log_room_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_logs (level, source, message, details)
  VALUES (
    'info', 
    'system', 
    'New room created: ' || NEW.name,
    jsonb_build_object('room_id', NEW.id, 'created_by', NEW.created_by)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_room_create ON study_rooms;
CREATE TRIGGER on_room_create
AFTER INSERT ON study_rooms
FOR EACH ROW EXECUTE FUNCTION log_room_creation();

-- 5. Fix Verification Requests RLS (Just in case)
DROP POLICY IF EXISTS "Admins can update verification requests" ON verification_requests;
CREATE POLICY "Admins can update verification requests"
ON verification_requests FOR UPDATE
USING (is_admin());

--------------------------------------------------------------------------------
-- DONE!
--------------------------------------------------------------------------------
