-- Drop old functions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.find_match(uuid);
DROP FUNCTION IF EXISTS public.find_match(uuid, text);

CREATE OR REPLACE FUNCTION public.find_match(p_user_id UUID, p_match_mode TEXT DEFAULT 'buddies_first')
RETURNS TABLE (
  match_found BOOLEAN,
  session_id UUID,
  message TEXT
) AS $$
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
    -- If buddies_first was requested but failed, we still match globally here.
    -- If we wanted to restrict to ONLY buddies, we would need another check.
    -- But the requirement says "fallback to global".
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

    RETURN QUERY SELECT true, new_session_id, 'Match found!';
  
  ELSE
    -- 4. If no partner found, add myself to the queue
    INSERT INTO waiting_queue (user_id, match_mode)
    VALUES (p_user_id, p_match_mode)
    ON CONFLICT (user_id) DO UPDATE
    SET match_mode = p_match_mode, joined_at = NOW();

    RETURN QUERY SELECT false, NULL::UUID, 'Added to queue';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
