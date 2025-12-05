'use client'

import { usePathname } from 'next/navigation'
import { TopBar } from './TopBar'
import { Navigation } from './Navigation'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isSangha = pathname?.startsWith('/sangha')

    return (
        <div className="min-h-screen bg-[var(--bg-root)] bg-vedic-pattern bg-fixed text-stone-200 font-sans selection:bg-orange-500/30">
            {!isSangha && <TopBar />}
            {!isSangha && <Navigation />}
            <main className={cn(
                "flex flex-col transition-all duration-300",
                isSangha ? "h-screen overflow-hidden" : "min-h-screen pt-16 lg:pl-20 pb-20 lg:pb-0"
            )}>
                <div className={cn(
                    "animate-in fade-in duration-500 flex-1 flex flex-col",
                    isSangha ? "h-full overflow-hidden" : "container mx-auto p-4 lg:p-8 max-w-7xl"
                )}>
                    {children}
                </div>
            </main>
        </div>
    )
}
