-- Check and Create Whiteboard Schema

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS whiteboard_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
    elements JSONB DEFAULT '[]'::jsonb,
    app_state JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    UNIQUE(room_id)
);

-- 2. Enable RLS
ALTER TABLE whiteboard_data ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- View: Everyone in the room (or public if public room)
DROP POLICY IF EXISTS "Whiteboard viewable by room members" ON whiteboard_data;
CREATE POLICY "Whiteboard viewable by room members"
ON whiteboard_data FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = whiteboard_data.room_id
        AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE id = whiteboard_data.room_id
        AND type = 'public'
    )
);

-- Update: Room members can update
DROP POLICY IF EXISTS "Whiteboard updatable by room members" ON whiteboard_data;
CREATE POLICY "Whiteboard updatable by room members"
ON whiteboard_data FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = whiteboard_data.room_id
        AND user_id = auth.uid()
    )
);

-- Insert: Room members can insert (initial creation)
DROP POLICY IF EXISTS "Whiteboard insertable by room members" ON whiteboard_data;
CREATE POLICY "Whiteboard insertable by room members"
ON whiteboard_data FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = whiteboard_data.room_id
        AND user_id = auth.uid()
    )
);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE whiteboard_data;
