-- ============================================================================
-- PRODUCTION-GRADE MATCHMAKING SYSTEM
-- Designed for 10k+ concurrent users with proper locking and race condition handling
-- ============================================================================

-- Drop old functions
DROP FUNCTION IF EXISTS public.find_match(uuid);
DROP FUNCTION IF EXISTS public.find_match(uuid, text);
DROP FUNCTION IF EXISTS public.find_match(uuid, text, text);

-- ============================================================================
-- MAIN MATCHMAKING FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.find_match(
    p_user_id UUID, 
    p_match_mode TEXT DEFAULT 'buddies_first'
)
RETURNS TABLE (
    match_found BOOLEAN,
    session_id UUID,
    partner_id UUID,
    message TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_partner_id UUID;
    v_session_id UUID;
    v_lock_acquired BOOLEAN;
BEGIN
    -- Step 1: Try to acquire advisory lock to prevent race conditions
    -- This ensures atomic matching even with 10k concurrent users
    v_lock_acquired := pg_try_advisory_xact_lock(hashtext('matchmaking_lock'));
    
    IF NOT v_lock_acquired THEN
        -- If lock not acquired, user should retry
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'System busy, retry'::TEXT;
        RETURN;
    END IF;

    -- Step 2: Clean stale queue entries (older than 2 minutes)
    DELETE FROM waiting_queue 
    WHERE joined_at < NOW() - INTERVAL '2 minutes';

    -- Step 3: Try buddy match first (if requested)
    IF p_match_mode = 'buddies_first' THEN
        SELECT wq.user_id INTO v_partner_id
        FROM waiting_queue wq
        INNER JOIN study_connections sc ON 
            ((sc.requester_id = p_user_id AND sc.receiver_id = wq.user_id) OR 
             (sc.receiver_id = p_user_id AND sc.requester_id = wq.user_id))
        WHERE wq.user_id != p_user_id
          AND sc.status = 'accepted'
          AND wq.joined_at > NOW() - INTERVAL '2 minutes'
        ORDER BY wq.joined_at ASC
        LIMIT 1
        FOR UPDATE OF wq SKIP LOCKED;
    END IF;

    -- Step 4: Fallback to global match
    IF v_partner_id IS NULL THEN
        SELECT user_id INTO v_partner_id
        FROM waiting_queue
        WHERE user_id != p_user_id
          AND joined_at > NOW() - INTERVAL '2 minutes'
        ORDER BY joined_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
    END IF;

    -- Step 5: Process match if found
    IF v_partner_id IS NOT NULL THEN
        -- Remove both users from queue atomically
        DELETE FROM waiting_queue WHERE user_id IN (p_user_id, v_partner_id);
        
        -- Create session
        INSERT INTO chat_sessions (user1_id, user2_id, status, started_at)
        VALUES (p_user_id, v_partner_id, 'active', NOW())
        RETURNING id INTO v_session_id;

        RETURN QUERY SELECT 
            true, 
            v_session_id, 
            v_partner_id,
            'Match found'::TEXT;
    ELSE
        -- Step 6: Add to queue if no match
        INSERT INTO waiting_queue (user_id, match_mode, joined_at)
        VALUES (p_user_id, p_match_mode, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            match_mode = EXCLUDED.match_mode, 
            joined_at = NOW();

        RETURN QUERY SELECT 
            false, 
            NULL::UUID, 
            NULL::UUID,
            'Queued'::TEXT;
    END IF;
END;
$$;

-- ============================================================================
-- SKIP PARTNER FUNCTION (Omegle-style)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.skip_partner(
    p_user_id UUID,
    p_session_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mark session as ended
    UPDATE chat_sessions
    SET status = 'ended', ended_at = NOW()
    WHERE id = p_session_id
      AND (user1_id = p_user_id OR user2_id = p_user_id)
      AND status = 'active';

    -- Remove user from queue if present
    DELETE FROM waiting_queue WHERE user_id = p_user_id;

    RETURN FOUND;
END;
$$;

-- ============================================================================
-- CLEANUP FUNCTION (Run periodically via cron or pg_cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_matchmaking()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Remove stale queue entries
    DELETE FROM waiting_queue 
    WHERE joined_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- End abandoned sessions
    UPDATE chat_sessions
    SET status = 'ended', ended_at = NOW()
    WHERE status = 'active'
      AND started_at < NOW() - INTERVAL '2 hours';
    
    RETURN v_deleted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.find_match(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.skip_partner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_matchmaking() TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_waiting_queue_joined_at ON waiting_queue(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status_started ON chat_sessions(status, started_at);
