import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is already in queue
    const { data: existingQueue } = await supabase
      .from('waiting_queue')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingQueue) {
      return NextResponse.json({ message: 'Already in queue' })
    }

    // Check if user has an active session
    const { data: activeSession } = await supabase
      .from('chat_sessions')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .single()

    if (activeSession) {
      return NextResponse.json({ 
        error: 'You already have an active chat session' 
      }, { status: 400 })
    }

    // Add user to queue
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

    // Try to find a match
    await findMatch(user.id)

    return NextResponse.json({ message: 'Joined queue successfully' })
  } catch (error) {
    console.error('Error in join queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function findMatch(currentUserId: string) {
  const supabase = await createClient()

  try {
    // Get all users in queue, ordered by join time
    const { data: queueUsers, error: queueError } = await supabase
      .from('waiting_queue')
      .select('*')
      .order('joined_at', { ascending: true })

    if (queueError) {
      console.error('Error fetching queue:', queueError)
      return
    }

    if (!queueUsers || queueUsers.length < 2) {
      return // Not enough users to match
    }

    // Find the oldest user in queue (excluding current user)
    const otherUser = queueUsers.find(user => user.user_id !== currentUserId)
    if (!otherUser) {
      return
    }

    // Create chat session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user1_id: currentUserId,
        user2_id: otherUser.user_id,
        started_at: new Date().toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return
    }

    // Remove both users from queue
    await supabase
      .from('waiting_queue')
      .delete()
      .in('user_id', [currentUserId, otherUser.user_id])

    // Update user stats - get current values first
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, total_chats')
      .in('id', [currentUserId, otherUser.user_id])

    if (profiles) {
      for (const profile of profiles) {
        await supabase
          .from('profiles')
          .update({ 
            total_chats: (profile.total_chats || 0) + 1,
            is_online: true,
            last_seen: new Date().toISOString()
          })
          .eq('id', profile.id)
      }
    }

    // Notify both users via realtime
    await supabase
      .channel('matching')
      .send({
        type: 'broadcast',
        event: 'match_found',
        payload: {
          sessionId: session.id,
          userId: currentUserId,
        }
      })

    await supabase
      .channel('matching')
      .send({
        type: 'broadcast',
        event: 'match_found',
        payload: {
          sessionId: session.id,
          userId: otherUser.user_id,
        }
      })

  } catch (error) {
    console.error('Error in findMatch:', error)
  }
}

