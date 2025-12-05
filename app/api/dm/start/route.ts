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

        // 1. Verify they are connected buddies
        // Use service role to bypass RLS issues
        const adminSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { get: () => undefined, set: () => { }, remove: () => { } } }
        )

        // Fetch all connections for the user and filter in memory to avoid complex OR syntax issues
        const { data: connections } = await adminSupabase
            .from('study_connections')
            .select('*')
            .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)

        const connection = connections?.find((c: any) =>
            (c.requester_id === user.id && c.receiver_id === buddyId) ||
            (c.requester_id === buddyId && c.receiver_id === user.id)
        )

        if (!connection) {
            console.log('No connection record found for:', user.id, buddyId)
            return NextResponse.json({ error: 'Not connected buddies (No record)' }, { status: 403 })
        }

        if (connection.status !== 'accepted') {
            console.log('Connection status not accepted:', connection.status)
            return NextResponse.json({ error: `Connection is ${connection.status}, not accepted` }, { status: 403 })
        }

        // 2. Check if conversation already exists
        const { data: existing } = await supabase
            .from('dm_conversations')
            .select('id')
            .or(`and(user1_id.eq.${user.id},user2_id.eq.${buddyId}),and(user1_id.eq.${buddyId},user2_id.eq.${user.id})`)
            .single()

        if (existing) {
            return NextResponse.json({ conversationId: existing.id })
        }

        // 3. Create new conversation
        const { data: newConv, error } = await supabase
            .from('dm_conversations')
            .insert({
                user1_id: user.id,
                user2_id: buddyId
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
