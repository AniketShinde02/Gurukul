/**
 * DEPRECATED AGE VERIFICATION API
 * 
 * This API route is DEPRECATED and kept only for backward compatibility.
 * 
 * NEW APPROACH:
 * - Age is now collected during profile completion (ProfileCompletionModal)
 * - Age verification is handled by centralized utility: lib/ageVerification.ts
 * - All age checks should use getAgeVerificationStatus() from the utility
 * 
 * DO NOT USE THIS API FOR NEW FEATURES.
 * 
 * @deprecated Use profile completion flow and lib/ageVerification.ts instead
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/redis'
import { getAgeVerificationStatus, calculateAge } from '@/lib/ageVerification'

export async function POST(request: Request) {
    console.warn('DEPRECATED: /api/verify-age POST is deprecated. Use profile completion flow instead.')

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

        // Use centralized age verification
        const ageStatus = getAgeVerificationStatus(date_of_birth)

        // Check platform access (16+ required)
        if (!ageStatus.canAccessPlatform) {
            return NextResponse.json(
                { error: ageStatus.restrictionMessage },
                { status: 400 }
            )
        }

        // Check if already verified
        const { data: profile } = await supabase
            .from('profiles')
            .select('age_verified, date_of_birth')
            .eq('id', user.id)
            .single()

        if (profile?.age_verified && profile?.date_of_birth) {
            return NextResponse.json(
                { error: 'Age already verified' },
                { status: 400 }
            )
        }

        // Update profile with DOB and age verification status
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                date_of_birth: date_of_birth,
                age_verified: ageStatus.age >= 18,
                age_verified_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (updateError) throw updateError

        return NextResponse.json({
            success: true,
            verified: ageStatus.canAccessVideoMatch,
            age: ageStatus.age,
            canAccessVideoMatch: ageStatus.canAccessVideoMatch,
            canAccessAllCommunities: ageStatus.canAccessAllCommunities,
            message: ageStatus.canAccessVideoMatch
                ? 'Age verified successfully - full access granted'
                : ageStatus.restrictionMessage || 'Limited access - some features restricted'
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

        // Use centralized age verification
        const ageStatus = getAgeVerificationStatus(profile.date_of_birth)

        return NextResponse.json({
            age_verified: profile.age_verified || false,
            has_dob: !!profile.date_of_birth,
            age: ageStatus.age,
            verified_at: profile.age_verified_at,
            is_adult: ageStatus.age >= 18,
            canAccessPlatform: ageStatus.canAccessPlatform,
            canAccessVideoMatch: ageStatus.canAccessVideoMatch,
            canAccessAllCommunities: ageStatus.canAccessAllCommunities,
            restrictionMessage: ageStatus.restrictionMessage,
        })

    } catch (error: any) {
        console.error('Age check error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to check age verification' },
            { status: 500 }
        )
    }
}
