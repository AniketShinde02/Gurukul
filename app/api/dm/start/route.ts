import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { buddyId } = await request.json()
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // ✅ FIX: Query ONLY the specific connection, not all connections
        const { data: connection, error: connError } = await supabase
            .from('study_connections')
            .select('id, status')
            .or(
                `and(requester_id.eq.${user.id},receiver_id.eq.${buddyId}),` +
                `and(requester_id.eq.${buddyId},receiver_id.eq.${user.id})`
            )
            .limit(1)
            .single()

        if (connError || !connection) {
            return NextResponse.json({ error: 'Not connected buddies' }, { status: 403 })
        }

        if (connection.status !== 'accepted') {
            return NextResponse.json({ error: `Connection is ${connection.status}` }, { status: 403 })
        }

        // ✅ Check if conversation already exists (optimized query)
        const { data: existing } = await supabase
            .from('dm_conversations')
            .select('id')
            .or(
                `and(user1_id.eq.${user.id},user2_id.eq.${buddyId}),` +
                `and(user1_id.eq.${buddyId},user2_id.eq.${user.id})`
            )
            .limit(1)
            .single()

        if (existing) {
            return NextResponse.json({ conversationId: existing.id })
        }

        // ✅ Create new conversation
        const { data: newConv, error } = await supabase
            .from('dm_conversations')
            .insert({
                user1_id: user.id,
                user2_id: buddyId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString() // Ensure updated_at is set for sorting
            })
            .select('id')
            .single()

        if (error) throw error

        return NextResponse.json({ conversationId: newConv.id })

    } catch (error) {
        console.error('Error starting DM:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
