import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
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

        // First, get the conversation to check delete timestamp
        const { data: conversation } = await supabase
            .from('dm_conversations')
            .select('user1_id, user2_id, deleted_by_user1_at, deleted_by_user2_at')
            .eq('id', params.id)
            .single()

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // Determine which user is requesting and their delete timestamp
        const isUser1 = conversation.user1_id === user.id
        const deletedAt = isUser1 ? conversation.deleted_by_user1_at : conversation.deleted_by_user2_at

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const before = searchParams.get('before') // timestamp for pagination

        let query = supabase
            .from('dm_messages')
            .select('*, dm_reactions(emoji, user_id)')
            .eq('conversation_id', params.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        // If user deleted the chat, only show messages AFTER delete timestamp
        if (deletedAt) {
            query = query.gt('created_at', deletedAt)
        }

        if (before) {
            query = query.lt('created_at', before)
        }

        const { data: messages, error } = await query

        if (error) throw error

        return NextResponse.json({ messages: messages.reverse() }) // Return in chronological order for UI

    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
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

        const { content, type = 'text', file_url, file_name, file_size, file_type } = await request.json()

        if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

        // 1. Insert message
        const { data: message, error } = await supabase
            .from('dm_messages')
            .insert({
                conversation_id: params.id,
                sender_id: user.id,
                content,
                type,
                file_url,
                file_name,
                file_size,
                file_type
            })
            .select()
            .single()

        if (error) throw error

        // 2. Update conversation last_message and unarchive if needed
        let preview = content
        if (type === 'image') preview = 'Sent an image'
        else if (type === 'file') preview = 'Sent a file'
        else if (type === 'gif') preview = 'Sent a GIF'

        // Get conversation to check which user is sending
        const { data: conversation } = await supabase
            .from('dm_conversations')
            .select('user1_id, user2_id, archived_by_user1, archived_by_user2')
            .eq('id', params.id)
            .single()

        if (conversation) {
            const isUser1 = conversation.user1_id === user.id
            const updateData: any = {
                last_message_at: new Date().toISOString(),
                last_message_preview: preview,
                updated_at: new Date().toISOString()
            }

            // Unarchive for the sender (so they see the conversation again)
            if (isUser1 && conversation.archived_by_user1) {
                updateData.archived_by_user1 = false
            } else if (!isUser1 && conversation.archived_by_user2) {
                updateData.archived_by_user2 = false
            }

            await supabase
                .from('dm_conversations')
                .update(updateData)
                .eq('id', params.id)
        }

        return NextResponse.json({ message })

    } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
