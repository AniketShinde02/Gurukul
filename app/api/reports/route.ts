import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/redis'

export async function POST(request: Request) {
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

        // Rate limiting: 3 reports per minute
        const { allowed, remaining } = await rateLimit(user.id, 'reports', 3, 60)
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many reports. Please wait before reporting again.' },
                { status: 429 }
            )
        }

        const { reported_id, session_id, reason, description } = await request.json()

        // Validation
        if (!reported_id || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Can't report yourself
        if (reported_id === user.id) {
            return NextResponse.json(
                { error: 'Cannot report yourself' },
                { status: 400 }
            )
        }

        // Check if already reported this user recently (prevent spam)
        const { data: existingReport } = await supabase
            .from('user_reports')
            .select('id')
            .eq('reporter_id', user.id)
            .eq('reported_id', reported_id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
            .single()

        if (existingReport) {
            return NextResponse.json(
                { error: 'You already reported this user recently' },
                { status: 429 }
            )
        }

        // Create report
        const { data: report, error } = await supabase
            .from('user_reports')
            .insert({
                reporter_id: user.id,
                reported_id,
                session_id,
                reason,
                description
            })
            .select()
            .single()

        if (error) throw error

        // Check if user should be auto-banned (trigger handles this, but we return status)
        const { data: banCheck } = await supabase
            .rpc('is_user_banned', { user_id_param: reported_id })

        return NextResponse.json({
            success: true,
            report,
            user_banned: banCheck || false
        })

    } catch (error: any) {
        console.error('Report error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to submit report' },
            { status: 500 }
        )
    }
}

// GET: Check if current user is banned
export async function GET(request: Request) {
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
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check ban status
        const { data: isBanned } = await supabase
            .rpc('is_user_banned', { user_id_param: user.id })

        // Get ban details if banned
        let banDetails = null
        if (isBanned) {
            const { data } = await supabase
                .from('user_bans')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single()

            banDetails = data
        }

        return NextResponse.json({
            is_banned: isBanned || false,
            ban_details: banDetails
        })

    } catch (error: any) {
        console.error('Ban check error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to check ban status' },
            { status: 500 }
        )
    }
}
