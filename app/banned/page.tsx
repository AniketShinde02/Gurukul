'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Clock, Mail } from 'lucide-react'

export default function BannedPage() {
    const router = useRouter()
    const [banDetails, setBanDetails] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkBanStatus()
    }, [])

    const checkBanStatus = async () => {
        try {
            const response = await fetch('/api/reports')
            const data = await response.json()

            if (!data.is_banned) {
                // Not banned, redirect to home
                router.push('/sangha')
                return
            }

            setBanDetails(data.ban_details)
        } catch (error) {
            console.error('Error checking ban status:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
        )
    }

    const isPermanent = !banDetails?.banned_until
    const bannedUntil = banDetails?.banned_until ? new Date(banDetails.banned_until) : null
    const timeRemaining = bannedUntil ? bannedUntil.getTime() - Date.now() : 0
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Ban Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
                        <Ban className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Account Suspended
                    </h1>
                    <p className="text-stone-400 mb-6">
                        Your account has been temporarily suspended due to violations of our community guidelines.
                    </p>

                    {/* Ban Details */}
                    <div className="space-y-4 mb-6">
                        {/* Reason */}
                        <div className="bg-stone-800/50 rounded-lg p-4 border border-white/5">
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Reason</p>
                            <p className="text-white font-medium">{banDetails?.reason || 'Violation of community guidelines'}</p>
                        </div>

                        {/* Duration */}
                        <div className="bg-stone-800/50 rounded-lg p-4 border border-white/5">
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Duration</p>
                            {isPermanent ? (
                                <p className="text-red-400 font-medium">Permanent Ban</p>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-white">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <p className="font-medium">
                                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                                    </p>
                                </div>
                            )}
                        </div>

                        {bannedUntil && (
                            <div className="bg-stone-800/50 rounded-lg p-4 border border-white/5">
                                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Expires On</p>
                                <p className="text-white font-medium">
                                    {bannedUntil.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Appeal */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-blue-400 mb-1">
                                    Think this is a mistake?
                                </p>
                                <p className="text-xs text-stone-400">
                                    Contact us at{' '}
                                    <a
                                        href="mailto:support@gurukul.com"
                                        className="text-blue-400 hover:underline"
                                    >
                                        support@gurukul.com
                                    </a>
                                    {' '}to appeal this decision.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-medium transition-colors"
                        >
                            Go to Home
                        </button>
                        <button
                            onClick={checkBanStatus}
                            className="w-full px-4 py-2.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-medium transition-colors"
                        >
                            Check Status Again
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-stone-500 mt-6">
                    Please review our{' '}
                    <a href="/community-guidelines" className="text-orange-500 hover:underline">
                        Community Guidelines
                    </a>
                    {' '}to avoid future violations.
                </p>
            </div>
        </div>
    )
}
