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

        // Verify ownership and soft delete
        const { data, error } = await supabase
            .from('dm_messages')
            .update({ is_deleted: true })
            .eq('id', params.id)
            .eq('sender_id', user.id) // Ensure only sender can delete
            .select()
            .single()

        if (error) {
            console.error('Error deleting message:', error)
            return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: data })

    } catch (error) {
        console.error('Error in delete route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
