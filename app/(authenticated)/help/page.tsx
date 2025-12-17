'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Book, Zap, MessageCircle, Video, Users, Shield, Keyboard, Bug, Heart, Sparkles, HelpCircle, Search } from 'lucide-react'

interface HelpCardProps {
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
}

function HelpCard({ title, icon, children, defaultOpen = false }: HelpCardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="bg-[#1C1917] border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/20 transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                        {icon}
                    </div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-stone-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400" />
                )}
            </button>

            {isOpen && (
                <div className="px-6 pb-6 text-stone-300 space-y-4 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    )
}

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 pb-20">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-orange-500/10 rounded-2xl">
                    <HelpCircle className="w-12 h-12 text-orange-500" />
                </div>
                <h1 className="text-4xl font-heading font-bold text-white">Help & Support</h1>
                <p className="text-stone-400 max-w-2xl mx-auto">
                    Everything you need to know about Gurukul. Find answers, learn shortcuts, and get the most out of your study sessions.
                </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for help..."
                        className="w-full bg-[#1C1917] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                    />
                </div>
            </div>

            {/* Help Cards */}
            <div className="grid grid-cols-1 gap-4">
                {/* Getting Started */}
                <HelpCard
                    title="Getting Started"
                    icon={<Sparkles className="w-6 h-6" />}
                    defaultOpen={true}
                >
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-white mb-2">Welcome to Gurukul!</h4>
                            <p className="text-sm">
                                Gurukul is a gamified study platform that combines the best of Discord (communities),
                                Omegle (discovery), and Forest (focus) into one cohesive experience.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Quick Start Guide:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                                <li>Complete your profile (name, username, study goal)</li>
                                <li>Join or create a Sangha (study community)</li>
                                <li>Try Study Match to find random study partners</li>
                                <li>Send direct messages to connect with peers</li>
                                <li>Track your progress on the dashboard</li>
                            </ol>
                        </div>
                    </div>
                </HelpCard>

                {/* Features Guide */}
                <HelpCard
                    title="Features Guide"
                    icon={<Book className="w-6 h-6" />}
                >
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-orange-500" />
                                The Sangha (Communities)
                            </h4>
                            <p className="text-sm mb-2">
                                Topic-specific study communities where you can:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                <li>Create or join servers for any subject</li>
                                <li>Chat in text channels</li>
                                <li>Join voice lounges for audio discussions</li>
                                <li>Watch lectures together in cinema rooms</li>
                                <li>Pin important messages</li>
                                <li>React with emojis</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4 text-orange-500" />
                                Study Match (Video Calls)
                            </h4>
                            <p className="text-sm mb-2">
                                Find random study partners for focused sessions:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                <li>1-on-1 video or audio calls</li>
                                <li>Collaborative whiteboard (Excalidraw)</li>
                                <li>Screen sharing for tutoring</li>
                                <li>Focus mode for distraction-free studying</li>
                                <li>Skip to find new partners</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-orange-500" />
                                Direct Messages
                            </h4>
                            <p className="text-sm mb-2">
                                Private conversations with your study buddies:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                <li>Text and voice messages</li>
                                <li>File sharing</li>
                                <li>Message search</li>
                                <li>Pin important messages</li>
                                <li>Emoji reactions</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-500" />
                                Gamification
                            </h4>
                            <p className="text-sm mb-2">
                                Stay motivated with our XP system:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                <li>Earn XP for every minute you study</li>
                                <li>Climb the leaderboards</li>
                                <li>Unlock role badges</li>
                                <li>Track your study streaks</li>
                            </ul>
                        </div>
                    </div>
                </HelpCard>

                {/* Keyboard Shortcuts */}
                <HelpCard
                    title="Keyboard Shortcuts"
                    icon={<Keyboard className="w-6 h-6" />}
                >
                    <div className="space-y-4">
                        <p className="text-sm">Master these shortcuts to navigate Gurukul like a pro:</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-bold text-white text-sm">Navigation</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-stone-400">Dashboard</span>
                                        <kbd className="px-2 py-1 bg-stone-800 rounded text-xs">Ctrl + D</kbd>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-400">Sangha</span>
                                        <kbd className="px-2 py-1 bg-stone-800 rounded text-xs">Ctrl + S</kbd>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-400">Messages</span>
                                        <kbd className="px-2 py-1 bg-stone-800 rounded text-xs">Ctrl + M</kbd>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-white text-sm">Actions</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-stone-400">Search</span>
                                        <kbd className="px-2 py-1 bg-stone-800 rounded text-xs">Ctrl + K</kbd>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-400">New Message</span>
                                        <kbd className="px-2 py-1 bg-stone-800 rounded text-xs">Ctrl + N</kbd>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-400">Help</span>
                                        <kbd className="px-2 py-1 bg-stone-800 rounded text-xs">Ctrl + H</kbd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </HelpCard>

                {/* Safety & Privacy */}
                <HelpCard
                    title="Safety & Privacy"
                    icon={<Shield className="w-6 h-6" />}
                >
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-white mb-2">Age Verification</h4>
                            <p className="text-sm">
                                All users must verify they are at least 13 years old. Video features require 18+ verification.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Report System</h4>
                            <p className="text-sm mb-2">
                                If you encounter inappropriate behavior:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                <li>Click the flag icon during video calls</li>
                                <li>Select a reason (harassment, spam, etc.)</li>
                                <li>Users with 3+ reports in 7 days are auto-banned</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Privacy</h4>
                            <p className="text-sm">
                                Your data is encrypted and secure. We never share your personal information with third parties.
                            </p>
                        </div>
                    </div>
                </HelpCard>

                {/* Troubleshooting */}
                <HelpCard
                    title="Troubleshooting"
                    icon={<Bug className="w-6 h-6" />}
                >
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-white mb-2">Video call not connecting?</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                <li>Check your camera/microphone permissions</li>
                                <li>Try refreshing the page</li>
                                <li>Ensure you're using a modern browser (Chrome, Firefox, Safari)</li>
                                <li>Check your internet connection</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Messages not sending?</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                <li>Check your internet connection</li>
                                <li>Try refreshing the page</li>
                                <li>Clear your browser cache</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Still having issues?</h4>
                            <p className="text-sm">
                                Contact us at <a href="mailto:support@gurukul.app" className="text-orange-500 hover:underline">support@gurukul.app</a>
                            </p>
                        </div>
                    </div>
                </HelpCard>

                {/* About & Dedication */}
                <HelpCard
                    title="About Gurukul"
                    icon={<Heart className="w-6 h-6" />}
                >
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-white mb-2">Our Mission</h4>
                            <p className="text-sm">
                                Gurukul was built to bring the soul back to studying. We believe learning should be
                                collaborative, engaging, and fun. Our platform combines ancient wisdom with modern
                                technology to create the ultimate study experience.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">The Name</h4>
                            <p className="text-sm">
                                "Gurukul" comes from ancient India, where students lived with their guru (teacher)
                                in a residential school. We're bringing that spirit of community and dedicated learning
                                to the digital age.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Dedication</h4>
                            <p className="text-sm italic">
                                This platform is dedicated to all the students burning the midnight oil, chasing their
                                dreams, and never giving up. Your dedication inspires us every day. Keep going! 🚀
                            </p>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <p className="text-xs text-stone-500 text-center">
                                Made with ❤️ for students, by students
                            </p>
                        </div>
                    </div>
                </HelpCard>
            </div>
        </div>
    )
}
