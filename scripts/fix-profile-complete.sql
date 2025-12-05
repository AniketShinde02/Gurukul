-- 1. Ensure ALL columns exist (including updated_at)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(); -- This was missing!

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 4. Re-create Policies

-- Allow users to view any profile (public)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
