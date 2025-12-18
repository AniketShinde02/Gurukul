'use client'

import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'

export default function CommunityGuidelinesPage() {
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 mb-6">
                        <Heart className="w-8 h-8 text-pink-500" />
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        Community Guidelines
                    </h1>
                    <p className="text-stone-400 max-w-2xl mx-auto">
                        Building a respectful, supportive, and productive learning community together
                    </p>
                </div>

                {/* Content Sections */}
                <div className="prose prose-invert prose-orange max-w-none">
                    <div className="space-y-8">
                        {/* Core Values */}
                        <section className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Our Core Values</h2>
                            <p className="text-stone-300 leading-relaxed mb-6">
                                Gurukul is built on the foundation of mutual respect, collaboration, and a shared passion for learning. Every member of our community plays a vital role in maintaining a positive environment.
                            </p>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-[#221F1D]/60 rounded-xl p-4 border border-white/10">
                                    <div className="text-2xl mb-2">🤝</div>
                                    <h3 className="font-bold text-white mb-2">Respect</h3>
                                    <p className="text-sm text-stone-400">Treat everyone with dignity and kindness</p>
                                </div>
                                <div className="bg-[#221F1D]/60 rounded-xl p-4 border border-white/10">
                                    <div className="text-2xl mb-2">🎯</div>
                                    <h3 className="font-bold text-white mb-2">Focus</h3>
                                    <p className="text-sm text-stone-400">Stay committed to learning and growth</p>
                                </div>
                                <div className="bg-[#221F1D]/60 rounded-xl p-4 border border-white/10">
                                    <div className="text-2xl mb-2">💡</div>
                                    <h3 className="font-bold text-white mb-2">Support</h3>
                                    <p className="text-sm text-stone-400">Help others succeed and learn together</p>
                                </div>
                            </div>
                        </section>

                        {/* Be Respectful */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">🤝</span> Be Respectful
                            </h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                Respect is the foundation of our community. We expect all members to:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Treat others with kindness and empathy</li>
                                <li>Value diverse perspectives and backgrounds</li>
                                <li>Use appropriate and professional language</li>
                                <li>Respect others' time and study sessions</li>
                                <li>Give constructive feedback, not criticism</li>
                                <li>Acknowledge and appreciate others' contributions</li>
                            </ul>
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-6">
                                <p className="text-red-400 text-sm font-medium">
                                    ❌ <strong>Zero Tolerance:</strong> Harassment, bullying, hate speech, discrimination, or any form of abuse will result in immediate account suspension.
                                </p>
                            </div>
                        </section>

                        {/* Keep it Appropriate */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">✅</span> Keep it Appropriate
                            </h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                Gurukul is a learning platform. All content and interactions must be appropriate:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>No explicit, sexual, or adult content</li>
                                <li>No violence, gore, or disturbing material</li>
                                <li>No illegal activities or promotion of harmful behavior</li>
                                <li>No sharing of personal contact information publicly</li>
                                <li>No spam, scams, or fraudulent content</li>
                                <li>No impersonation or misrepresentation</li>
                            </ul>
                        </section>

                        {/* Stay Focused */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">🎯</span> Stay Focused on Learning
                            </h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                Our platform is designed for students to learn and grow:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Keep conversations relevant to studying and learning</li>
                                <li>Respect the purpose of each study room</li>
                                <li>Avoid off-topic discussions during study sessions</li>
                                <li>Share educational resources and helpful materials</li>
                                <li>Ask questions and seek help when needed</li>
                                <li>Contribute meaningfully to discussions</li>
                            </ul>
                        </section>

                        {/* Protect Privacy */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">🔒</span> Protect Privacy
                            </h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                Privacy and safety are paramount:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Do not share your personal information (phone, address, etc.)</li>
                                <li>Do not ask others for their personal information</li>
                                <li>Do not record or screenshot video calls without consent</li>
                                <li>Respect others' privacy and boundaries</li>
                                <li>Report any privacy violations immediately</li>
                                <li>Use the platform's built-in communication features</li>
                            </ul>
                        </section>

                        {/* Give Credit */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">📚</span> Give Credit & Respect IP
                            </h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                Academic integrity and intellectual property rights matter:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Always credit the original source of materials</li>
                                <li>Do not plagiarize or copy others' work</li>
                                <li>Respect copyright and intellectual property</li>
                                <li>Share only content you have the right to share</li>
                                <li>Acknowledge help and collaboration</li>
                                <li>Report copyright violations</li>
                            </ul>
                        </section>

                        {/* Video Call Guidelines */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">📹</span> Video Call Etiquette
                            </h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                When using video matchmaking and study rooms:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Dress appropriately and maintain a professional appearance</li>
                                <li>Use a neutral background or virtual background</li>
                                <li>Mute your microphone when not speaking</li>
                                <li>Be punctual and respectful of others' time</li>
                                <li>Stay focused on the study session</li>
                                <li>End calls politely and thank your study partner</li>
                            </ul>
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-6">
                                <p className="text-amber-400 text-sm font-medium">
                                    ⚠️ <strong>18+ Requirement:</strong> Video matchmaking is restricted to users 18 and older for safety reasons.
                                </p>
                            </div>
                        </section>

                        {/* Reporting */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">🚨</span> Report Violations
                            </h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                Help us maintain a safe community by reporting violations:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Use the report button to flag inappropriate content or behavior</li>
                                <li>Provide specific details about the violation</li>
                                <li>Do not engage with or retaliate against violators</li>
                                <li>Trust our moderation team to handle reports</li>
                                <li>Report urgent safety concerns immediately</li>
                            </ul>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mt-6">
                                <p className="text-blue-400 font-medium mb-2">
                                    📧 Report serious violations to:
                                </p>
                                <a href="mailto:Ai.Captioncraft@outlook.com" className="text-orange-500 hover:underline font-medium">
                                    Ai.Captioncraft@outlook.com
                                </a>
                            </div>
                        </section>

                        {/* Consequences */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Consequences of Violations</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                Violations of these guidelines may result in:
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold">1</div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">Warning</h3>
                                        <p className="text-sm text-stone-400">First-time minor violations receive a warning</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">2</div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">Temporary Suspension</h3>
                                        <p className="text-sm text-stone-400">Repeated or moderate violations result in temporary account suspension</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">3</div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">Permanent Ban</h3>
                                        <p className="text-sm text-stone-400">Serious violations or repeated offenses result in permanent account termination</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Contact */}
                        <section className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Questions?</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                If you have questions about these guidelines or need clarification, please contact us:
                            </p>
                            <div className="bg-[#221F1D]/60 rounded-xl p-6 space-y-2">
                                <p className="text-stone-300">
                                    <strong className="text-white">Email:</strong>{' '}
                                    <a href="mailto:Ai.Captioncraft@outlook.com" className="text-orange-500 hover:underline">
                                        Ai.Captioncraft@outlook.com
                                    </a>
                                </p>
                                <p className="text-stone-300">
                                    <strong className="text-white">Safety Concerns:</strong>{' '}
                                    <a href="mailto:Ai.Captioncraft@outlook.com" className="text-orange-500 hover:underline">
                                        Ai.Captioncraft@outlook.com
                                    </a>
                                </p>
                            </div>
                        </section>
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
