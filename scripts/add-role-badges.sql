-- Add icon column to room_roles table
ALTER TABLE room_roles 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT NULL;

-- icon can be:
-- - Emoji (e.g., "🛡️", "👑", "🔨")
-- - Icon name (e.g., "shield", "crown", "hammer")
-- - URL to custom icon image

COMMENT ON COLUMN room_roles.icon IS 'Role icon: emoji, icon name, or image URL';

-- Create junction table for multi-role support (users can have multiple roles)
CREATE TABLE IF NOT EXISTS room_user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES room_roles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(room_id, user_id, role_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_user_roles_room ON room_user_roles(room_id);
CREATE INDEX IF NOT EXISTS idx_room_user_roles_user ON room_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_room_user_roles_role ON room_user_roles(role_id);

-- Enable RLS
ALTER TABLE room_user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view user roles in their rooms
CREATE POLICY "User roles visible to room members"
ON room_user_roles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_user_roles.room_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Admins can manage user roles
CREATE POLICY "Admins can manage user roles"
ON room_user_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM room_participants rp
    JOIN room_roles r ON rp.role_id = r.id
    WHERE rp.room_id = room_user_roles.room_id 
    AND rp.user_id = auth.uid()
    AND (r.permissions->>'manage_roles')::boolean = true
  )
);

-- Add default icons to existing roles
UPDATE room_roles 
SET icon = 'shield'
WHERE name = 'Admin' AND icon IS NULL;

UPDATE room_roles 
SET icon = 'hammer'
WHERE name ILIKE '%mod%' AND icon IS NULL;

UPDATE room_roles 
SET icon = 'user'
WHERE name = 'Member' AND icon IS NULL;

-- Migration complete!
