'use client'

import { LayoutDashboard, Users, Video, BookOpen, Settings, MessageCircle, Trophy } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Study Match', icon: Users, href: '/chat' },
    { label: 'Study Rooms', icon: Video, href: '/rooms' },
    { label: 'Sangha', icon: MessageCircle, href: '/sangha' },
    { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
    { label: 'Resources', icon: BookOpen, href: '/resources' },
    { label: 'Settings', icon: Settings, href: '/settings' },
]

export function Navigation() {
    const pathname = usePathname()

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col items-center w-20 fixed left-0 top-16 bottom-0 border-r border-white/5 bg-[var(--bg-root)]/80 backdrop-blur-xl z-40 py-6 gap-6">
                <TooltipProvider delayDuration={0}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        onClick={() => {
                                            if (item.href === '/sangha') {
                                                // Force a full navigation or state reset if needed
                                                // Since we are using Link, it navigates. 
                                                // But if we are already on /sangha, we might want to reset the view.
                                                // We can dispatch a custom event or use a global store if needed.
                                                // For now, let's rely on the fact that navigating to the same URL might not unmount.
                                                // A simple hack is to force a window location change if already on sangha, 
                                                // OR better, let the SanghaPage handle the reset via a query param or just re-mounting.
                                                // Actually, the user wants "back" functionality. 
                                                // If we are on /sangha, clicking this should probably reset the view to 'friends'.
                                                if (window.location.pathname === '/sangha') {
                                                    window.location.reload() // Simple and effective for "refreshing" the view as requested
                                                }
                                            }
                                        }}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group ${isActive
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                            : 'text-stone-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? 'scale-100' : 'scale-90 group-hover:scale-100 transition-transform'}`} />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-stone-900 border-white/10 text-white">
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </TooltipProvider>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-root)]/90 backdrop-blur-xl border-t border-white/5 z-50 flex items-center justify-around px-2 pb-safe">
                {navItems.slice(0, 5).map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${isActive ? 'text-orange-500' : 'text-stone-500 hover:text-stone-300'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 mb-1 ${isActive ? 'fill-current' : ''}`} />
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}
