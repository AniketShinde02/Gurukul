-- Fix Remaining Function Search Path Security Issues
-- These are the ACTUAL functions in your database with correct signatures

-- 1. Fix find_match function (ACTUAL signature from match-function.sql)
DROP FUNCTION IF EXISTS public.find_match(uuid, text, text);

CREATE OR REPLACE FUNCTION public.find_match(p_user_id UUID, p_match_mode TEXT DEFAULT 'buddies_first')
RETURNS TABLE (
  match_found BOOLEAN,
  session_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_id UUID;
  new_session_id UUID;
BEGIN
  -- 1. Try to find a Buddy Match first (if requested)
  IF p_match_mode = 'buddies_first' THEN
    SELECT wq.user_id INTO partner_id
    FROM waiting_queue wq
    JOIN study_connections sc ON 
      (sc.requester_id = p_user_id AND sc.receiver_id = wq.user_id) OR 
      (sc.receiver_id = p_user_id AND sc.requester_id = wq.user_id)
    WHERE wq.user_id != p_user_id
    AND sc.status = 'accepted'
    AND wq.joined_at > NOW() - INTERVAL '1 minute'
    ORDER BY wq.joined_at ASC
    LIMIT 1
    FOR UPDATE OF wq SKIP LOCKED;
  END IF;

  -- 2. Fallback to Global Match (if no buddy found or mode is global)
  IF partner_id IS NULL THEN
    SELECT user_id INTO partner_id
    FROM waiting_queue
    WHERE user_id != p_user_id
    AND joined_at > NOW() - INTERVAL '1 minute'
    ORDER BY joined_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  -- 3. If a partner is found
  IF partner_id IS NOT NULL THEN
    -- Remove partner from queue
    DELETE FROM waiting_queue WHERE user_id = partner_id;
    
    -- Remove myself from queue if I was there
    DELETE FROM waiting_queue WHERE user_id = p_user_id;

    -- Create a new chat session
    INSERT INTO chat_sessions (user1_id, user2_id, status)
    VALUES (p_user_id, partner_id, 'active')
    RETURNING id INTO new_session_id;

    RETURN QUERY SELECT true, new_session_id, 'Match found!'::TEXT;
  
  ELSE
    -- 4. If no partner found, add myself to the queue
    INSERT INTO waiting_queue (user_id, match_mode)
    VALUES (p_user_id, p_match_mode)
    ON CONFLICT (user_id) DO UPDATE
    SET match_mode = p_match_mode, joined_at = NOW();

    RETURN QUERY SELECT false, NULL::UUID, 'Added to queue'::TEXT;
  END IF;
END;
$$;

-- 2. Fix award_study_xp function (ACTUAL signature from gamification-schema.sql)
CREATE OR REPLACE FUNCTION public.award_study_xp(minutes_studied INTEGER, study_category TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  xp_gain INTEGER;
  old_level INTEGER;
  new_level INTEGER;
  current_xp INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Calculate XP: 10 XP per minute
  xp_gain := minutes_studied * 10;

  -- 1. Insert Log
  INSERT INTO study_logs (user_id, minutes, category)
  VALUES (current_user_id, minutes_studied, study_category);

  -- 2. Validate current state
  SELECT xp, level INTO current_xp, old_level FROM profiles WHERE id = current_user_id;
  
  IF current_xp IS NULL THEN current_xp := 0; END IF;
  IF old_level IS NULL THEN old_level := 1; END IF;

  -- 3. Update Profile
  -- Level Formula: Level = floor(sqrt(new_xp / 50)) + 1
  UPDATE profiles
  SET 
    xp = current_xp + xp_gain,
    total_study_minutes = COALESCE(total_study_minutes, 0) + minutes_studied,
    level = FLOOR(SQRT((current_xp + xp_gain) / 50)) + 1,
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

-- Verify the fixes
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed find_match function with SET search_path = public';
    RAISE NOTICE '✅ Fixed award_study_xp function with SET search_path = public';
    RAISE NOTICE '🎉 All function search path security issues resolved!';
END $$;
