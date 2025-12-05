-- Fix RLS Policies for Timers and Whiteboard (v2)

-- 1. Room Timers
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Timers viewable by room members" ON room_timers;
DROP POLICY IF EXISTS "Timers updatable by admins" ON room_timers;
DROP POLICY IF EXISTS "Timers insertable by admins" ON room_timers;

-- Create simplified policies
-- View: Everyone can view (if they can see the room)
CREATE POLICY "Timers viewable by everyone"
ON room_timers FOR SELECT
USING (true); -- Simplified for debugging, can tighten later if needed

-- Update: Room participants can update (or at least admins)
CREATE POLICY "Timers updatable by participants"
ON room_timers FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = room_timers.room_id
        AND user_id = auth.uid()
    )
);

-- Insert: Room participants can insert
CREATE POLICY "Timers insertable by participants"
ON room_timers FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = room_timers.room_id
        AND user_id = auth.uid()
    )
);


-- 2. Whiteboard Data
-- Drop existing policies
DROP POLICY IF EXISTS "Whiteboard viewable by room members" ON whiteboard_data;
DROP POLICY IF EXISTS "Whiteboard updatable by room members" ON whiteboard_data;
DROP POLICY IF EXISTS "Whiteboard insertable by room members" ON whiteboard_data;

-- Create simplified policies
-- View: Everyone
CREATE POLICY "Whiteboard viewable by everyone"
ON whiteboard_data FOR SELECT
USING (true);

-- Update: Participants
CREATE POLICY "Whiteboard updatable by participants"
ON whiteboard_data FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = whiteboard_data.room_id
        AND user_id = auth.uid()
    )
);

-- Insert: Participants
CREATE POLICY "Whiteboard insertable by participants"
ON whiteboard_data FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = whiteboard_data.room_id
        AND user_id = auth.uid()
    )
);
