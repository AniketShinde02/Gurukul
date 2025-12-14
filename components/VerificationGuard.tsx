'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useVerificationCheck } from '@/hooks/useVerificationCheck'
import { AgeVerificationModal } from '@/components/AgeVerificationModal'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface VerificationGuardProps {
    children: React.ReactNode
}

/**
 * Client-side verification guard
 * Checks verification and blocks access to protected features
 */
export function VerificationGuard({ children }: VerificationGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { isVerified, isLoading, missingRequirements, recheckVerification } = useVerificationCheck()
    const [showAgeModal, setShowAgeModal] = useState(false)
    const [hasChecked, setHasChecked] = useState(false)

    // Protected routes
    const protectedRoutes = ['/sangha', '/chat']
    const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))

    useEffect(() => {
        if (isLoading || !isProtectedRoute || hasChecked) return

        setHasChecked(true)

        if (!isVerified) {
            const missing = missingRequirements

            if (missing.includes('age_verified')) {
                // Show age verification modal
                setShowAgeModal(true)
                toast.error('Please verify your age (18+) to access this feature', {
                    duration: 5000,
                    icon: '🔞'
                })
            } else if (missing.includes('email_verified')) {
                toast.error('Please verify your email to access this feature', {
                    duration: 5000,
                    icon: '📧'
                })
                // Redirect to home after 2 seconds
                setTimeout(() => router.push('/'), 2000)
            } else {
                toast.error('Please complete verification to access this feature', {
                    duration: 5000
                })
                setTimeout(() => router.push('/'), 2000)
            }
        }
    }, [isLoading, isVerified, isProtectedRoute, missingRequirements, hasChecked, router, pathname])

    const handleAgeVerified = async () => {
        await recheckVerification()
        setShowAgeModal(false)
        toast.success('Age verified! You can now access all features')
        setHasChecked(false) // Recheck
    }

    // Show children (content will be hidden by modal if not verified)
    return (
        <>
            {children}

            {/* Age Verification Modal */}
            <AgeVerificationModal
                isOpen={showAgeModal}
                onClose={() => {
                    setShowAgeModal(false)
                    router.push('/')
                }}
                required={true}
                onVerified={handleAgeVerified}
            />
        </>
    )
}
