import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface VerificationStatus {
    is_verified: boolean
    missing_requirements: string[]
}

/**
 * Lightweight verification hook with smart caching
 * Prevents redundant API calls while ensuring fresh data when needed
 */
export function useVerificationCheck() {
    const [status, setStatus] = useState<VerificationStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [lastCheckTime, setLastCheckTime] = useState<number>(0)

    const checkVerification = useCallback(async (forceRefresh = false) => {
        // Smart caching: Don't recheck if checked within last 5 seconds (unless forced)
        const now = Date.now()
        if (!forceRefresh && lastCheckTime && (now - lastCheckTime) < 5000) {
            setIsLoading(false)
            return status
        }

        try {
            setIsLoading(true)
            const response = await fetch('/api/verification/status', {
                cache: 'no-store', // Always get fresh data
                headers: {
                    'Cache-Control': 'no-cache'
                }
            })
            const data = await response.json()

            if (response.ok) {
                setStatus(data)
                setLastCheckTime(now)
                return data
            }
        } catch (error) {
            console.error('Verification check error:', error)
        } finally {
            setIsLoading(false)
        }
        return null
    }, [lastCheckTime, status])

    useEffect(() => {
        checkVerification()
    }, []) // Only run on mount

    /**
     * Check before allowing action - Shows toast if not verified
     * Returns true if verified, false if not
     */
    const checkBeforeAction = (actionName: string = 'this feature'): boolean => {
        if (!status?.is_verified) {
            const missing = status?.missing_requirements || []

            if (missing.includes('age_verified')) {
                toast.error('Please verify your age (18+) to use ' + actionName, {
                    duration: 4000,
                    icon: '🔞'
                })
            } else {
                toast.error('Please complete your profile to use ' + actionName, {
                    duration: 4000,
                    icon: '⚠️'
                })
            }

            return false
        }

        return true
    }

    return {
        isVerified: status?.is_verified || false,
        isLoading,
        missingRequirements: status?.missing_requirements || [],
        checkBeforeAction,
        recheckVerification: () => checkVerification(true) // Force refresh
    }
}
