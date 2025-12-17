'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import ProfileCompletionModal from './ProfileCompletionModal'
import OnboardingTour from './OnboardingTour'
import { useTour } from '@/hooks/useTour'

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [profileCompleted, setProfileCompleted] = useState(true)
    const [loading, setLoading] = useState(true)

    const { runTour, completeTour, skipTour } = useTour()

    useEffect(() => {
        checkOnboardingStatus()
    }, [])

    const checkOnboardingStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('profile_completed, tour_completed')
                .eq('id', user.id)
                .single()

            if (profile) {
                const isProfileComplete = profile.profile_completed || false
                setProfileCompleted(isProfileComplete)

                // Show profile modal if not completed
                if (!isProfileComplete) {
                    setShowProfileModal(true)
                }
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleProfileComplete = () => {
        setShowProfileModal(false)
        setProfileCompleted(true)
        // Tour will auto-start from useTour hook
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    }

    return (
        <>
            {children}

            <ProfileCompletionModal
                isOpen={showProfileModal}
                onComplete={handleProfileComplete}
            />

            <OnboardingTour
                run={runTour}
                onComplete={completeTour}
                onSkip={skipTour}
            />
        </>
    )
}
