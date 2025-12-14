'use client'

import { useEffect } from 'react'
import { useAgeVerification } from '@/hooks/useAgeVerification'
import { AgeVerificationModal } from '@/components/AgeVerificationModal'
import { useRouter } from 'next/navigation'

interface AgeGateProps {
    children: React.ReactNode
    requireForMatching?: boolean // If true, only require for matching features
}

export function AgeGate({ children, requireForMatching = false }: AgeGateProps) {
    const router = useRouter()
    const {
        isVerified,
        isAdult,
        isLoading,
        showModal,
        setShowModal,
        recheckVerification
    } = useAgeVerification()

    // If not requiring for matching, just show modal but don't block
    if (requireForMatching) {
        return (
            <>
                {children}
                <AgeVerificationModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    required={false}
                    onVerified={() => {
                        recheckVerification()
                        setShowModal(false)
                    }}
                />
            </>
        )
    }

    // For full age gate (e.g., signup flow)
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <>
            {children}
            <AgeVerificationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                required={!isVerified} // Required if not verified
                onVerified={() => {
                    recheckVerification()
                    setShowModal(false)
                }}
            />
        </>
    )
}
