'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, User, Mail, MapPin, Target, Calendar, Loader2, Shield, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { getAgeVerificationStatus, calculateAge } from '@/lib/ageVerification'

interface ProfileCompletionModalProps {
    isOpen: boolean
    onComplete: () => void
}

export default function ProfileCompletionModal({ isOpen, onComplete }: ProfileCompletionModalProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        bio: '',
        location: '',
        session: '',
        date_of_birth: '',
    })

    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [acknowledgedMinorRisk, setAcknowledgedMinorRisk] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadUserData()
        }
    }, [isOpen])

    const loadUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        // Load existing profile data
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                username: profile.username || '',
                bio: profile.bio || '',
                location: profile.location || '',
                session: profile.session || '',
                date_of_birth: profile.date_of_birth || '',
            })
        }
    }

    const handleNext = () => {
        // Validation for each step
        if (step === 1 && (!formData.full_name || !formData.username)) {
            toast.error('Please fill in all required fields')
            return
        }
        if (step === 2 && !formData.session) {
            toast.error('Please enter your study goal')
            return
        }
        if (step === 3 && !formData.date_of_birth) {
            toast.error('Please enter your date of birth')
            return
        }
        if (step === 4 && !agreedToTerms) {
            toast.error('Please agree to the terms and privacy policy')
            return
        }

        if (step < 4) {
            setStep(step + 1)
        } else {
            handleComplete()
        }
    }

    const handleComplete = async () => {
        if (!userId) return

        setLoading(true)
        try {
            // Use centralized age verification
            const ageStatus = getAgeVerificationStatus(formData.date_of_birth)

            // Check platform access
            if (!ageStatus.canAccessPlatform) {
                toast.error(ageStatus.restrictionMessage || 'Access denied')
                setLoading(false)
                return
            }

            // For 16-17 year olds, require explicit acknowledgement
            if (ageStatus.age >= 16 && ageStatus.age < 18 && !acknowledgedMinorRisk) {
                toast.error('Please acknowledge the platform responsibility notice')
                setLoading(false)
                return
            }

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    username: formData.username,
                    bio: formData.bio,
                    location: formData.location,
                    session: formData.session,
                    date_of_birth: formData.date_of_birth,
                    age_verified: ageStatus.age >= 18,
                    profile_completed: true,
                    onboarding_completed_at: new Date().toISOString(),
                })
                .eq('id', userId)

            if (error) throw error

            toast.success('Profile completed! 🎉')
            onComplete()
        } catch (error: any) {
            console.error('Error completing profile:', error)
            toast.error(error.message || 'Failed to complete profile')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const totalSteps = 4
    const progress = (step / totalSteps) * 100

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1C1917] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Shield className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
                                <p className="text-sm text-stone-400">Step {step} of {totalSteps}</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[400px]">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Let's start with the basics</h3>
                                <p className="text-stone-400 text-sm">Tell us who you are</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">
                                        Full Name <span className="text-orange-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full bg-[#2C2927] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">
                                        Username <span className="text-orange-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                            className="w-full bg-[#2C2927] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                                            placeholder="Choose a unique username"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">
                                        Location
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-[#2C2927] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                                            placeholder="City, Country"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Study Goal */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">What's your study goal?</h3>
                                <p className="text-stone-400 text-sm">This helps us match you with the right study partners</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">
                                    Current Session / Goal <span className="text-orange-500">*</span>
                                </label>
                                <div className="relative">
                                    <Target className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
                                    <input
                                        type="text"
                                        value={formData.session}
                                        onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                                        className="w-full bg-[#2C2927] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                                        placeholder="e.g., JEE 2025, NEET 2024, UPSC 2023"
                                    />
                                </div>
                                <p className="text-xs text-stone-500 mt-2">Examples: JEE 2025, NEET 2024, UPSC 2023, Class 12 CBSE, CA Final</p>
                            </div>

                            {/* Popular Goals */}
                            <div>
                                <p className="text-xs text-stone-500 mb-3">Popular goals:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['JEE 2025', 'NEET 2024', 'UPSC 2023', 'Class 12', 'GATE 2025', 'CAT 2024'].map((goal) => (
                                        <button
                                            key={goal}
                                            onClick={() => setFormData({ ...formData, session: goal })}
                                            className="px-4 py-2 bg-stone-800/50 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/50 rounded-full text-sm text-stone-300 hover:text-orange-500 transition-all"
                                        >
                                            {goal}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Age Verification */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Verify your age</h3>
                                <p className="text-stone-400 text-sm">You must be at least 13 years old to use Gurukul</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">
                                    Date of Birth <span className="text-orange-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-[#2C2927] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                                    />
                                </div>
                                <p className="text-xs text-stone-500 mt-2">
                                    🔒 Your date of birth is kept private and secure
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Terms & Bio */}
                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Final Step</h3>
                                <p className="text-stone-400 text-sm">Review and accept our terms</p>
                            </div>

                            {/* Age-based warning for 16-17 year olds */}
                            {formData.date_of_birth && (() => {
                                const age = calculateAge(formData.date_of_birth)
                                return age >= 16 && age < 18 ? (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-amber-500 text-sm">Important Notice for Users Under 18</h4>
                                                <p className="text-xs text-stone-300 leading-relaxed">
                                                    As a user between 16-17 years old, you have limited access to certain features.
                                                    Video matching and some community features require you to be 18+.
                                                    By continuing, you acknowledge that you understand these restrictions and take
                                                    responsibility for your use of this platform.
                                                </p>
                                                <label className="flex items-start gap-2 cursor-pointer mt-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={acknowledgedMinorRisk}
                                                        onChange={(e) => setAcknowledgedMinorRisk(e.target.checked)}
                                                        className="mt-1 w-4 h-4 rounded border-amber-500/50 bg-amber-500/10 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                                                    />
                                                    <span className="text-xs text-stone-300">
                                                        I understand and acknowledge the platform restrictions for my age group
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ) : null
                            })()}

                            {/* Privacy Policy & Terms */}
                            <div className="bg-stone-800/30 border border-white/10 rounded-xl p-4">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        Terms & Privacy
                                    </h4>
                                    <p className="text-xs text-stone-400 leading-relaxed">
                                        By using Gurukul, you confirm that:
                                    </p>
                                    <ul className="text-xs text-stone-400 space-y-1.5 ml-4">
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>You meet the minimum age requirement (16+)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>The information you provided is accurate and truthful</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>You agree to use this platform responsibly and respectfully</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>You understand that your data will be stored securely and used only for platform functionality</span>
                                        </li>
                                    </ul>
                                    <label className="flex items-start gap-3 cursor-pointer mt-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-blue-500/50 bg-blue-500/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <span className="text-sm text-stone-300">
                                            I agree to the <span className="text-blue-500 hover:underline">Terms of Service</span> and <span className="text-blue-500 hover:underline">Privacy Policy</span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Optional Bio */}
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">
                                    Bio (Optional)
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={4}
                                    maxLength={400}
                                    className="w-full bg-[#2C2927] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all resize-none"
                                    placeholder="Tell us about your study goals and interests (optional)..."
                                />
                                <div className="text-right text-xs text-stone-500 mt-1">
                                    {formData.bio.length}/400
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-between">
                    <button
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                        className="px-6 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Completing...
                            </>
                        ) : step === 4 ? (
                            'Complete Profile'
                        ) : (
                            'Next'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
