import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(
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

        // Get the conversation to determine which user is deleting
        const { data: conversation, error: fetchError } = await supabase
            .from('dm_conversations')
            .select('user1_id, user2_id')
            .eq('id', params.id)
            .single()

        if (fetchError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // Determine which user is deleting
        const isUser1 = conversation.user1_id === user.id
        const isUser2 = conversation.user2_id === user.id

        if (!isUser1 && !isUser2) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Set delete timestamp for this user (Discord-style delete)
        // This marks when the user deleted the chat
        // They will only see messages AFTER this timestamp
        const updateData = isUser1
            ? { deleted_by_user1_at: new Date().toISOString() }
            : { deleted_by_user2_at: new Date().toISOString() }

        const { error } = await supabase
            .from('dm_conversations')
            .update(updateData)
            .eq('id', params.id)

        if (error) {
            console.error('Error deleting conversation:', error)
            return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            deleted: true,
            message: 'Chat deleted. You will only see new messages from now on.'
        })

    } catch (error) {
        console.error('Error in delete conversation route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
