
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next')
    const type = requestUrl.searchParams.get('type') // 'recovery', 'signup', etc.

    // 1. Process Code Exchange
    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // 2. Profile Logic: Ensure user has a profile
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if profile exists
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', user.id)
                    .single()

                if (!profile) {
                    // Create new profile (Match logic from old page.tsx)
                    await supabase.from('profiles').insert({
                        id: user.id,
                        email: user.email!,
                        username: generateAnonymousUsername(),
                        created_at: new Date().toISOString(),
                        last_seen: new Date().toISOString(),
                        is_online: true,
                        total_chats: 0,
                        report_count: 0,
                        is_banned: false,
                    })
                }
            }

            // 3. Handle 'Recovery' (Password Reset) Flow
            if (type === 'recovery') {
                return NextResponse.redirect(`${requestUrl.origin}/profile/reset-password`)
            }

            // 4. Default Redirect
            return NextResponse.redirect(`${requestUrl.origin}${next || '/dashboard'}`)
        }
    }

    // Error Case
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=auth_code_error`)
}

// Helper: Anonymous Username Generator
function generateAnonymousUsername(): string {
    const adjectives = [
        'Curious', 'Brave', 'Wise', 'Swift', 'Bright', 'Kind', 'Bold', 'Gentle',
        'Clever', 'Fierce', 'Calm', 'Wild', 'Sweet', 'Sharp', 'Bold', 'Quiet'
    ]
    const nouns = [
        'Owl', 'Wolf', 'Eagle', 'Fox', 'Bear', 'Lion', 'Tiger', 'Dolphin',
        'Phoenix', 'Dragon', 'Falcon', 'Panther', 'Raven', 'Shark', 'Hawk', 'Lynx'
    ]

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = Math.floor(Math.random() * 99) + 1

    return `${adjective}${noun}${number}`
}
