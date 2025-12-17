/**
 * EXAMPLE: Age Verification Integration
 * 
 * This file shows how to integrate age-based access control
 * into your features using the centralized utility.
 * 
 * NOTE: This is a DOCUMENTATION file with code examples.
 * Copy the relevant parts to your actual components.
 */

// ============================================
// EXAMPLE 1: Video Match Page
// ============================================

/*
import { getAgeVerificationStatus, canAccessVideoMatch, getRestrictionMessage } from '@/lib/ageVerification'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export function VideoMatchExample() {
    const handleStartVideoMatch = async () => {
        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('date_of_birth')
            .eq('id', userId)
            .single()

        // Check if user can access video match
        if (!canAccessVideoMatch(profile.date_of_birth)) {
            const message = getRestrictionMessage(profile.date_of_birth, 'video_match')
            toast.error(message)
            return
        }

        // Proceed with video match...
        startVideoCall()
    }

    return (
        <button onClick={handleStartVideoMatch}>
            Start Video Match
        </button>
    )
}
*/

// ============================================
// EXAMPLE 2: Community Features
// ============================================

/*
import { getAgeVerificationStatus } from '@/lib/ageVerification'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export function CommunityExample() {
    const handleJoinCommunity = async (communityId: string) {
        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('date_of_birth')
            .eq('id', userId)
            .single()

        // Get comprehensive age status
        const ageStatus = getAgeVerificationStatus(profile.date_of_birth)

        // Check if user can access all communities
        if (!ageStatus.canAccessAllCommunities) {
            toast.error(ageStatus.restrictionMessage)
            return
        }

        // Proceed with joining community...
        joinCommunity(communityId)
    }

    return (
        <button onClick={() => handleJoinCommunity('community-id')}>
            Join Community
        </button>
    )
}
*/

// ============================================
// EXAMPLE 3: Display Age-Based UI
// ============================================

/*
import { getAgeVerificationStatus } from '@/lib/ageVerification'
import { AlertTriangle } from 'lucide-react'

export function AgeBasedUIExample({ userDOB }: { userDOB: string }) {
    const ageStatus = getAgeVerificationStatus(userDOB)

    return (
        <div>
            {ageStatus.age >= 16 && ageStatus.age < 18 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-amber-500 text-sm mb-1">
                                Limited Access
                            </h4>
                            <p className="text-xs text-stone-300">
                                {ageStatus.restrictionMessage}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <button
                    disabled={!ageStatus.canAccessVideoMatch}
                    className={`w-full p-4 rounded-xl ${
                        ageStatus.canAccessVideoMatch
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-stone-700 cursor-not-allowed opacity-50'
                    }`}
                >
                    Video Match {!ageStatus.canAccessVideoMatch && '(18+ only)'}
                </button>

                <button
                    disabled={!ageStatus.canAccessPlatform}
                    className="w-full p-4 rounded-xl bg-blue-500 hover:bg-blue-600"
                >
                    Text Chat
                </button>
            </div>
        </div>
    )
}
*/

// ============================================
// EXAMPLE 4: Server-Side Check (API Route)
// ============================================

/*
import { NextResponse } from 'next/server'
import { getAgeVerificationStatus } from '@/lib/ageVerification'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    const { userId } = await request.json()

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

    // Get user's profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('date_of_birth')
        .eq('id', userId)
        .single()

    // Check age verification
    const ageStatus = getAgeVerificationStatus(profile.date_of_birth)

    if (!ageStatus.canAccessVideoMatch) {
        return NextResponse.json(
            { error: ageStatus.restrictionMessage },
            { status: 403 }
        )
    }

    // Proceed with API logic...
    return NextResponse.json({ success: true })
}
*/

// ============================================
// EXAMPLE 5: Reusable Age Check Hook
// ============================================

/*
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getAgeVerificationStatus, AgeVerificationResult } from '@/lib/ageVerification'

export function useAgeVerification() {
    const [ageStatus, setAgeStatus] = useState<AgeVerificationResult | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAge()
    }, [])

    const checkAge = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('date_of_birth')
                .eq('id', user.id)
                .single()

            if (profile?.date_of_birth) {
                const status = getAgeVerificationStatus(profile.date_of_birth)
                setAgeStatus(status)
            }
        } catch (error) {
            console.error('Age verification check failed:', error)
        } finally {
            setLoading(false)
        }
    }

    return { ageStatus, loading }
}

// Usage in component:
export function FeatureWithAgeCheck() {
    const { ageStatus, loading } = useAgeVerification()

    if (loading) return <div>Loading...</div>

    if (!ageStatus?.canAccessVideoMatch) {
        return (
            <div className="text-center p-8">
                <p className="text-stone-400">{ageStatus?.restrictionMessage}</p>
            </div>
        )
    }

    return <div>Feature content...</div>
}
*/

export { }
