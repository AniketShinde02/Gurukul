import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // ✅ Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Rate limit: 5 join attempts per minute (prevent spam matching)
    const { allowed } = await rateLimit(user.id, 'matching-join', 5, 60)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 })
    }

    // ✅ (Removed blocking check - we now clear stale entries instead)

    // ✅ Check if user has an active session
    const { data: activeSession } = await supabase
      .from('chat_sessions')
      .select('id')  // ✅ Only need id
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (activeSession) {
      // ✅ Auto-end the stale session instead of blocking
      console.log('Auto-ending stale session:', activeSession.id)
      await supabase
        .from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', activeSession.id)
    }

    // ✅ Clear any stale queue entries for this user first
    await supabase
      .from('waiting_queue')
      .delete()
      .eq('user_id', user.id)

    // ✅ Add user to queue (fresh entry)
    const { error: queueError } = await supabase
      .from('waiting_queue')
      .insert({
        user_id: user.id,
        joined_at: new Date().toISOString(),
      })

    if (queueError) {
      console.error('Error adding to queue:', queueError)
      return NextResponse.json({ error: 'Failed to join queue' }, { status: 500 })
    }

    // ✅ Get matchMode if provided
    const json = await request.json().catch(() => ({}))
    const matchMode = json.matchMode || 'buddies_first'

    // ✅ Try to find a match (async, don't wait)
    findMatch(user.id, matchMode).catch(err => console.error('Match error:', err))

    return NextResponse.json({ message: 'Joined queue successfully' })
  } catch (error) {
    console.error('Error in join queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function findMatch(currentUserId: string, matchMode: string = 'buddies_first') {
  const supabase = await createClient()

  try {
    // ✅ Use Production-Grade Matchmaking Function (Uses SKIP LOCKED)
    const { data, error } = await supabase
      .rpc('find_match', {
        p_user_id: currentUserId,
        p_match_mode: matchMode
      })

    if (error) {
      console.error('Match error:', error)
      return
    }

    // The RPC returns a table/list, but we generally expect 1 row
    const result = Array.isArray(data) ? data[0] : data

    if (!result || !result.match_found || !result.session_id) {
      // No match found immediately, that's fine.
      return
    }

    // ✅ Match Found! Notify both users via realtime
    const channel = supabase.channel('matching')

    // Notify Self
    await channel.send({
      type: 'broadcast',
      event: 'match_found',
      payload: {
        sessionId: result.session_id,
        userId: currentUserId,
      }
    })

    // Notify Partner
    await channel.send({
      type: 'broadcast',
      event: 'match_found',
      payload: {
        sessionId: result.session_id,
        userId: result.partner_id,
      }
    })

  } catch (error) {
    console.error('Error in findMatch:', error)
  }
}

