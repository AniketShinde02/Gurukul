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

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const before = searchParams.get('before') // timestamp for pagination

        let query = supabase
            .from('dm_messages')
            .select('*')
            .eq('conversation_id', params.id)
            .order('created_at', { ascending: false })
            .limit(limit)

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

        // 2. Update conversation last_message
        let preview = content
        if (type === 'image') preview = 'Sent an image'
        else if (type === 'file') preview = 'Sent a file'
        else if (type === 'gif') preview = 'Sent a GIF'

        await supabase
            .from('dm_conversations')
            .update({
                last_message_at: new Date().toISOString(),
                last_message_preview: preview,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)

        return NextResponse.json({ message })

    } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
