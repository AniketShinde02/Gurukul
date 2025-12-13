'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, Server, Shield, Activity,
    FileCheck, BarChart3, Terminal, Settings, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const menuItems = [
    {
        title: 'Overview',
        icon: LayoutDashboard,
        href: '/admin',
        matchExact: true
    },
    {
        title: 'Analytics',
        icon: BarChart3,
        href: '/admin/analytics',
    },
    {
        title: 'Users',
        icon: Users,
        href: '/admin/users',
    },
    {
        title: 'Rooms',
        icon: Server,
        href: '/admin/rooms',
    },
    {
        title: 'Verifications',
        icon: FileCheck,
        href: '/admin/verifications',
    },
    {
        title: 'Performance',
        icon: Activity,
        href: '/admin/performance',
    },
    {
        title: 'System Logs',
        icon: Terminal,
        href: '/admin/logs',
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <div className="w-64 h-screen bg-stone-950 border-r border-white/10 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo Area */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white tracking-tight">Gurukul</h1>
                        <p className="text-xs text-stone-500 font-medium tracking-wide">ADMIN CONSOLE</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                <div className="px-3 mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Main Menu
                </div>
                {menuItems.map((item) => {
                    const isActive = item.matchExact
                        ? pathname === item.href
                        : pathname.startsWith(item.href)

                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-orange-500/10 text-orange-400 font-medium"
                                    : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                            )}>
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full" />
                                )}
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-orange-500" : "text-stone-500 group-hover:text-stone-300"
                                )} />
                                <span>{item.title}</span>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Footer / User */}
            <div className="p-4 border-t border-white/10 bg-stone-900/50">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-stone-400 hover:text-red-400 hover:bg-red-500/10 gap-3"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}
