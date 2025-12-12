        -- Discord-Style Role Badge System Migration
        -- Date: December 12, 2025

        -- 1. Add icon column to room_roles
        ALTER TABLE room_roles 
        ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT NULL;

        -- icon can be:
        -- - Emoji (e.g., "🛡️", "👑", "🔨")
        -- - Icon name (e.g., "shield", "crown", "hammer")  
        -- - URL to custom icon image

        -- 2. Create room_user_roles junction table (for multiple roles per user)
        CREATE TABLE IF NOT EXISTS room_user_roles (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        role_id UUID REFERENCES room_roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_by UUID REFERENCES profiles(id),
        UNIQUE(room_id, user_id, role_id)
        );

        -- 3. Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_room_user_roles_room 
        ON room_user_roles(room_id);

        CREATE INDEX IF NOT EXISTS idx_room_user_roles_user 
        ON room_user_roles(user_id);

        CREATE INDEX IF NOT EXISTS idx_room_user_roles_role 
        ON room_user_roles(role_id);

        -- 4. Enable RLS
        ALTER TABLE room_user_roles ENABLE ROW LEVEL SECURITY;

        -- 5. Drop existing policies if they exist
        DROP POLICY IF EXISTS "User roles are viewable by members" ON room_user_roles;
        DROP POLICY IF EXISTS "Admins can manage user roles" ON room_user_roles;

        -- 6. Create RLS policies
        CREATE POLICY "User roles are viewable by members"
        ON room_user_roles FOR SELECT 
        USING (
        EXISTS (
            SELECT 1 FROM room_participants 
            WHERE room_id = room_user_roles.room_id 
            AND user_id = auth.uid()
        )
        );

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
        )
        WITH CHECK (
        EXISTS (
            SELECT 1 FROM room_participants rp
            JOIN room_roles r ON rp.role_id = r.id
            WHERE rp.room_id = room_user_roles.room_id 
            AND rp.user_id = auth.uid()
            AND (r.permissions->>'manage_roles')::boolean = true
        )
        );

        -- 7. Migrate existing single-role assignments to junction table
        INSERT INTO room_user_roles (room_id, user_id, role_id, assigned_at)
        SELECT 
        rp.room_id,
        rp.user_id,
        rp.role_id,
        NOW()
        FROM room_participants rp
        WHERE rp.role_id IS NOT NULL
        ON CONFLICT (room_id, user_id, role_id) DO NOTHING;

        -- 8. Add default icons to existing roles
        UPDATE room_roles 
        SET icon = 'shield'
        WHERE name ILIKE '%admin%' AND icon IS NULL;

        UPDATE room_roles 
        SET icon = 'hammer'
        WHERE name ILIKE '%mod%' AND icon IS NULL;

        UPDATE room_roles 
        SET icon = NULL
        WHERE name ILIKE '%member%' AND icon IS NULL;

        -- 9. Add realtime subscription
        DO $$
        BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'room_user_roles'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE room_user_roles;
        END IF;
        END $$;

        -- 10. Grant necessary permissions
        GRANT SELECT ON room_user_roles TO authenticated;
        GRANT INSERT, UPDATE, DELETE ON room_user_roles TO authenticated;

        -- Verification query (run manually to test):
        -- SELECT 
        --   rr.name as role_name,
        --   rr.icon,
        --   COUNT(*) as user_count
        -- FROM room_user_roles rur
        -- JOIN room_roles rr ON rur.role_id = rr.id
        -- GROUP BY rr.id, rr.name, rr.icon;
