'use client'

import { useState } from 'react'
import { X, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface AgeVerificationModalProps {
    isOpen: boolean
    onClose: () => void
    onVerified?: () => void
    required?: boolean // If true, user can't close without verifying
}

export function AgeVerificationModal({
    isOpen,
    onClose,
    onVerified,
    required = false
}: AgeVerificationModalProps) {
    const router = useRouter()
    const [day, setDay] = useState('')
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        setError('')

        // Validation
        if (!day || !month || !year) {
            setError('Please enter your complete date of birth')
            return
        }

        const dayNum = parseInt(day)
        const monthNum = parseInt(month)
        const yearNum = parseInt(year)

        if (dayNum < 1 || dayNum > 31) {
            setError('Invalid day')
            return
        }

        if (monthNum < 1 || monthNum > 12) {
            setError('Invalid month')
            return
        }

        if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
            setError('Invalid year')
            return
        }

        // Create date string (YYYY-MM-DD)
        const dateOfBirth = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/verify-age', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_of_birth: dateOfBirth })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify age')
            }

            if (data.verified) {
                toast.success('Age verified! You can now access video matching')
                onVerified?.()
                onClose()
                router.refresh()
            } else {
                setError('You must be 18 or older to access video matching')
                toast.error('You must be 18+ to use video matching')
            }

        } catch (error: any) {
            console.error('Age verification error:', error)
            setError(error.message || 'Failed to verify age')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (required) {
            toast.error('Age verification is required to continue')
            return
        }
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-stone-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Age Verification</h2>
                                        <p className="text-sm text-stone-400">Required for video matching</p>
                                    </div>
                                </div>
                                {!required && (
                                    <button
                                        onClick={handleClose}
                                        className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Legal Notice */}
                                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-stone-300">
                                        <p className="font-semibold text-blue-400 mb-1">18+ Required</p>
                                        <p>You must be 18 years or older to access video matching features. Your date of birth will be stored securely.</p>
                                    </div>
                                </div>

                                {/* Date Input */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-3">
                                        Enter your date of birth
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* Day */}
                                        <div>
                                            <label className="block text-xs text-stone-500 mb-1">Day</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={day}
                                                onChange={(e) => setDay(e.target.value)}
                                                placeholder="DD"
                                                className="w-full px-3 py-2 bg-stone-800 border border-white/10 rounded-lg text-white text-center placeholder:text-stone-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                            />
                                        </div>

                                        {/* Month */}
                                        <div>
                                            <label className="block text-xs text-stone-500 mb-1">Month</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={month}
                                                onChange={(e) => setMonth(e.target.value)}
                                                placeholder="MM"
                                                className="w-full px-3 py-2 bg-stone-800 border border-white/10 rounded-lg text-white text-center placeholder:text-stone-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                            />
                                        </div>

                                        {/* Year */}
                                        <div>
                                            <label className="block text-xs text-stone-500 mb-1">Year</label>
                                            <input
                                                type="number"
                                                min="1900"
                                                max={new Date().getFullYear()}
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                placeholder="YYYY"
                                                className="w-full px-3 py-2 bg-stone-800 border border-white/10 rounded-lg text-white text-center placeholder:text-stone-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                        {error}
                                    </div>
                                )}

                                {/* Privacy Notice */}
                                <p className="text-xs text-stone-500">
                                    Your date of birth is stored securely and used only for age verification. We comply with all data protection regulations.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 p-6 border-t border-white/10">
                                {!required && (
                                    <button
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-medium transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !day || !month || !year}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Verify Age
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
