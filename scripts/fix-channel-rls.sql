-- Fix RLS Policies for Channels (Simplified & Robust)

-- Ensure owner_id is set (just in case)
UPDATE study_rooms SET owner_id = created_by WHERE owner_id IS NULL;

-- 1. INSERT Policy
DROP POLICY IF EXISTS "Users can insert channels" ON room_channels;
CREATE POLICY "Users can insert channels" 
ON room_channels FOR INSERT 
WITH CHECK (
  -- Allow Owner
  EXISTS (
    SELECT 1 FROM study_rooms
    WHERE id = room_channels.room_id
    AND (owner_id = auth.uid() OR created_by = auth.uid())
  )
  OR
  -- Allow Host/Moderator participants (Simple check)
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_channels.room_id 
    AND user_id = auth.uid() 
    AND role IN ('host', 'moderator')
  )
  OR
  -- Allow Roles with explicit permissions (Advanced check)
  EXISTS (
    SELECT 1 FROM room_participants rp
    JOIN room_roles rr ON rp.role_id = rr.id
    WHERE rp.room_id = room_channels.room_id 
    AND rp.user_id = auth.uid() 
    AND (
        (rr.permissions->>'admin')::boolean = true OR 
        (rr.permissions->>'manage_channels')::boolean = true
    )
  )
);

-- 2. UPDATE Policy
DROP POLICY IF EXISTS "Users can update channels" ON room_channels;
CREATE POLICY "Users can update channels" 
ON room_channels FOR UPDATE 
USING (
  -- Allow Owner
  EXISTS (
    SELECT 1 FROM study_rooms
    WHERE id = room_channels.room_id
    AND (owner_id = auth.uid() OR created_by = auth.uid())
  )
  OR
  -- Allow Host/Moderator participants
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_channels.room_id 
    AND user_id = auth.uid() 
    AND role IN ('host', 'moderator')
  )
  OR
  -- Allow Roles with permissions
  EXISTS (
    SELECT 1 FROM room_participants rp
    JOIN room_roles rr ON rp.role_id = rr.id
    WHERE rp.room_id = room_channels.room_id 
    AND rp.user_id = auth.uid() 
    AND (
        (rr.permissions->>'admin')::boolean = true OR 
        (rr.permissions->>'manage_channels')::boolean = true
    )
  )
);

-- 3. DELETE Policy
DROP POLICY IF EXISTS "Users can delete channels" ON room_channels;
CREATE POLICY "Users can delete channels" 
ON room_channels FOR DELETE 
USING (
  -- Allow Owner
  EXISTS (
    SELECT 1 FROM study_rooms
    WHERE id = room_channels.room_id
    AND (owner_id = auth.uid() OR created_by = auth.uid())
  )
  OR
  -- Allow Host/Moderator participants
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_channels.room_id 
    AND user_id = auth.uid() 
    AND role IN ('host', 'moderator')
  )
  OR
  -- Allow Roles with permissions
  EXISTS (
    SELECT 1 FROM room_participants rp
    JOIN room_roles rr ON rp.role_id = rr.id
    WHERE rp.room_id = room_channels.room_id 
    AND rp.user_id = auth.uid() 
    AND (
        (rr.permissions->>'admin')::boolean = true OR 
        (rr.permissions->>'manage_channels')::boolean = true
    )
  )
);
