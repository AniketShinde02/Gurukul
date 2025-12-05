import { AccessToken } from 'livekit-server-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get('room')
    const username = req.nextUrl.searchParams.get('username')

    if (!room) {
        return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 })
    }
    if (!username) {
        return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 })
    }

    try {
        const apiKey = process.env.LIVEKIT_API_KEY
        const apiSecret = process.env.LIVEKIT_API_SECRET
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

        if (!apiKey || !apiSecret || !wsUrl) {
            console.error("Missing LiveKit env vars");
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        // Verify auth
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

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error("Auth error:", authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const at = new AccessToken(apiKey, apiSecret, { identity: username })

        at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true })

        return NextResponse.json({ token: await at.toJwt() })
    } catch (error) {
        console.error("Error generating token:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 })
    }
}
