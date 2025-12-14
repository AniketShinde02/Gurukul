'use client'

import { useState } from 'react'
import { X, AlertTriangle, Flag } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    reportedUserId: string
    reportedUsername: string
    sessionId?: string
}

const REPORT_REASONS = [
    { value: 'inappropriate_behavior', label: 'Inappropriate Behavior', icon: '⚠️' },
    { value: 'harassment', label: 'Harassment or Bullying', icon: '😡' },
    { value: 'spam', label: 'Spam or Advertising', icon: '📢' },
    { value: 'nudity', label: 'Nudity or Sexual Content', icon: '🔞' },
    { value: 'violence', label: 'Violence or Threats', icon: '⚔️' },
    { value: 'other', label: 'Other', icon: '❓' },
]

export function ReportModal({
    isOpen,
    onClose,
    reportedUserId,
    reportedUsername,
    sessionId
}: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!selectedReason) {
            toast.error('Please select a reason')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reported_id: reportedUserId,
                    session_id: sessionId,
                    reason: selectedReason,
                    description: description.trim() || null
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit report')
            }

            toast.success('Report submitted successfully')

            if (data.user_banned) {
                toast.success('User has been automatically banned', { duration: 5000 })
            }

            onClose()

            // Reset form
            setSelectedReason('')
            setDescription('')

        } catch (error: any) {
            console.error('Report error:', error)
            toast.error(error.message || 'Failed to submit report')
        } finally {
            setIsSubmitting(false)
        }
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
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-stone-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <Flag className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Report User</h2>
                                        <p className="text-sm text-stone-400">@{reportedUsername}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                                {/* Warning */}
                                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-stone-300">
                                        <p className="font-semibold text-yellow-500 mb-1">Important</p>
                                        <p>False reports may result in action against your account. Only report genuine violations.</p>
                                    </div>
                                </div>

                                {/* Reason Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-3">
                                        Why are you reporting this user?
                                    </label>
                                    <div className="space-y-2">
                                        {REPORT_REASONS.map((reason) => (
                                            <button
                                                key={reason.value}
                                                onClick={() => setSelectedReason(reason.value)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedReason === reason.value
                                                        ? 'bg-orange-500/20 border-orange-500/50 text-white'
                                                        : 'bg-stone-800/50 border-white/10 text-stone-300 hover:bg-stone-800 hover:border-white/20'
                                                    }`}
                                            >
                                                <span className="text-xl">{reason.icon}</span>
                                                <span className="text-sm font-medium">{reason.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">
                                        Additional details (optional)
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Provide more context about what happened..."
                                        className="w-full h-24 px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white placeholder:text-stone-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 resize-none"
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-stone-500 mt-1">
                                        {description.length}/500 characters
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 p-6 border-t border-white/10">
                                <button
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selectedReason || isSubmitting}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Flag className="w-4 h-4" />
                                            Submit Report
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
