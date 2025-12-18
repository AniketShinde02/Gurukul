'use client'

import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-6">
                        <FileText className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-stone-400">
                        Last updated: December 18, 2024
                    </p>
                </div>

                {/* Content Sections */}
                <div className="prose prose-invert prose-orange max-w-none">
                    <div className="space-y-8">
                        {/* Introduction */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Agreement to Terms</h2>
                            <p className="text-stone-300 leading-relaxed">
                                Welcome to Gurukul. By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our platform.
                            </p>
                            <p className="text-stone-300 leading-relaxed mt-4">
                                These Terms constitute a legally binding agreement between you and Gurukul. Please read them carefully.
                            </p>
                        </section>

                        {/* Eligibility */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Eligibility</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                To use Gurukul, you must:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Be at least 13 years old</li>
                                <li>Provide accurate and truthful information</li>
                                <li>Have the legal capacity to enter into these Terms</li>
                                <li>Not be prohibited from using the platform under applicable laws</li>
                            </ul>
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-6">
                                <p className="text-amber-400 text-sm font-medium">
                                    ⚠️ <strong>Age Restrictions:</strong> Users between 13-17 have limited access. Video matchmaking and certain community features require you to be 18 or older.
                                </p>
                            </div>
                        </section>

                        {/* Account Responsibilities */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Account Responsibilities</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                When you create an account, you agree to:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Provide accurate, current, and complete information</li>
                                <li>Maintain the security of your account credentials</li>
                                <li>Notify us immediately of any unauthorized access</li>
                                <li>Be responsible for all activities under your account</li>
                                <li>Not share your account with others</li>
                                <li>Not create multiple accounts</li>
                            </ul>
                            <p className="text-stone-300 leading-relaxed mt-4">
                                You are solely responsible for maintaining the confidentiality of your password and account information.
                            </p>
                        </section>

                        {/* Acceptable Use */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Acceptable Use Policy</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                You agree to use Gurukul only for lawful purposes. You must NOT:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Harass, bully, or intimidate other users</li>
                                <li>Post or share inappropriate, offensive, or illegal content</li>
                                <li>Impersonate others or misrepresent your identity</li>
                                <li>Spam, advertise, or promote commercial activities without permission</li>
                                <li>Share explicit, sexual, or adult content</li>
                                <li>Violate intellectual property rights</li>
                                <li>Attempt to hack, disrupt, or compromise platform security</li>
                                <li>Collect or harvest user data without consent</li>
                                <li>Use the platform for any illegal activities</li>
                            </ul>
                        </section>

                        {/* Content Guidelines */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">User Content</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                You retain ownership of content you post on Gurukul. However, by posting content, you grant us:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>A worldwide, non-exclusive license to use, display, and distribute your content</li>
                                <li>The right to moderate, remove, or restrict content that violates these Terms</li>
                                <li>The ability to use your content to improve and promote the platform</li>
                            </ul>
                            <p className="text-stone-300 leading-relaxed mt-4">
                                You represent and warrant that:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>You own or have the right to post the content</li>
                                <li>Your content does not violate any laws or third-party rights</li>
                                <li>Your content is accurate and not misleading</li>
                            </ul>
                        </section>

                        {/* Platform Rules */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Platform Rules</h2>

                            <h3 className="text-xl font-bold text-orange-500 mb-3 mt-6">Study Rooms</h3>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Respect the purpose of each study room</li>
                                <li>Maintain a focused and productive environment</li>
                                <li>Do not disrupt other users' study sessions</li>
                            </ul>

                            <h3 className="text-xl font-bold text-orange-500 mb-3 mt-6">Video Matchmaking</h3>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Must be 18+ to use video matchmaking</li>
                                <li>Maintain appropriate behavior during video calls</li>
                                <li>Report any inappropriate conduct immediately</li>
                                <li>Do not record or screenshot without consent</li>
                            </ul>

                            <h3 className="text-xl font-bold text-orange-500 mb-3 mt-6">Community Interactions</h3>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Be respectful and supportive of fellow students</li>
                                <li>Share knowledge and resources generously</li>
                                <li>Give credit when using others' work</li>
                                <li>Report violations of community guidelines</li>
                            </ul>
                        </section>

                        {/* Termination */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Termination</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                We reserve the right to suspend or terminate your account if:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>You violate these Terms or our Community Guidelines</li>
                                <li>You engage in fraudulent or illegal activities</li>
                                <li>You pose a security or legal risk</li>
                                <li>Your account has been inactive for an extended period</li>
                            </ul>
                            <p className="text-stone-300 leading-relaxed mt-4">
                                You may also delete your account at any time through your account settings. Upon termination, your right to use the platform will immediately cease.
                            </p>
                        </section>

                        {/* Disclaimers */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Disclaimers</h2>
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                                <p className="text-stone-300 leading-relaxed mb-4">
                                    <strong className="text-red-400">IMPORTANT:</strong> Gurukul is provided "AS IS" and "AS AVAILABLE" without warranties of any kind.
                                </p>
                                <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                    <li>We do not guarantee uninterrupted or error-free service</li>
                                    <li>We are not responsible for user-generated content</li>
                                    <li>We do not endorse or verify information shared by users</li>
                                    <li>We are not liable for interactions between users</li>
                                    <li>Study materials and advice are provided by users, not by Gurukul</li>
                                </ul>
                            </div>
                        </section>

                        {/* Limitation of Liability */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Limitation of Liability</h2>
                            <p className="text-stone-300 leading-relaxed">
                                To the maximum extent permitted by law, Gurukul and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4 mt-4">
                                <li>Loss of data or profits</li>
                                <li>Service interruptions</li>
                                <li>User interactions or disputes</li>
                                <li>Third-party content or actions</li>
                            </ul>
                        </section>

                        {/* Indemnification */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Indemnification</h2>
                            <p className="text-stone-300 leading-relaxed">
                                You agree to indemnify and hold harmless Gurukul, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4 mt-4">
                                <li>Your use of the platform</li>
                                <li>Your violation of these Terms</li>
                                <li>Your violation of any rights of another user</li>
                                <li>Your content posted on the platform</li>
                            </ul>
                        </section>

                        {/* Changes to Terms */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Changes to Terms</h2>
                            <p className="text-stone-300 leading-relaxed">
                                We may update these Terms from time to time. We will notify you of significant changes by posting a notice on the platform or sending you an email. Your continued use of the platform after changes become effective constitutes your acceptance of the revised Terms.
                            </p>
                        </section>

                        {/* Governing Law */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Governing Law</h2>
                            <p className="text-stone-300 leading-relaxed">
                                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the platform shall be subject to the exclusive jurisdiction of the courts in India.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Contact Us</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                If you have any questions about these Terms, please contact us:
                            </p>
                            <div className="bg-stone-800/50 rounded-xl p-6 space-y-2">
                                <p className="text-stone-300">
                                    <strong className="text-white">Email:</strong>{' '}
                                    <a href="mailto:Ai.Captioncraft@outlook.com" className="text-orange-500 hover:underline">
                                        Ai.Captioncraft@outlook.com
                                    </a>
                                </p>
                                <p className="text-stone-300">
                                    <strong className="text-white">Platform:</strong> Gurukul
                                </p>
                                <p className="text-stone-300">
                                    <strong className="text-white">Website:</strong>{' '}
                                    <Link href="/" className="text-orange-500 hover:underline">
                                        gurukul.com
                                    </Link>
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
