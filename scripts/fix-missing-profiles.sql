-- 🕵️ MISSING PROFILES FIX
-- This script finds users who exist in Auth but are missing from the Profiles table
-- and inserts them automatically.

-- 1. Insert missing profiles from auth.users
INSERT INTO public.profiles (id, email, username, full_name, avatar_url, created_at)
SELECT 
    au.id,
    au.email,
    -- Try to generate a username from metadata, or fallback to email prefix
    COALESCE(
        au.raw_user_meta_data->>'user_name', 
        au.raw_user_meta_data->>'full_name', 
        SPLIT_PART(au.email, '@', 1)
    ) as username,
    -- Get full name from Google/GitHub metadata
    COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
    -- Get avatar from Google/GitHub
    COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', '') as avatar_url,
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 2. Output the count of recovered users (View this in Results tab)
SELECT count(*) as recovered_users 
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL; -- Should be 0 after the insert

-- 3. Ensure the Trigger is Robust for Future Signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger (Safe to run multiple times)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
