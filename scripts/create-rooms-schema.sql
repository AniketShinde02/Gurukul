-- Phase 3: Virtual Study Rooms Schema

-- 1. Study Rooms Table
CREATE TABLE IF NOT EXISTS study_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private')),
  settings JSONB DEFAULT '{}'::jsonb
);

-- 2. Room Participants Table
CREATE TABLE IF NOT EXISTS room_participants (
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('host', 'moderator', 'member')),
  PRIMARY KEY (room_id, user_id)
);

-- 3. Room Messages Table
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS Policies

-- Study Rooms
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public rooms are viewable by everyone" 
ON study_rooms FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" 
ON study_rooms FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Hosts can update their rooms" 
ON study_rooms FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Hosts can delete their rooms" 
ON study_rooms FOR DELETE 
USING (auth.uid() = created_by);

-- Participants
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone" 
ON room_participants FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" 
ON room_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" 
ON room_participants FOR DELETE 
USING (auth.uid() = user_id);

-- Messages
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room messages are viewable by everyone" 
ON room_messages FOR SELECT USING (true);

CREATE POLICY "Participants can send messages" 
ON room_messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_messages.room_id 
    AND user_id = auth.uid()
  )
);

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;

-- 6. Auto-update participant count
CREATE OR REPLACE FUNCTION update_room_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE study_rooms SET current_participants = current_participants + 1 WHERE id = NEW.room_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE study_rooms SET current_participants = current_participants - 1 WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_participant_change ON room_participants;
CREATE TRIGGER on_participant_change
AFTER INSERT OR DELETE ON room_participants
FOR EACH ROW EXECUTE FUNCTION update_room_participants_count();
