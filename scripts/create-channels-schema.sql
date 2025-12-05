-- Create room_channels table
CREATE TABLE IF NOT EXISTS room_channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice', 'canvas')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE room_channels ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public view channels" ON room_channels;
CREATE POLICY "Public view channels" ON room_channels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Participants can create channels" ON room_channels;
CREATE POLICY "Participants can create channels" 
ON room_channels FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_channels.room_id 
    AND user_id = auth.uid() 
    AND role IN ('host', 'moderator')
  )
);

DROP POLICY IF EXISTS "Participants can delete channels" ON room_channels;
CREATE POLICY "Participants can delete channels" 
ON room_channels FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_channels.room_id 
    AND user_id = auth.uid() 
    AND role IN ('host', 'moderator')
  )
);

-- Insert default channels for existing rooms
INSERT INTO room_channels (room_id, name, type, position)
SELECT id, 'general', 'text', 0 FROM study_rooms
WHERE NOT EXISTS (SELECT 1 FROM room_channels WHERE room_id = study_rooms.id AND name = 'general');

INSERT INTO room_channels (room_id, name, type, position)
SELECT id, 'resources', 'text', 1 FROM study_rooms
WHERE NOT EXISTS (SELECT 1 FROM room_channels WHERE room_id = study_rooms.id AND name = 'resources');

INSERT INTO room_channels (room_id, name, type, position)
SELECT id, 'Study Lounge', 'voice', 0 FROM study_rooms
WHERE NOT EXISTS (SELECT 1 FROM room_channels WHERE room_id = study_rooms.id AND name = 'Study Lounge');

INSERT INTO room_channels (room_id, name, type, position)
SELECT id, 'Whiteboard', 'canvas', 0 FROM study_rooms
WHERE NOT EXISTS (SELECT 1 FROM room_channels WHERE room_id = study_rooms.id AND name = 'Whiteboard');
