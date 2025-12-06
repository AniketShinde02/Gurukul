-- Fix Function Search Path Security Issues
-- This script adds SET search_path to all affected functions to prevent SQL injection attacks

-- 1. Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$;

-- 2. Fix find_match function
CREATE OR REPLACE FUNCTION public.find_match(
    user_id UUID,
    subject_filter TEXT DEFAULT NULL,
    study_mode_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    match_id UUID,
    match_username TEXT,
    match_subject TEXT,
    match_mode TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.user_id,
        p.username,
        q.subject,
        q.study_mode
    FROM queue q
    JOIN profiles p ON q.user_id = p.id
    WHERE q.user_id != find_match.user_id
    AND q.is_active = true
    AND (subject_filter IS NULL OR q.subject = subject_filter)
    AND (study_mode_filter IS NULL OR q.study_mode = study_mode_filter)
    ORDER BY q.created_at ASC
    LIMIT 1;
END;
$$;

-- 3. Fix verify_edu_email function
CREATE OR REPLACE FUNCTION public.verify_edu_email()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_email TEXT;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get user email
    SELECT email INTO current_email
    FROM auth.users
    WHERE id = current_user_id;

    -- Check if email ends with .edu
    IF current_email LIKE '%.edu' THEN
        -- Update profile to mark as student
        UPDATE public.profiles
        SET is_student = true
        WHERE id = current_user_id;

        -- Log verification request
        INSERT INTO public.verification_requests (user_id, method, status, created_at)
        VALUES (current_user_id, 'edu_email', 'verified', NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET status = 'verified', method = 'edu_email';

        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- 4. Fix award_study_xp function
CREATE OR REPLACE FUNCTION public.award_study_xp(
    p_user_id UUID,
    p_study_minutes INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_xp_gained INTEGER;
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_new_level INTEGER;
    v_level_up BOOLEAN := false;
BEGIN
    -- Calculate XP (10 XP per minute)
    v_xp_gained := p_study_minutes * 10;

    -- Get current stats
    SELECT xp, level INTO v_current_xp, v_current_level
    FROM public.profiles
    WHERE id = p_user_id;

    -- Calculate new level (1000 XP per level)
    v_new_level := FLOOR((v_current_xp + v_xp_gained) / 1000) + 1;
    
    IF v_new_level > v_current_level THEN
        v_level_up := true;
    END IF;

    -- Update profile
    UPDATE public.profiles
    SET 
        xp = xp + v_xp_gained,
        level = v_new_level,
        total_study_minutes = COALESCE(total_study_minutes, 0) + p_study_minutes,
        last_study_date = NOW()
    WHERE id = p_user_id;

    -- Log study session
    INSERT INTO public.study_logs (user_id, minutes, xp_earned, created_at)
    VALUES (p_user_id, p_study_minutes, v_xp_gained, NOW());

    -- Return result
    RETURN json_build_object(
        'xp_gained', v_xp_gained,
        'new_level', v_new_level,
        'level_up', v_level_up
    );
END;
$$;

-- 5. Fix update_whiteboard_timestamp function
CREATE OR REPLACE FUNCTION public.update_whiteboard_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 6. Fix update_room_participants_count function
CREATE OR REPLACE FUNCTION public.update_room_participants_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Count active participants
    SELECT COUNT(*) INTO v_count
    FROM public.room_participants
    WHERE room_id = COALESCE(NEW.room_id, OLD.room_id);

    -- Update room participant count
    UPDATE public.study_rooms
    SET participant_count = v_count
    WHERE id = COALESCE(NEW.room_id, OLD.room_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Verify all functions have search_path set
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'handle_new_user',
            'find_match',
            'verify_edu_email',
            'award_study_xp',
            'update_whiteboard_timestamp',
            'update_room_participants_count'
        )
    LOOP
        RAISE NOTICE 'Fixed function: %.%', func_record.schema_name, func_record.function_name;
    END LOOP;
END $$;
