-- 1. Add XP and Stats columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_study_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- 2. Create Study Sessions Table (To track individual sessions)
CREATE TABLE IF NOT EXISTS study_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    minutes INTEGER NOT NULL,
    category TEXT DEFAULT 'General', -- e.g., 'Coding', 'Math', 'Reading'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies for study_logs
CREATE POLICY "Users can insert their own study logs" 
ON study_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own study logs" 
ON study_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view global stats (for leaderboards)"
ON study_logs FOR SELECT
USING (true); -- Publicly viewable for aggregation if needed, or restrict to just profiles table

-- 5. Function to Award XP and Update Level
CREATE OR REPLACE FUNCTION award_study_xp(minutes_studied INTEGER, study_category TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  xp_gain INTEGER;
  old_level INTEGER;
  new_level INTEGER;
  current_xp INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Calculate XP: 10 XP per minute (Simple formula)
  -- Bonus: If Verified Student, 1.5x Multiplier (Implement logic if desired, keeping simple for now)
  xp_gain := minutes_studied * 10;

  -- 1. Insert Log
  INSERT INTO study_logs (user_id, minutes, category)
  VALUES (current_user_id, minutes_studied, study_category);

  -- 2. Validate current state
  SELECT xp, level INTO current_xp, old_level FROM profiles WHERE id = current_user_id;
  
  IF current_xp IS NULL THEN current_xp := 0; END IF;
  IF old_level IS NULL THEN old_level := 1; END IF;

  -- 3. Update Profile
  -- Level Formula example: Level = floor(sqrt(new_xp / 100)) + 1
  -- Or simple: Level up every 1000 XP
  UPDATE profiles
  SET 
    xp = current_xp + xp_gain,
    total_study_minutes = COALESCE(total_study_minutes, 0) + minutes_studied,
    level = FLOOR(SQRT((current_xp + xp_gain) / 50)) + 1, -- e.g. 500xp = lvl 4
    last_study_date = CURRENT_DATE
  WHERE id = current_user_id
  RETURNING level INTO new_level;

  RETURN json_build_object(
    'xp_gained', xp_gain,
    'new_total_xp', current_xp + xp_gain,
    'old_level', old_level,
    'new_level', new_level,
    'leveled_up', (new_level > old_level)
  );
END;
$$;
