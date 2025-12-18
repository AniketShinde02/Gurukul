'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Video, Users, BookOpen, Sparkles, ArrowRight, Play, Flame } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { getLandingStats } from '@/lib/landing-stats'

function AuthErrorListener() {
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

    return null
}

export default function HomePage() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
    const [user, setUser] = useState<any>(null)

    // Get static landing stats (no API calls, instant load)
    const stats = getLandingStats()

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
            <Suspense fallback={null}>
                <AuthErrorListener />
            </Suspense>

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
                        {[
                            { name: 'Study Halls', href: '/rooms' },
                            { name: 'Find a Guru', href: '#find-a-guru' },
                            { name: 'Sangha', href: '/sangha' }
                        ].map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-stone-400 hover:text-orange-500 transition-colors font-medium text-xs tracking-wide"
                            >
                                {item.name}
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
                                Where Students <br />
                                <span className="text-orange-500 font-bold">Connect</span> and <br />
                                Study Together.
                            </h1>

                            <p className="text-lg text-stone-400 leading-relaxed max-w-lg font-light">
                                Find study buddies, join focused rooms, and collaborate with students working towards the same goals.
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

                            {/* Show user count or beta badge based on launch phase */}
                            {stats.showUserCount ? (
                                <div className="flex items-center space-x-4 pt-6 opacity-80">
                                    {stats.showAvatars && (
                                        <div className="flex -space-x-3">
                                            {stats.avatars.map((avatar, i) => (
                                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#181614] bg-stone-800 overflow-hidden">
                                                    <img src={avatar} alt="Community member" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="text-sm text-stone-400">
                                        <span className="text-orange-500 font-bold">
                                            {stats.userCount >= 1000
                                                ? `${Math.floor(stats.userCount / 1000)}k+`
                                                : `${stats.userCount}+`
                                            }
                                        </span> Shishyas Trusted
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-4 pt-6">
                                    <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                        <span className="text-sm text-orange-400 font-medium">Beta Launch</span>
                                    </div>
                                    <span className="text-sm text-stone-400">Be among the first to join</span>
                                </div>
                            )}
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
                                                <span className="text-xs font-bold tracking-wider uppercase">Study Rooms</span>
                                            </div>
                                            <h3 className="text-xl font-heading font-bold text-white">
                                                {stats.featuredRoom.emoji} {stats.featuredRoom.name}
                                            </h3>
                                            <p className="text-stone-400 text-sm">{stats.featuredRoom.description}</p>
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

            {/* ✨ Matchmaking Teaser - Top */}
            <section className="py-20 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                <div className="container mx-auto max-w-5xl relative z-10">
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                            <Sparkles className="w-4 h-4 text-orange-500 mr-2 animate-pulse" />
                            <span className="text-sm font-bold text-orange-400 tracking-wider uppercase">Unique Feature</span>
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white">
                            Meet Your Perfect <span className="text-orange-500">Study Buddy</span>
                        </h2>

                        <p className="text-xl text-stone-400 max-w-2xl mx-auto">
                            Our smart matchmaking connects you with students studying the same subjects, preparing for the same exams, or working towards similar goals.
                        </p>

                        <div className="grid md:grid-cols-3 gap-6 pt-8">
                            <div className="bg-[#221F1D]/40 backdrop-blur-sm border border-orange-500/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all group">
                                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
                                <h3 className="text-lg font-bold text-white mb-2">Same Goals</h3>
                                <p className="text-sm text-stone-400">Match with students preparing for the same exams</p>
                            </div>
                            <div className="bg-[#221F1D]/40 backdrop-blur-sm border border-orange-500/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all group">
                                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📚</div>
                                <h3 className="text-lg font-bold text-white mb-2">Same Subjects</h3>
                                <p className="text-sm text-stone-400">Find peers studying the same topics as you</p>
                            </div>
                            <div className="bg-[#221F1D]/40 backdrop-blur-sm border border-orange-500/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all group">
                                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
                                <h3 className="text-lg font-bold text-white mb-2">Instant Connect</h3>
                                <p className="text-sm text-stone-400">Start studying together in seconds</p>
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
                            Study <span className="text-orange-500">Your Way</span>
                        </h2>
                        <p className="text-lg text-stone-400 max-w-2xl mx-auto font-light">
                            Choose how you want to study — solo focus rooms, group sessions, or find a study partner.
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
                                <h3 className="text-2xl font-heading font-bold text-white mb-3">Study Rooms</h3>
                                <p className="text-stone-400 leading-relaxed text-sm">
                                    Join quiet focus rooms or group study sessions. Create your own space or join existing ones.
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
                                <h3 className="text-2xl font-heading font-bold text-white mb-3">Student Community</h3>
                                <p className="text-stone-400 leading-relaxed text-sm">
                                    Connect with other students. Share notes, discuss topics, and help each other learn.
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
                                <h3 className="text-2xl font-heading font-bold text-white mb-3">Shared Resources</h3>
                                <p className="text-stone-400 leading-relaxed text-sm">
                                    Access notes, papers, and study materials shared by other students in the community.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🎲 Matchmaking Deep Dive - How It Works */}
            <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-transparent via-orange-500/5 to-transparent">
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl lg:text-6xl font-heading font-bold text-white">
                            How <span className="text-orange-500">Matchmaking</span> Works
                        </h2>
                        <p className="text-xl text-stone-400 max-w-3xl mx-auto">
                            Finding the right study partner shouldn't be hard. We make it instant and effortless.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-16">
                        {/* Left: Visual Steps */}
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4 group">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-orange-500 font-bold text-lg group-hover:scale-110 transition-transform">
                                    1
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Tell Us What You're Studying</h3>
                                    <p className="text-stone-400">Select your subject, exam, or topic you want to focus on today.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4 group">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-orange-500 font-bold text-lg group-hover:scale-110 transition-transform">
                                    2
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">We Find Your Match</h3>
                                    <p className="text-stone-400">Our system connects you with students studying the same thing, right now.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4 group">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-orange-500 font-bold text-lg group-hover:scale-110 transition-transform">
                                    3
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Start Studying Together</h3>
                                    <p className="text-stone-400">Jump into a video call, share screens, discuss concepts, and learn together.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Benefits Cards */}
                        <div className="space-y-4">
                            <div className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="text-2xl">🔍</div>
                                    <h4 className="text-lg font-bold text-white">Smart Matching</h4>
                                </div>
                                <p className="text-sm text-stone-400">No random connections. Only students with matching study goals and subjects.</p>
                            </div>

                            <div className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="text-2xl">⏱️</div>
                                    <h4 className="text-lg font-bold text-white">Real-Time Availability</h4>
                                </div>
                                <p className="text-sm text-stone-400">Match with students who are online and ready to study right now.</p>
                            </div>

                            <div className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="text-2xl">🎯</div>
                                    <h4 className="text-lg font-bold text-white">Goal-Oriented Sessions</h4>
                                </div>
                                <p className="text-sm text-stone-400">Set session goals, track progress, and stay accountable together.</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-orange-500/10 border border-orange-500/30">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-400 font-medium">Try matchmaking after you sign up</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🎯 Why Join Section - Only show testimonials when we have real ones */}
            <section className="py-24 px-4">
                <div className="container mx-auto max-w-7xl">
                    <h2 className="text-4xl font-heading font-medium text-center mb-16 text-white">
                        Why Join <span className="text-orange-500">Gurukul</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: "🎯",
                                title: "Find Your Study Tribe",
                                description: "Connect with peers preparing for the same exams and goals"
                            },
                            {
                                icon: "📚",
                                title: "Focused Study Sessions",
                                description: "Virtual rooms designed for deep work and concentration"
                            },
                            {
                                icon: "🤝",
                                title: "Accountability Partners",
                                description: "Stay motivated with like-minded learners on the same journey"
                            }
                        ].map((benefit, i) => (
                            <div key={i} className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-orange-500/20 transition-all">
                                <div className="text-4xl mb-4">{benefit.icon}</div>
                                <h3 className="text-xl font-heading font-bold text-white mb-3">{benefit.title}</h3>
                                <p className="text-stone-400 leading-relaxed">{benefit.description}</p>
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
                        Ready to <span className="text-orange-500 font-bold">Study Together</span>?
                    </h2>
                    <p className="text-xl text-stone-400 mb-12 max-w-2xl mx-auto font-light">
                        {stats.ctaCopy}
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
                            Join Now
                        </button>
                    )}

                    <p className="mt-8 text-stone-500 text-sm">Free for all students • Student Community</p>
                </div>
            </section>

            {/* 🦶 Footer */}
            <footer className="py-8 px-4 border-t border-white/5 bg-[#181614]">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <Flame className="w-5 h-5 text-orange-600" />
                                <span className="font-bold text-white text-sm">Gurukul</span>
                            </div>
                            <p className="text-xs text-stone-500 leading-relaxed">
                                Where students connect and study together. Building India's largest student learning community.
                            </p>
                        </div>

                        {/* Platform */}
                        <div>
                            <h3 className="font-bold text-white text-sm mb-4">Platform</h3>
                            <ul className="space-y-2 text-xs text-stone-500">
                                <li>
                                    <Link href="/rooms" className="hover:text-orange-500 transition-colors">
                                        Study Rooms
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/sangha" className="hover:text-orange-500 transition-colors">
                                        Find Study Buddies
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard" className="hover:text-orange-500 transition-colors">
                                        Dashboard
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h3 className="font-bold text-white text-sm mb-4">Legal</h3>
                            <ul className="space-y-2 text-xs text-stone-500">
                                <li>
                                    <Link href="/terms" className="hover:text-orange-500 transition-colors">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy" className="hover:text-orange-500 transition-colors">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/community-guidelines" className="hover:text-orange-500 transition-colors">
                                        Community Guidelines
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h3 className="font-bold text-white text-sm mb-4">Support</h3>
                            <ul className="space-y-2 text-xs text-stone-500">
                                <li>
                                    <Link href="/contact" className="hover:text-orange-500 transition-colors">
                                        Contact Us
                                    </Link>
                                </li>
                                <li>
                                    <a href="mailto:safety@gurukul.com" className="hover:text-orange-500 transition-colors">
                                        Report Safety Issue
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:hello@gurukul.com" className="hover:text-orange-500 transition-colors">
                                        General Inquiries
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-stone-500">
                        <p>© 2025 Gurukul. All rights reserved.</p>
                        <p className="mt-2 md:mt-0">Made with ❤️ for students across India</p>
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
