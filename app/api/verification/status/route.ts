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
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Server Component - middleware will handle
                        }
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get fresh profile data directly
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('age_verified, is_verified, verification_level')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Profile fetch error:', profileError)
            throw profileError
        }

        const missing: string[] = []

        // Check age verification from profile
        if (!profile?.age_verified) {
            missing.push('age_verified')
        }

        // Check email verification from auth.users
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
