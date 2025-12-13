import { AccessToken } from 'livekit-server-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/redis'

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
            console.error("Missing LiveKit env vars")
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        // ✅ Verify auth
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
            console.error("Auth error:", authError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ✅ Rate limit: 20 token requests per minute per user
        const { allowed, remaining } = await rateLimit(user.id, 'livekit-token', 20, 60)

        if (!allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Please wait before requesting another token.',
                    retryAfter: 60
                },
                {
                    status: 429,
                    headers: { 'Retry-After': '60' }
                }
            )
        }

        // ✅ KISS PRINCIPLE: Skip validation for global channels
        // Global channels: "General Lounge", "Study Lounge", or any channel name (not UUID)
        const isGlobalChannel = !room.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

        if (!isGlobalChannel) {
            // ✅ ONLY validate for private Study Rooms (UUID format)

            // Check 1: User must be a member
            const { data: membership, error: memberError } = await supabase
                .from('room_participants')
                .select('id')
                .eq('room_id', room)
                .eq('user_id', user.id)
                .maybeSingle()

            if (memberError || !membership) {
                console.warn(`User ${user.id} attempted to join private room ${room} without membership`)
                return NextResponse.json(
                    { error: 'Not a member of this room' },
                    { status: 403 }
                )
            }

            // Check 2: Room must exist and be active
            const { data: roomData, error: roomError } = await supabase
                .from('study_rooms')
                .select('id, is_active')
                .eq('id', room)
                .eq('is_active', true)
                .maybeSingle()

            if (roomError || !roomData) {
                return NextResponse.json(
                    { error: 'Room not found or inactive' },
                    { status: 404 }
                )
            }
        }

        // ✅ Generate token (works for both global and private rooms)
        const at = new AccessToken(apiKey, apiSecret, { identity: username, ttl: 24 * 60 * 60 }) // 24 hours TTL

        at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true })

        return NextResponse.json({ token: await at.toJwt() })
    } catch (error) {
        console.error("Error generating token:", error)
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 })
    }
}
