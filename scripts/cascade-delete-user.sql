-- CASCADE DELETE: Automatically delete all user data when auth user is deleted
-- Run this in Supabase SQL Editor

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete from profiles (this will cascade to other tables due to foreign keys)
    DELETE FROM public.profiles WHERE id = OLD.id;
    
    -- Explicitly delete from other tables if needed
    DELETE FROM public.chat_sessions WHERE user1_id = OLD.id OR user2_id = OLD.id;
    DELETE FROM public.messages WHERE sender_id = OLD.id;
    DELETE FROM public.waiting_queue WHERE user_id = OLD.id;
    DELETE FROM public.reports WHERE reporter_id = OLD.id OR reported_user_id = OLD.id;
    DELETE FROM public.server_members WHERE user_id = OLD.id;
    DELETE FROM public.servers WHERE owner_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, service_role;
GRANT ALL ON auth.users TO postgres, service_role;

-- Verify trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_deleted';

-- Test query (DO NOT RUN - just for reference)
-- DELETE FROM auth.users WHERE email = 'test@example.com';
