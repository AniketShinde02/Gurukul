import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface VerificationStatus {
    is_verified: boolean
    missing_requirements: string[]
}

/**
 * Lightweight verification hook - No heavy wrappers!
 * Just checks and shows toast if needed
 */
export function useVerificationCheck() {
    const [status, setStatus] = useState<VerificationStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkVerification()
    }, [])

    const checkVerification = async () => {
        try {
            const response = await fetch('/api/verification/status')
            const data = await response.json()

            if (response.ok) {
                setStatus(data)
            }
        } catch (error) {
            console.error('Verification check error:', error)
        } finally {
            setIsLoading(false)
        }
    }

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
        recheckVerification: checkVerification
    }
}
