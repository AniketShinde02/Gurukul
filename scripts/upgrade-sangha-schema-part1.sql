-- Upgrade Schema Part 1: DDL (Create Tables, Columns, and Policies)

-- 1. Enhance study_rooms table
ALTER TABLE study_rooms 
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);

UPDATE study_rooms SET owner_id = created_by WHERE owner_id IS NULL;

-- 2. Create room_roles table
CREATE TABLE IF NOT EXISTS room_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#99aab5',
  position INTEGER DEFAULT 0,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update room_participants to use roles (add column first so policies can reference it)
ALTER TABLE room_participants 
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES room_roles(id) ON DELETE SET NULL;

-- 4. Enable RLS for roles and policies
ALTER TABLE room_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Roles are viewable by everyone" ON room_roles;
CREATE POLICY "Roles are viewable by everyone" 
  ON room_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage roles" ON room_roles;
CREATE POLICY "Admins can manage roles" 
  ON room_roles FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = room_roles.room_id 
        AND user_id = auth.uid() 
        AND (
          role = 'host' OR 
          EXISTS (
            SELECT 1 FROM room_roles r 
            WHERE r.id = room_participants.role_id 
              AND (r.permissions->>'manage_roles')::boolean = true
          )
        )
    )
  );

-- 5. Continue with room_channels changes
ALTER TABLE room_channels 
  DROP CONSTRAINT IF EXISTS room_channels_type_check;

ALTER TABLE room_channels 
  ADD CONSTRAINT room_channels_type_check 
  CHECK (type IN ('text', 'voice', 'video', 'canvas', 'image'));

ALTER TABLE room_channels 
  ADD COLUMN IF NOT EXISTS permission_overrides JSONB DEFAULT '[]'::jsonb;

-- 6. Create room_bans table and RLS
CREATE TABLE IF NOT EXISTS room_bans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  banned_by UUID REFERENCES profiles(id),
  UNIQUE(room_id, user_id)
);

ALTER TABLE room_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bans are viewable by admins/mods" ON room_bans;
CREATE POLICY "Bans are viewable by admins/mods" 
  ON room_bans FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_id = room_bans.room_id 
        AND user_id = auth.uid() 
        AND role IN ('host', 'moderator')
    )
  );

-- 7. Realtime subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'room_roles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_roles;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'room_bans') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_bans;
  END IF;
END $$;
