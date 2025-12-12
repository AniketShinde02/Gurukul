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
  actual_minutes INTEGER;
BEGIN
  current_user_id := auth.uid();
  
  -- Validation 1: Cap minutes to 120 per session (2 hours)
  -- This prevents "fake" events with massive durations.
  IF minutes_studied > 120 THEN
      actual_minutes := 120;
  ELSIF minutes_studied <= 0 THEN
      RETURN json_build_object('error', 'Invalid duration');
  ELSE
      actual_minutes := minutes_studied;
  END IF;

  -- Validation 2: Ensure user exists (implicitly handled by RLS/Auth, but good to be safe)
  IF current_user_id IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Calculate XP: 10 XP per minute
  xp_gain := actual_minutes * 10;

  -- 1. Insert Log
  INSERT INTO study_logs (user_id, minutes, category)
  VALUES (current_user_id, actual_minutes, study_category);

  -- 2. Validate current state
  SELECT xp, level, total_study_minutes INTO current_xp, old_level FROM profiles WHERE id = current_user_id;
  
  IF current_xp IS NULL THEN current_xp := 0; END IF;
  IF old_level IS NULL THEN old_level := 1; END IF;

  -- 3. Update Profile
  -- Level Formula example: Level = floor(sqrt(new_xp / 100)) + 1
  -- Or simple: Level up every 1000 XP (as used in UI)
  -- Let's stick to the logic implied by UI: new_xp / 1000 or similar.
  -- The previous function used: FLOOR(SQRT((current_xp + xp_gain) / 50)) + 1
  
  -- Let's stick to the existing formula in the function being replaced.
  UPDATE profiles
  SET 
    xp = current_xp + xp_gain,
    total_study_minutes = COALESCE(total_study_minutes, 0) + actual_minutes,
    level = FLOOR(SQRT((current_xp + xp_gain) / 50)) + 1,
    last_study_date = CURRENT_DATE
  WHERE id = current_user_id
  RETURNING level INTO new_level;

  RETURN json_build_object(
    'xp_gained', xp_gain,
    'new_total_xp', current_xp + xp_gain,
    'old_level', old_level,
    'new_level', new_level,
    'leveled_up', (new_level > old_level),
    'minutes_logged', actual_minutes
  );
END;
$$;
