'use client'

import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-6">
                        <Shield className="w-8 h-8 text-blue-500" />
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        Privacy Policy
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
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Introduction</h2>
                            <p className="text-stone-300 leading-relaxed">
                                Welcome to Gurukul ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                            </p>
                            <p className="text-stone-300 leading-relaxed mt-4">
                                By using Gurukul, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our platform.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Information We Collect</h2>

                            <h3 className="text-xl font-bold text-orange-500 mb-3 mt-6">Personal Information</h3>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                When you register for an account, we collect:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Full name and username</li>
                                <li>Email address</li>
                                <li>Date of birth (for age verification)</li>
                                <li>Location (optional)</li>
                                <li>Study goals and session information</li>
                                <li>Profile picture (optional)</li>
                            </ul>

                            <h3 className="text-xl font-bold text-orange-500 mb-3 mt-6">Usage Data</h3>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                We automatically collect certain information when you use our platform:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Device information (browser type, operating system)</li>
                                <li>IP address and general location</li>
                                <li>Pages visited and features used</li>
                                <li>Time and date of visits</li>
                                <li>Study session duration and activity</li>
                            </ul>

                            <h3 className="text-xl font-bold text-orange-500 mb-3 mt-6">Communication Data</h3>
                            <p className="text-stone-300 leading-relaxed">
                                When you use our chat and video features, we may store:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Messages sent in study rooms</li>
                                <li>Direct messages between users</li>
                                <li>Video call metadata (duration, participants)</li>
                                <li>Shared files and resources</li>
                            </ul>
                        </section>

                        {/* How We Use Your Information */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">How We Use Your Information</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Provide, operate, and maintain our platform</li>
                                <li>Match you with suitable study partners</li>
                                <li>Verify your age and ensure platform safety</li>
                                <li>Improve and personalize your experience</li>
                                <li>Send you important updates and notifications</li>
                                <li>Respond to your inquiries and support requests</li>
                                <li>Detect and prevent fraud or abuse</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        {/* Data Sharing */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Data Sharing and Disclosure</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                We do NOT sell your personal information. We may share your information only in the following circumstances:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li><strong>With Other Users:</strong> Your profile information (name, username, bio, study goals) is visible to other users</li>
                                <li><strong>Service Providers:</strong> We use third-party services (Supabase, Vercel, LiveKit) to operate our platform</li>
                                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
                                <li><strong>Business Transfers:</strong> In case of merger or acquisition, your data may be transferred</li>
                            </ul>
                        </section>

                        {/* Data Security */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Data Security</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                We implement appropriate technical and organizational security measures to protect your personal information:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Encryption of data in transit and at rest</li>
                                <li>Secure authentication using industry-standard protocols</li>
                                <li>Regular security audits and updates</li>
                                <li>Access controls and monitoring</li>
                                <li>Secure data storage with Supabase</li>
                            </ul>
                            <p className="text-stone-400 text-sm mt-4 italic">
                                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                            </p>
                        </section>

                        {/* Your Rights */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Your Privacy Rights</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                You have the following rights regarding your personal information:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li><strong>Access:</strong> Request a copy of your personal data</li>
                                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                                <li><strong>Restriction:</strong> Request limitation of data processing</li>
                            </ul>
                            <p className="text-stone-300 leading-relaxed mt-4">
                                To exercise these rights, please contact us at{' '}
                                <a href="mailto:Ai.Captioncraft@outlook.com" className="text-orange-500 hover:underline">
                                    Ai.Captioncraft@outlook.com
                                </a>
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Children's Privacy</h2>
                            <p className="text-stone-300 leading-relaxed">
                                Our platform is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will delete such information.
                            </p>
                            <p className="text-stone-300 leading-relaxed mt-4">
                                Users between 13-17 years old have restricted access to certain features, particularly video matchmaking, which requires users to be 18+.
                            </p>
                        </section>

                        {/* Cookies */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Cookies and Tracking</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                We use cookies and similar tracking technologies to:
                            </p>
                            <ul className="list-disc list-inside text-stone-300 space-y-2 ml-4">
                                <li>Keep you logged in</li>
                                <li>Remember your preferences</li>
                                <li>Analyze platform usage</li>
                                <li>Improve performance and user experience</li>
                            </ul>
                            <p className="text-stone-300 leading-relaxed mt-4">
                                You can control cookies through your browser settings. However, disabling cookies may affect platform functionality.
                            </p>
                        </section>

                        {/* Changes to Policy */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Changes to This Policy</h2>
                            <p className="text-stone-300 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically for any changes.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="bg-[#221F1D]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <h2 className="text-2xl font-heading font-bold text-white mb-4">Contact Us</h2>
                            <p className="text-stone-300 leading-relaxed mb-4">
                                If you have any questions about this Privacy Policy, please contact us:
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
