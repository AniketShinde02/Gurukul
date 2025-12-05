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

    // Remove user from queue
    const { error } = await supabase
      .from('waiting_queue')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing from queue:', error)
      return NextResponse.json({ error: 'Failed to leave queue' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Left queue successfully' })
  } catch (error) {
    console.error('Error in leave queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

