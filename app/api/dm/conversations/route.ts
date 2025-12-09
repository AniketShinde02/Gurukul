import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Cache control for better performance
const CACHE_MAX_AGE = 5 // seconds

export async function GET(request: Request) {
    const startTime = Date.now()

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

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 50)
        const offset = parseInt(url.searchParams.get('offset') || '0')

        // Optimized query: Select only needed fields, with pagination
        // Use two separate indexed queries instead of OR (faster with indexes)
        const [user1Result, user2Result] = await Promise.all([
            supabase
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
                    user2:profiles!user2_id(id, username, avatar_url, full_name)
                `)
                .eq('user1_id', user.id)
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .range(offset, offset + limit - 1),
            supabase
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
                    user1:profiles!user1_id(id, username, avatar_url, full_name)
                `)
                .eq('user2_id', user.id)
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .range(offset, offset + limit - 1)
        ])

        if (user1Result.error) throw user1Result.error
        if (user2Result.error) throw user2Result.error

        // Merge and dedupe results
        const allConversations = [
            ...(user1Result.data || []).map(c => ({ ...c, otherUser: c.user2, isUser1: true })),
            ...(user2Result.data || []).map(c => ({ ...c, otherUser: c.user1, isUser1: false }))
        ]

        // Sort by last_message_at and filter deleted
        const now = Date.now()
        const filtered = allConversations
            .filter(c => {
                const deletedAt = c.isUser1 ? c.deleted_by_user1_at : c.deleted_by_user2_at
                if (!deletedAt) return true

                const lastMessageAt = c.last_message_at ? new Date(c.last_message_at).getTime() : 0
                const deletedTime = new Date(deletedAt).getTime()
                return lastMessageAt > deletedTime
            })
            .sort((a, b) => {
                const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
                const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
                return bTime - aTime
            })
            .slice(0, limit)

        // Format response - minimal payload
        const formatted = filtered.map(c => ({
            id: c.id,
            otherUser: {
                id: c.otherUser?.id,
                username: c.otherUser?.username,
                avatar_url: c.otherUser?.avatar_url,
                full_name: c.otherUser?.full_name
            },
            lastMessageAt: c.last_message_at,
            lastMessagePreview: c.last_message_preview,
            updatedAt: c.updated_at
        }))

        const response = NextResponse.json({
            conversations: formatted,
            meta: {
                count: formatted.length,
                hasMore: formatted.length === limit,
                queryTime: Date.now() - startTime
            }
        })

        // Add cache headers for better performance
        response.headers.set('Cache-Control', `private, max-age=${CACHE_MAX_AGE}`)

        return response

    } catch (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
