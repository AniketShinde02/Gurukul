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

        // Check if requesting archived conversations
        const url = new URL(request.url)
        const showArchived = url.searchParams.get('archived') === 'true'

        // Fetch conversations where current user is participant
        const { data: conversations, error } = await supabase
            .from('dm_conversations')
            .select(`
        id,
        updated_at,
        last_message_at,
        last_message_preview,
        user1_id,
        user2_id,
        deleted_by_user1_at,
        deleted_by_user2_at,
        user1:profiles!user1_id(id, username, avatar_url, full_name),
        user2:profiles!user2_id(id, username, avatar_url, full_name)
      `)
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order('last_message_at', { ascending: false, nullsFirst: false })

        if (error) throw error

        // Filter conversations based on delete status
        // Hide conversations that were deleted by the current user
        // (deleted conversations only show up again when new message is sent)
        const filtered = conversations.filter((c: any) => {
            const isUser1 = c.user1_id === user.id
            const deletedAt = isUser1 ? c.deleted_by_user1_at : c.deleted_by_user2_at

            // If user deleted the chat, only show if there's a new message after delete
            if (deletedAt) {
                const lastMessageAt = c.last_message_at ? new Date(c.last_message_at) : null
                const deletedTime = new Date(deletedAt)

                // Only show if last message is AFTER delete time
                return lastMessageAt && lastMessageAt > deletedTime
            }

            // Not deleted, show it
            return true
        })

        // Format response to just return the "other" user
        const formatted = filtered.map((c: any) => {
            const otherUser = c.user1.id === user.id ? c.user2 : c.user1
            const isUser1 = c.user1_id === user.id
            return {
                id: c.id,
                otherUser,
                lastMessageAt: c.last_message_at,
                lastMessagePreview: c.last_message_preview,
                updatedAt: c.updated_at,
                isArchived: isUser1 ? c.archived_by_user1 : c.archived_by_user2
            }
        })

        return NextResponse.json({ conversations: formatted })

    } catch (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
