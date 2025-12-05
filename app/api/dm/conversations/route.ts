import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
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

        // Fetch conversations where current user is participant
        const { data: conversations, error } = await supabase
            .from('dm_conversations')
            .select(`
        id,
        updated_at,
        last_message_at,
        last_message_preview,
        user1:profiles!user1_id(id, username, avatar_url, full_name),
        user2:profiles!user2_id(id, username, avatar_url, full_name)
      `)
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order('last_message_at', { ascending: false, nullsFirst: false })

        if (error) throw error

        // Format response to just return the "other" user
        const formatted = conversations.map((c: any) => {
            const otherUser = c.user1.id === user.id ? c.user2 : c.user1
            return {
                id: c.id,
                otherUser,
                lastMessageAt: c.last_message_at,
                lastMessagePreview: c.last_message_preview,
                updatedAt: c.updated_at
            }
        })

        return NextResponse.json({ conversations: formatted })

    } catch (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
