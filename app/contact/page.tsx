'use client'

import Link from 'next/link'
import { Mail, MessageCircle, Shield, Heart, ArrowLeft } from 'lucide-react'

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-vedic-pattern text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#181614]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto max-w-4xl px-4 py-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-stone-400 hover:text-orange-500 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto max-w-4xl px-4 py-16">
                {/* Title */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6">
                        <MessageCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        Contact Us
                    </h1>
                    <p className="text-stone-400 max-w-2xl mx-auto">
                        Have questions, feedback, or need help? We're here for you.
                    </p>
                </div>

                {/* Contact Options */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* General Inquiries */}
                    <div className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-orange-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-orange-500" />
                            </div>
                            <h2 className="text-xl font-heading font-bold text-white">General Inquiries</h2>
                        </div>
                        <p className="text-stone-400 mb-4">
                            Questions about the platform, features, or how to get started?
                        </p>
                        <a
                            href="mailto:Ai.Captioncraft@outlook.com"
                            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-medium transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            Ai.Captioncraft@outlook.com
                        </a>
                    </div>

                    {/* Safety & Moderation */}
                    <div className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-red-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-red-500" />
                            </div>
                            <h2 className="text-xl font-heading font-bold text-white">Safety & Moderation</h2>
                        </div>
                        <p className="text-stone-400 mb-4">
                            Report violations, safety concerns, or inappropriate behavior
                        </p>
                        <a
                            href="mailto:Ai.Captioncraft@outlook.com"
                            className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 font-medium transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            Ai.Captioncraft@outlook.com
                        </a>
                    </div>

                    {/* Privacy & Legal */}
                    <div className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-heading font-bold text-white">Privacy & Legal</h2>
                        </div>
                        <p className="text-stone-400 mb-4">
                            Privacy concerns, data requests, or legal matters
                        </p>
                        <a
                            href="mailto:Ai.Captioncraft@outlook.com"
                            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 font-medium transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            Ai.Captioncraft@outlook.com
                        </a>
                    </div>

                    {/* Community & Feedback */}
                    <div className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-pink-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                <Heart className="w-6 h-6 text-pink-500" />
                            </div>
                            <h2 className="text-xl font-heading font-bold text-white">Community & Feedback</h2>
                        </div>
                        <p className="text-stone-400 mb-4">
                            Suggestions, feature requests, or community questions
                        </p>
                        <a
                            href="mailto:Ai.Captioncraft@outlook.com"
                            className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-400 font-medium transition-colors"
                        >
                            <Heart className="w-4 h-4" />
                            Ai.Captioncraft@outlook.com
                        </a>
                    </div>
                </div>

                {/* Response Time */}
                <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-2xl p-8 mb-12">
                    <h2 className="text-2xl font-heading font-bold text-white mb-4">Response Time</h2>
                    <p className="text-stone-300 leading-relaxed mb-4">
                        We aim to respond to all inquiries within:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-[#221F1D]/60 rounded-xl p-4 border border-white/10">
                            <div className="text-2xl font-bold text-orange-500 mb-2">24 hours</div>
                            <p className="text-sm text-stone-400">General inquiries</p>
                        </div>
                        <div className="bg-[#221F1D]/60 rounded-xl p-4 border border-white/10">
                            <div className="text-2xl font-bold text-red-500 mb-2">2 hours</div>
                            <p className="text-sm text-stone-400">Safety concerns</p>
                        </div>
                        <div className="bg-[#221F1D]/60 rounded-xl p-4 border border-white/10">
                            <div className="text-2xl font-bold text-blue-500 mb-2">48 hours</div>
                            <p className="text-sm text-stone-400">Legal matters</p>
                        </div>
                    </div>
                </div>

                {/* FAQs */}
                <div className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-heading font-bold text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-white mb-2">How do I delete my account?</h3>
                            <p className="text-stone-400 text-sm">
                                Go to Settings → Account → Delete Account. Your data will be permanently removed within 30 days.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-2">How do I report inappropriate behavior?</h3>
                            <p className="text-stone-400 text-sm">
                                Use the report button on any content or user profile, or email Ai.Captioncraft@outlook.com for urgent concerns.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-2">Can I change my age after registration?</h3>
                            <p className="text-stone-400 text-sm">
                                No, age verification is permanent for safety reasons. Contact Ai.Captioncraft@outlook.com if you entered incorrect information.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-2">Is Gurukul free to use?</h3>
                            <p className="text-stone-400 text-sm">
                                Yes! Gurukul is completely free for all students. We may introduce premium features in the future, but core functionality will always be free.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back to Top */}
                <div className="mt-12 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-500 font-medium transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </main>
        </div>
    )
}
