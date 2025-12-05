-- Create Room Timers Schema

-- 1. Create table
CREATE TABLE IF NOT EXISTS room_timers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER NOT NULL DEFAULT 1500, -- 25 minutes in seconds
    status TEXT NOT NULL DEFAULT 'stopped', -- 'running', 'paused', 'stopped'
    type TEXT NOT NULL DEFAULT 'work', -- 'work', 'short_break', 'long_break'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    UNIQUE(room_id)
);

-- 2. Enable RLS
ALTER TABLE room_timers ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- View: Everyone in the room
DROP POLICY IF EXISTS "Timers viewable by room members" ON room_timers;
CREATE POLICY "Timers viewable by room members"
ON room_timers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = room_timers.room_id
        AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE id = room_timers.room_id
        AND type = 'public'
    )
);

-- Update: Only Admins/Mods (and Owner)
DROP POLICY IF EXISTS "Timers updatable by admins" ON room_timers;
CREATE POLICY "Timers updatable by admins"
ON room_timers FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE id = room_timers.room_id
        AND (owner_id = auth.uid() OR created_by = auth.uid())
    )
    OR
    EXISTS (
        SELECT 1 FROM room_participants 
        WHERE room_id = room_timers.room_id 
        AND user_id = auth.uid() 
        AND role IN ('host', 'moderator')
    )
    OR
    EXISTS (
        SELECT 1 FROM room_participants rp
        JOIN room_roles rr ON rp.role_id = rr.id
        WHERE rp.room_id = room_timers.room_id 
        AND rp.user_id = auth.uid() 
        AND (rr.permissions->>'manage_server')::boolean = true
    )
);

-- Insert: Only Admins/Mods
DROP POLICY IF EXISTS "Timers insertable by admins" ON room_timers;
CREATE POLICY "Timers insertable by admins"
ON room_timers FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE id = room_timers.room_id
        AND (owner_id = auth.uid() OR created_by = auth.uid())
    )
    OR
    EXISTS (
        SELECT 1 FROM room_participants 
        WHERE room_id = room_timers.room_id 
        AND user_id = auth.uid() 
        AND role IN ('host', 'moderator')
    )
);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE room_timers;
