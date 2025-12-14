'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useVerificationGate } from '@/hooks/useVerificationGate'
import { AgeVerificationModal } from '@/components/AgeVerificationModal'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function VerifyPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isVerified, isLoading, missingRequirements, recheckVerification } = useVerificationGate()

    const [showAgeModal, setShowAgeModal] = useState(false)
    const [currentStep, setCurrentStep] = useState<string | null>(null)

    useEffect(() => {
        // If already verified, redirect to sangha
        if (!isLoading && isVerified) {
            toast.success('Verification complete!')
            router.push('/sangha')
            return
        }

        // Check URL params for specific step
        const step = searchParams.get('step')
        if (step) {
            setCurrentStep(step)
            if (step === 'age') {
                setShowAgeModal(true)
            }
        } else if (missingRequirements.includes('age_verified')) {
            setCurrentStep('age')
            setShowAgeModal(true)
        }
    }, [isLoading, isVerified, searchParams, missingRequirements, router])

    const handleAgeVerified = async () => {
        await recheckVerification()
        setShowAgeModal(false)
        toast.success('Age verified!')

        // Check if all requirements are met
        setTimeout(() => {
            if (isVerified) {
                router.push('/sangha')
            }
        }, 500)
    }

    const handleEmailVerification = () => {
        toast('Please check your email for verification link', {
            icon: 'ℹ️'
        })
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    const requirements = [
        {
            key: 'age_verified',
            title: 'Age Verification',
            description: 'Verify you are 18 years or older',
            completed: !missingRequirements.includes('age_verified'),
            action: () => setShowAgeModal(true)
        },
        {
            key: 'email_verified',
            title: 'Email Verification',
            description: 'Verify your email address',
            completed: !missingRequirements.includes('email_verified'),
            action: handleEmailVerification
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Complete Verification
                    </h1>
                    <p className="text-stone-400">
                        Complete these steps to access Study Match and Sangha
                    </p>
                </div>

                {/* Requirements List */}
                <div className="space-y-4">
                    {requirements.map((req) => (
                        <div
                            key={req.key}
                            className={`bg-stone-900/50 backdrop-blur-xl rounded-xl border p-6 transition-all ${req.completed
                                ? 'border-green-500/50 bg-green-500/5'
                                : 'border-white/10 hover:border-orange-500/50'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Status Icon */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${req.completed
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-orange-500/20 text-orange-500'
                                    }`}>
                                    {req.completed ? (
                                        <CheckCircle className="w-6 h-6" />
                                    ) : (
                                        <Circle className="w-6 h-6" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {req.title}
                                    </h3>
                                    <p className="text-sm text-stone-400 mb-3">
                                        {req.description}
                                    </p>

                                    {!req.completed && (
                                        <button
                                            onClick={req.action}
                                            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
                                        >
                                            Complete Now
                                        </button>
                                    )}

                                    {req.completed && (
                                        <div className="text-sm text-green-500 font-medium">
                                            ✓ Completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Continue Button */}
                {isVerified && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => router.push('/sangha')}
                            className="px-8 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                        >
                            Continue to Sangha
                        </button>
                    </div>
                )}
            </div>

            {/* Age Verification Modal */}
            <AgeVerificationModal
                isOpen={showAgeModal}
                onClose={() => setShowAgeModal(false)}
                required={true}
                onVerified={handleAgeVerified}
            />
        </div>
    )
}
