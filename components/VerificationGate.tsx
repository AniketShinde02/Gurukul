'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVerificationGate } from '@/hooks/useVerificationGate'
import { Loader2, ShieldAlert } from 'lucide-react'

interface VerificationGateProps {
    children: React.ReactNode
    redirectTo?: string // Where to redirect if not verified
    showLoading?: boolean // Show loading state
}

/**
 * Centralized Verification Gate Component
 * Blocks access to protected features unless user is verified
 */
export function VerificationGate({
    children,
    redirectTo = '/verify',
    showLoading = true
}: VerificationGateProps) {
    const router = useRouter()
    const { isVerified, isLoading, missingRequirements } = useVerificationGate()

    useEffect(() => {
        if (!isLoading && !isVerified) {
            // Redirect to verification page with missing requirements and return URL
            const params = new URLSearchParams()
            if (missingRequirements.length > 0) {
                params.set('missing', missingRequirements.join(','))
            }
            // Add current URL as return destination
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
            params.set('returnUrl', returnUrl)

            router.push(`${redirectTo}?${params.toString()}`)
        }
    }, [isLoading, isVerified, redirectTo, missingRequirements, router])

    // Loading state
    if (isLoading && showLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-stone-400">Checking verification status...</p>
                </div>
            </div>
        )
    }

    // Not verified - show blocked state
    if (!isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-500/50 flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Verification Required
                    </h2>
                    <p className="text-stone-400 mb-6">
                        Please complete all required verification steps to access this feature.
                    </p>
                    <button
                        onClick={() => router.push(redirectTo)}
                        className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
                    >
                        Complete Verification
                    </button>
                </div>
            </div>
        )
    }

    // Verified - show content
    return <>{children}</>
}
