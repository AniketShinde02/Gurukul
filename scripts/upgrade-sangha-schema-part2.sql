  -- Upgrade Schema Part 2: DML (Data Migration)

  -- 1. Create default roles for existing rooms and migrate participants
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
  