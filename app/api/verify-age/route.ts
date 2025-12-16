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

        // Rate limiting: 3 attempts per minute
        const { allowed, remaining } = await rateLimit(user.id, 'verify-age', 3, 60)
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many verification attempts. Please wait before trying again.' },
                { status: 429 }
            )
        }

        const { date_of_birth } = await request.json()

        // Validation
        if (!date_of_birth) {
            return NextResponse.json(
                { error: 'Date of birth is required' },
                { status: 400 }
            )
        }

        // Validate date format
        const dob = new Date(date_of_birth)
        if (isNaN(dob.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            )
        }

        // Check if date is in the future
        if (dob > new Date()) {
            return NextResponse.json(
                { error: 'Date of birth cannot be in the future' },
                { status: 400 }
            )
        }

        // Check if user is at least 13 (minimum age for most platforms)
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        if (age < 13) {
            return NextResponse.json(
                { error: 'You must be at least 13 years old to use this platform' },
                { status: 400 }
            )
        }

        // Check if already verified
        const { data: profile } = await supabase
            .from('profiles')
            .select('age_verified')
            .eq('id', user.id)
            .single()

        if (profile?.age_verified) {
            return NextResponse.json(
                { error: 'Age already verified' },
                { status: 400 }
            )
        }

        // Verify age using database function
        const { data, error } = await supabase
            .rpc('verify_user_age', {
                user_id_param: user.id,
                dob: date_of_birth
            })

        if (error) throw error

        const isAdult = data as boolean
        const calculatedAge = age

        return NextResponse.json({
            success: true,
            verified: isAdult,
            age: calculatedAge,
            message: isAdult
                ? 'Age verified successfully'
                : 'You must be 18+ to access video matching'
        })

    } catch (error: any) {
        console.error('Age verification error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to verify age' },
            { status: 500 }
        )
    }
}

// GET: Check if user's age is verified
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

        // Get verification status
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('age_verified, date_of_birth, age_verified_at')
            .eq('id', user.id)
            .single()

        if (error) throw error

        // Calculate age if DOB exists
        let age = null
        if (profile.date_of_birth) {
            const dob = new Date(profile.date_of_birth)
            age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        }

        return NextResponse.json({
            age_verified: profile.age_verified || false,
            has_dob: !!profile.date_of_birth,
            age: age,
            verified_at: profile.age_verified_at,
            is_adult: age !== null && age >= 18
        })

    } catch (error: any) {
        console.error('Age check error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to check age verification' },
            { status: 500 }
        )
    }
}
