import Link from 'next/link'
import { Flame } from 'lucide-react'
import React from 'react'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0c0a09] text-stone-200">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#181614]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <Link href="/docs" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">
                            Gurukul <span className="text-orange-500 font-medium text-lg ml-0.5">DOCS</span>
                        </span>
                    </Link>
                    <Link href="/" className="text-sm text-stone-400 hover:text-orange-500 transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </header>

            <div className="container mx-auto max-w-7xl px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-64 flex-shrink-0">
                        <nav className="sticky top-24 space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Getting Started</h3>
                                <ul className="space-y-1">
                                    <li><Link href="/docs" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Introduction</Link></li>
                                    <li><Link href="/docs/getting-started" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Getting Started</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Core Concepts</h3>
                                <ul className="space-y-1">
                                    <li><Link href="/docs/core-concepts/matchmaking" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Matchmaking</Link></li>
                                    <li><Link href="/docs/core-concepts/sangha" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Sangha System</Link></li>
                                    <li><Link href="/docs/core-concepts/safety" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Safety</Link></li>
                                    <li><Link href="/docs/core-concepts/design" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Design</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Guides</h3>
                                <ul className="space-y-1">
                                    <li><Link href="/docs/guides/create-sangha" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Create Sangha</Link></li>
                                    <li><Link href="/docs/guides/find-buddies" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Find Buddies</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Reference</h3>
                                <ul className="space-y-1">
                                    <li><Link href="/docs/reference/env-vars" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Environment Variables</Link></li>
                                    <li><Link href="/docs/reference/api" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">API Endpoints</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">More</h3>
                                <ul className="space-y-1">
                                    <li><Link href="/docs/architecture" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Architecture</Link></li>
                                    <li><Link href="/docs/contribution" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Contribution</Link></li>
                                    <li><Link href="/docs/changelog" className="block px-3 py-2 rounded text-sm hover:bg-white/5 hover:text-orange-500 transition-colors">Changelog</Link></li>
                                </ul>
                            </div>
                        </nav>
                    </aside>

                    {/* Content */}
                    <main className="flex-1 min-w-0">
                        <article className="prose prose-invert prose-orange max-w-none">
                            {children}
                        </article>
                    </main>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 mt-16 py-8">
                <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-stone-500">
                    <p>© {new Date().getFullYear()} Gurukul. Built for scholars, by scholars.</p>
                </div>
            </footer>
        </div>
    )
}
