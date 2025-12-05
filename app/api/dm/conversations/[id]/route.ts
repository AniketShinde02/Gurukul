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

        // Delete the conversation
        // Note: This usually requires cascading deletes or handling messages first.
        // For now, we'll assume we just want to remove the conversation record.
        // If you have foreign key constraints, messages will be deleted automatically or this will fail.
        // Let's assume cascade delete is ON for messages linked to conversation.

        const { error } = await supabase
            .from('dm_conversations')
            .delete()
            .eq('id', params.id)
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`) // Ensure user is part of it

        if (error) {
            console.error('Error deleting conversation:', error)
            return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error in delete conversation route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
