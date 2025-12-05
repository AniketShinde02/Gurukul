'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Lock, Save, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [sessionLoading, setSessionLoading] = useState(true)

    // Verify session on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error('Invalid or expired session. Please try resetting your password again.')
                router.push('/')
            }
            setSessionLoading(false)
        }
        checkSession()
    }, [router])

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            toast.success('Password updated successfully!')
            router.push('/dashboard')
        } catch (error: any) {
            console.error('Error updating password:', error)
            toast.error(error.message || 'Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    if (sessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-10">
            <h1 className="text-3xl font-heading font-bold text-white mb-2 text-center">Set New Password</h1>
            <p className="text-stone-400 text-center mb-8">
                Please enter your new password below.
            </p>

            <div className="bg-[#221F1D] border border-white/5 rounded-2xl p-8 shadow-xl">
                <form onSubmit={handleResetPassword} className="space-y-6">
                    {/* New Password */}
                    <div>
                        <label className="block text-stone-300 text-sm font-medium mb-2">New Password</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#0C0A09] border border-stone-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-stone-600 focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-stone-300 text-sm font-medium mb-2">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#0C0A09] border border-stone-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-stone-600 focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Updating...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Update Password</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
