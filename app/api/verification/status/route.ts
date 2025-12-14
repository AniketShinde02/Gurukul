import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

        // Call verification check function
        const { data: dbCheck, error } = await supabase
            .rpc('check_user_verification', { user_id_param: user.id })
            .single()

        if (error) throw error

        const check = dbCheck as {
            is_verified: boolean
            verification_level: string
            missing_requirements: string[]
        }

        const missing = [...(check.missing_requirements || [])]

        // Check email verification for ALL users (OAuth + Email/Password)
        // OAuth users have email_confirmed_at set automatically by provider
        // Email/Password users need to verify via email link
        const isEmailVerified = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined

        if (!isEmailVerified) {
            missing.push('email_verified')
        }

        // Determine final status
        const isVerified = missing.length === 0
        const level = isVerified ? 'basic' : 'none'

        return NextResponse.json({
            is_verified: isVerified,
            verification_level: level,
            missing_requirements: missing
        })

    } catch (error: any) {
        console.error('Verification status error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to check verification status' },
            { status: 500 }
        )
    }
}
