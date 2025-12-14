import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface VerificationStatus {
    is_verified: boolean
    verification_level: 'none' | 'basic' | 'full'
    missing_requirements: string[]
}

interface VerificationGateResult {
    isVerified: boolean
    isLoading: boolean
    missingRequirements: string[]
    requireVerification: () => boolean
    recheckVerification: () => Promise<void>
}

/**
 * Centralized verification gate hook
 * Single source of truth for user verification status
 */
export function useVerificationGate(): VerificationGateResult {
    const router = useRouter()
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
     * Require verification before allowing action
     * Returns true if verified, false if not (and shows error)
     */
    const requireVerification = (): boolean => {
        if (!status?.is_verified) {
            // Show specific error based on missing requirements
            const missing = status?.missing_requirements || []

            // Get current URL to return to after verification
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)

            if (missing.includes('age_verified')) {
                toast.error('Please verify your age to access this feature')
                router.push(`/verify?step=age&returnUrl=${returnUrl}`)
            } else if (missing.includes('email_verified')) {
                toast.error('Please verify your email to access this feature')
                router.push(`/verify?step=email&returnUrl=${returnUrl}`)
            } else {
                toast.error('Please complete verification to access this feature')
                router.push(`/verify?returnUrl=${returnUrl}`)
            }

            return false
        }

        return true
    }

    return {
        isVerified: status?.is_verified || false,
        isLoading,
        missingRequirements: status?.missing_requirements || [],
        requireVerification,
        recheckVerification: checkVerification
    }
}
