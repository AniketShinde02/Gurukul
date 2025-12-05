import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

        // Update all messages in this conversation where I am NOT the sender to is_read = true
        const { error } = await supabase
            .from('dm_messages')
            .update({ is_read: true })
            .eq('conversation_id', params.id)
            .neq('sender_id', user.id)
            .eq('is_read', false)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error marking read:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
