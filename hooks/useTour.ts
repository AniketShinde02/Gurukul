'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useTour() {
    const [runTour, setRunTour] = useState(false)
    const [tourCompleted, setTourCompleted] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        checkTourStatus()
    }, [])

    const checkTourStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const { data: profile } = await supabase
            .from('profiles')
            .select('tour_completed, profile_completed')
            .eq('id', user.id)
            .single()

        if (profile) {
            setTourCompleted(profile.tour_completed || false)

            // Auto-start tour if profile is completed but tour isn't
            if (profile.profile_completed && !profile.tour_completed) {
                setTimeout(() => setRunTour(true), 1000)
            }
        }
    }

    const startTour = () => {
        setRunTour(true)
    }

    const completeTour = async () => {
        if (!userId) return

        try {
            await supabase
                .from('profiles')
                .update({ tour_completed: true })
                .eq('id', userId)

            setTourCompleted(true)
            setRunTour(false)
        } catch (error) {
            console.error('Error completing tour:', error)
        }
    }

    const skipTour = async () => {
        if (!userId) return

        try {
            await supabase
                .from('profiles')
                .update({ tour_completed: true })
                .eq('id', userId)

            setTourCompleted(true)
            setRunTour(false)
        } catch (error) {
            console.error('Error skipping tour:', error)
        }
    }

    return {
        runTour,
        tourCompleted,
        startTour,
        completeTour,
        skipTour,
        setRunTour,
    }
}
