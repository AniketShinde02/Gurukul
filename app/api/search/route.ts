import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const query = searchParams.get('q')
        const type = searchParams.get('type') // 'dm' or 'room'
        const targetId = searchParams.get('id') // conversation_id or room_id
        const limit = parseInt(searchParams.get('limit') || '50')

        if (!query || !type || !targetId) {
            return NextResponse.json(
                { error: 'Missing required parameters: q, type, id' },
                { status: 400 }
            )
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let results

        if (type === 'dm') {
            // Search DM messages
            const { data, error } = await supabase.rpc('search_dm_messages', {
                search_query: query,
                user_id_param: user.id,
                limit_param: limit
            })

            if (error) throw error
            results = data
        } else if (type === 'room') {
            // Search Room messages
            const { data, error } = await supabase.rpc('search_room_messages', {
                search_query: query,
                room_id_param: targetId,
                limit_param: limit
            })

            if (error) throw error
            results = data
        } else {
            return NextResponse.json(
                { error: 'Invalid type. Must be "dm" or "room"' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            results,
            count: results?.length || 0,
            query
        })

    } catch (error: any) {
        console.error('Search error:', error)
        return NextResponse.json(
            { error: error.message || 'Search failed' },
            { status: 500 }
        )
    }
}
