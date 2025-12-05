    -- Enable RLS on profiles
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Allow users to update their own profile
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

    -- Allow users to insert their own profile
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

    -- Allow everyone to view profiles
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);
