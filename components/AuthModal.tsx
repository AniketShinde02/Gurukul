'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Mail, Lock, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    initialMode?: 'signin' | 'signup'
}

type AuthView = 'signin' | 'signup' | 'forgot_password'

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [view, setView] = useState<AuthView>(initialMode)

    // Update view when initialMode changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setView(initialMode)
        }
    }, [isOpen, initialMode])

    const handleOAuthSignIn = async (provider: 'google' | 'github') => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (error) {
            toast.error('Failed to sign in. Please try again.')
            console.error('OAuth error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            if (view === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                toast.success('Confirmation email sent! Please check your inbox.')
                setView('signin')
            } else if (view === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                toast.success('Welcome back!')
                onClose()
            } else if (view === 'forgot_password') {
                console.log('Resetting password for:', email)
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/callback?next=/profile/reset-password`,
                })
                if (error) throw error
                toast.success('Password reset link sent! Check your email.')
                setView('signin')
            }
        } catch (error: any) {
            console.error('Auth error:', error)
            toast.error(error.message || 'An error occurred.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="!fixed inset-0 !z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-[#221F1D] border border-white/10 rounded-3xl shadow-2xl shadow-black/50 w-full max-w-md p-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors text-stone-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-heading font-bold text-white mb-2">
                        {view === 'signup' ? 'Join Gurukul' : view === 'forgot_password' ? 'Reset Password' : 'Welcome Back'}
                    </h2>
                    <p className="text-stone-400 text-sm">
                        {view === 'signup'
                            ? 'Begin your journey to wisdom'
                            : view === 'forgot_password'
                                ? 'Enter your email to receive a reset link'
                                : 'Continue your path to knowledge'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-5">
                    {/* Email Input */}
                    <div>
                        <label className="block text-stone-300 text-sm font-medium mb-2">Email</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="your@email.com"
                                className="w-full bg-[#0C0A09] border border-stone-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-stone-600 focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password Input (Hidden for Forgot Password) */}
                    {view !== 'forgot_password' && (
                        <div>
                            <label className="block text-stone-300 text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-[#0C0A09] border border-stone-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-stone-600 focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Remember Me / Forgot Password */}
                    {view === 'signin' && (
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center space-x-2 cursor-pointer text-stone-400 hover:text-stone-300">
                                <input type="checkbox" className="rounded border-stone-700 bg-stone-900 text-orange-600 focus:ring-orange-600/20" />
                                <span>Remember me</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setView('forgot_password')}
                                className="text-orange-500 hover:text-orange-400 font-medium"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/40 hover:shadow-orange-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading
                            ? 'Processing...'
                            : view === 'signup'
                                ? 'Create Account'
                                : view === 'forgot_password'
                                    ? 'Send Reset Link'
                                    : 'Sign In'}
                    </button>

                    {/* Back to Sign In (for Forgot Password) */}
                    {view === 'forgot_password' && (
                        <button
                            type="button"
                            onClick={() => setView('signin')}
                            className="w-full flex items-center justify-center space-x-2 text-stone-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Sign In</span>
                        </button>
                    )}

                    {/* Toggle Sign Up / Sign In */}
                    {view !== 'forgot_password' && (
                        <p className="text-center text-stone-400 text-sm">
                            {view === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                type="button"
                                onClick={() => setView(view === 'signup' ? 'signin' : 'signup')}
                                className="ml-2 text-orange-500 hover:text-orange-400 font-semibold"
                            >
                                {view === 'signup' ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    )}

                    {/* Divider & OAuth (Hidden for Forgot Password) */}
                    {view !== 'forgot_password' && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-stone-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-3 bg-[#221F1D] text-stone-500">Or continue with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleOAuthSignIn('google')}
                                    disabled={isLoading}
                                    className="flex items-center justify-center space-x-2 bg-[#0C0A09] border border-stone-800 hover:border-orange-600/50 text-stone-300 hover:text-white py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="text-sm font-medium">Google</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleOAuthSignIn('github')}
                                    disabled={isLoading}
                                    className="flex items-center justify-center space-x-2 bg-[#0C0A09] border border-stone-800 hover:border-orange-600/50 text-stone-300 hover:text-white py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <span className="text-sm font-medium">GitHub</span>
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    )
}
