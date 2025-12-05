-- Fix Infinite Recursion in RLS Policies

-- The issue is that the "Admins can manage roles" policy on room_roles was defined as FOR ALL.
-- This includes SELECT. When we query room_roles to check permissions (inside other policies),
-- it triggers this policy, which queries room_roles again -> Infinite Loop.

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage roles" ON room_roles;

-- 2. Recreate it ONLY for modification operations (INSERT, UPDATE, DELETE)
-- SELECT is already covered by "Roles are viewable by everyone"
CREATE POLICY "Admins can manage roles" 
  ON room_roles 
  FOR INSERT 
  WITH CHECK (
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

CREATE POLICY "Admins can update roles" 
  ON room_roles 
  FOR UPDATE
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

CREATE POLICY "Admins can delete roles" 
  ON room_roles 
  FOR DELETE
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
