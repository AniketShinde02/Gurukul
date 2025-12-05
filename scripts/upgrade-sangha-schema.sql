-- Upgrade Schema for Full Discord-like Features

-- 1. Enhance study_rooms table
ALTER TABLE study_rooms 
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);

-- Set owner_id to created_by for existing rooms
UPDATE study_rooms SET owner_id = created_by WHERE owner_id IS NULL;

-- 2. Create room_roles table
CREATE TABLE IF NOT EXISTS room_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#99aab5', -- Discord default role color
  position INTEGER DEFAULT 0,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for roles
ALTER TABLE room_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles are viewable by everyone" 
ON room_roles FOR SELECT USING (true);

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

-- 3. Update room_participants to use roles
ALTER TABLE room_participants 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES room_roles(id) ON DELETE SET NULL;

-- 4. Create default roles for existing rooms and migrate
DO $$
DECLARE
  r RECORD;
  admin_role_id UUID;
  mod_role_id UUID;
  member_role_id UUID;
BEGIN
  FOR r IN SELECT * FROM study_rooms LOOP
    -- Create Admin Role
    INSERT INTO room_roles (room_id, name, color, position, permissions)
    VALUES (r.id, 'Admin', '#E03E3E', 0, '{"admin": true, "manage_server": true, "manage_channels": true, "manage_roles": true, "kick_members": true, "ban_members": true, "manage_messages": true}'::jsonb)
    RETURNING id INTO admin_role_id;

    -- Create Moderator Role
    INSERT INTO room_roles (room_id, name, color, position, permissions)
    VALUES (r.id, 'Moderator', '#3498DB', 1, '{"manage_messages": true, "kick_members": true, "manage_channels": false}'::jsonb)
    RETURNING id INTO mod_role_id;

    -- Create Member Role
    INSERT INTO room_roles (room_id, name, color, position, permissions)
    VALUES (r.id, 'Member', '#2ECC71', 2, '{"send_messages": true, "connect": true, "speak": true, "stream": true}'::jsonb)
    RETURNING id INTO member_role_id;

    -- Migrate Participants
    UPDATE room_participants SET role_id = admin_role_id WHERE room_id = r.id AND role = 'host';
    UPDATE room_participants SET role_id = mod_role_id WHERE room_id = r.id AND role = 'moderator';
    UPDATE room_participants SET role_id = member_role_id WHERE room_id = r.id AND role = 'member';
  END LOOP;
END $$;

-- 5. Update room_channels for new types and permissions
ALTER TABLE room_channels 
DROP CONSTRAINT IF EXISTS room_channels_type_check;

ALTER TABLE room_channels 
ADD CONSTRAINT room_channels_type_check 
CHECK (type IN ('text', 'voice', 'video', 'canvas', 'image'));

ALTER TABLE room_channels 
ADD COLUMN IF NOT EXISTS permission_overrides JSONB DEFAULT '[]'::jsonb;

-- 6. Create room_bans table
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

CREATE POLICY "Bans are viewable by admins/mods" 
ON room_bans FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_bans.room_id 
    AND user_id = auth.uid() 
    AND role IN ('host', 'moderator') -- Fallback to old role check for safety, or use new permission check
  )
);

-- 7. Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE room_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE room_bans;
