'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Video, Users, BookOpen, Sparkles, ArrowRight, Play, Flame } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function HomePage() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
    const [user, setUser] = useState<any>(null)
    const searchParams = useSearchParams()

    useEffect(() => {
        // Check for auth errors from redirect
        const error = searchParams.get('error')
        if (error) {
            let errorMessage = 'Authentication failed. Please try again.'
            let errorIcon = '⚠️'

            if (error === 'link_expired') {
                errorMessage = 'Password reset link has expired. Please request a new one.'
                errorIcon = '⏰'
            } else if (error === 'link_used') {
                errorMessage = 'This link has already been used. Please request a new password reset.'
                errorIcon = '🔒'
            } else if (error === 'access_denied') {
                errorMessage = 'Access denied. The link may be invalid or expired.'
                errorIcon = '🚫'
            }

            toast.error(errorMessage, {
                duration: 7000,
                icon: errorIcon
            })
            // Clean up URL
            window.history.replaceState({}, '', '/')
        }
    }, [searchParams])

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const openAuthModal = (mode: 'signin' | 'signup') => {
        setAuthMode(mode)
        setIsAuthModalOpen(true)
    }

    return (
        <div className="min-h-screen bg-vedic-pattern text-white font-sans selection:bg-orange-500/30">

            {/* 🕉️ Floating Pill Navigation - Compact */}
            <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
                <nav className="bg-[#221F1D]/90 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 flex items-center justify-between w-full max-w-2xl shadow-2xl shadow-black/50">

                    {/* Logo Section */}
                    <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/20">
                            <Flame className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-heading font-bold text-white tracking-wide">Gurukul</span>
                    </div>

                    {/* Links - Hidden on mobile, visible on lg */}
                    <div className="hidden md:flex items-center space-x-6">
                        {['Study Halls', 'Find a Guru', 'Sangha'].map((item) => (
                            <Link
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                className="text-stone-400 hover:text-orange-500 transition-colors font-medium text-xs tracking-wide"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <Link
                                href="/dashboard"
                                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-1.5 px-5 rounded-full transition-all shadow-lg shadow-orange-900/40 flex items-center space-x-2"
                            >
                                <span>Go to Dashboard</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={() => openAuthModal('signin')}
                                    className="text-stone-300 hover:text-white font-medium text-xs transition-colors hidden sm:block"
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => openAuthModal('signup')}
                                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-1.5 px-5 rounded-full transition-all shadow-lg shadow-orange-900/40"
                                >
                                    Begin Journey
                                </button>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            {/* 📜 Hero Section */}
            <section className="relative pt-32 pb-20 px-4 min-h-screen flex items-center overflow-hidden">
                <div className="container mx-auto max-w-7xl relative z-10">
                    <div className="grid lg:grid-cols-12 gap-12 items-center">

                        {/* Left Content - Wider (7 cols) */}
                        <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
                            <div className="inline-flex items-center px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/5">
                                <Sparkles className="w-4 h-4 text-orange-500 mr-2" />
                                <span className="text-xs font-bold text-orange-400 tracking-widest uppercase">Vidya Dadati Vinayam</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-heading font-medium leading-tight text-white">
                                The Modern <br />
                                <span className="text-orange-500 font-bold">Gurukul</span> for <br />
                                Aspiring Minds.
                            </h1>

                            <p className="text-lg text-stone-400 leading-relaxed max-w-lg font-light">
                                Rediscover the ancient art of learning in a digital age. Connect with peers, find mentors, and focus on your path to wisdom.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                {user ? (
                                    <Link
                                        href="/dashboard"
                                        className="btn-vedic text-lg px-8 py-4 flex items-center justify-center space-x-2"
                                    >
                                        <span>Go to Dashboard</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => openAuthModal('signup')}
                                        className="btn-vedic text-lg px-8 py-4"
                                    >
                                        Join the Sangha
                                    </button>
                                )}

                                <button
                                    className="bg-transparent border border-stone-700 text-stone-300 hover:bg-stone-800 px-8 py-4 text-lg rounded-full transition-all"
                                >
                                    <span className="flex items-center"><Play className="w-5 h-5 mr-2 fill-current" /> Watch Demo</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-4 pt-6 opacity-80">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[#181614] bg-stone-800 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-stone-400">
                                    <span className="text-orange-500 font-bold">10,000+</span> Shishyas Trusted
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Hero Image - Narrower (5 cols) & Tilted */}
                        <div className="lg:col-span-5 relative w-full perspective-container" style={{ perspective: '1000px' }}>
                            <div
                                className="relative h-[500px] w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50 group transition-all duration-500 ease-out hover:rotate-0 hover:scale-105"
                                style={{ transform: 'rotateY(-6deg) rotateX(2deg) rotateZ(-1deg)', transformStyle: 'preserve-3d' }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop"
                                    alt="Students studying in library"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#181614] via-transparent to-transparent opacity-60" />

                                {/* Floating Card - Also Tilted slightly to pop */}
                                <div
                                    className="absolute bottom-8 left-8 right-8 bg-[#221F1D]/90 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-xl"
                                    style={{ transform: 'translateZ(20px)' }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center space-x-2 text-orange-500 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                <span className="text-xs font-bold tracking-wider uppercase">Live Session</span>
                                            </div>
                                            <h3 className="text-xl font-heading font-bold text-white">UPSC Prep Group</h3>
                                            <p className="text-stone-400 text-sm">124 Shishyas focusing</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center border border-white/10">
                                            <Video className="w-6 h-6 text-stone-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🔱 Features Section */}
            <section className="py-24 px-4 relative">
                <div className="container mx-auto max-w-7xl relative z-10">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl lg:text-5xl font-heading font-medium text-white">
                            Tools for the <span className="text-orange-500">Modern Scholar</span>
                        </h2>
                        <p className="text-lg text-stone-400 max-w-2xl mx-auto font-light">
                            Ancient wisdom meets modern technology. Everything you need to excel in your academic journey.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="feature-card group">
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop"
                                    alt="Virtual Ashram"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-4 left-4 feature-icon-badge">
                                    <Video className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-heading font-bold text-white mb-3">Virtual Ashrams</h3>
                                <p className="text-stone-400 leading-relaxed text-sm">
                                    Join quiet study rooms or collaborative sessions. Experience the focus of a traditional ashram from your home.
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="feature-card group">
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop"
                                    alt="Peer Sangha"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-4 left-4 feature-icon-badge">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-heading font-bold text-white mb-3">Peer Sangha</h3>
                                <p className="text-stone-400 leading-relaxed text-sm">
                                    Connect with a community of like-minded scholars. Share knowledge, resolve doubts, and grow together.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="feature-card group">
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop"
                                    alt="Knowledge Repository"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-4 left-4 feature-icon-badge">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-heading font-bold text-white mb-3">Knowledge Repository</h3>
                                <p className="text-stone-400 leading-relaxed text-sm">
                                    Access a vast library of notes, papers, and resources shared by the community. Knowledge grows when shared.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🗣️ Testimonials */}
            <section className="py-24 px-4">
                <div className="container mx-auto max-w-7xl">
                    <h2 className="text-4xl font-heading font-medium text-center mb-16 text-white">
                        Voices of the <span className="text-orange-500">Sangha</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Aarav Sharma",
                                role: "UPSC Aspirant",
                                quote: "Gurukul has completely changed how I prepare for my exams. The focus rooms are a game changer.",
                                initial: "A"
                            },
                            {
                                name: "Diya Patel",
                                role: "Medical Student",
                                quote: "Finding a study partner for NEET was so hard until I joined this platform. Highly recommended!",
                                initial: "D"
                            },
                            {
                                name: "Vihaan Gupta",
                                role: "CA Student",
                                quote: "The community is so supportive. It feels like a real family of learners.",
                                initial: "V"
                            }
                        ].map((testimonial, i) => (
                            <div key={i} className="testimonial-card">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xl">
                                        {testimonial.initial}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{testimonial.name}</div>
                                        <div className="text-xs text-stone-500 uppercase tracking-wider">{testimonial.role}</div>
                                    </div>
                                </div>
                                <p className="text-stone-400 italic leading-relaxed">"{testimonial.quote}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🌅 CTA Section */}
            <section className="py-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/5 to-transparent pointer-events-none" />
                <div className="container mx-auto max-w-4xl relative z-10 text-center">
                    <h2 className="text-5xl lg:text-7xl font-heading font-medium mb-8 text-white">
                        Begin Your Path to <span className="text-orange-500 font-bold">Wisdom</span>
                    </h2>
                    <p className="text-xl text-stone-400 mb-12 max-w-2xl mx-auto font-light">
                        Join thousands of students across India who are redefining their academic journey.
                    </p>

                    {user ? (
                        <Link
                            href="/dashboard"
                            className="btn-vedic text-xl px-12 py-5 inline-flex items-center space-x-3"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                    ) : (
                        <button
                            onClick={() => openAuthModal('signup')}
                            className="btn-vedic text-xl px-12 py-5"
                        >
                            Start Learning Now
                        </button>
                    )}

                    <p className="mt-8 text-stone-500 text-sm">Free for all students • Satyam Shivam Sundaram</p>
                </div>
            </section>

            {/* 🦶 Footer - Simplified & Smaller */}
            <footer className="py-6 px-4 border-t border-white/5 bg-[#181614]">
                <div className="container mx-auto max-w-3xl flex flex-col md:flex-row justify-between items-center text-xs text-stone-500">
                    <div className="flex items-center space-x-2 mb-3 md:mb-0">
                        <Flame className="w-3.5 h-3.5 text-orange-600" />
                        <span className="font-bold text-stone-400 text-xs">Gurukul</span>
                    </div>

                    <div className="flex space-x-5">
                        <a href="#" className="hover:text-orange-500 transition-colors">Dharma</a>
                        <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-orange-500 transition-colors">Contact</a>
                    </div>

                    <div className="mt-3 md:mt-0">
                        © 2024
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
            />
        </div>
    )
}
