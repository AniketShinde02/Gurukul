'use client'

import { Search, Bell, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TopBar() {
    const router = useRouter()
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [initials, setInitials] = useState('ME')

    useEffect(() => {
        getProfile()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
                getProfile()
            } else if (event === 'SIGNED_OUT') {
                setAvatarUrl(null)
                setInitials('ME')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const getProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('avatar_url, username, full_name')
                .eq('id', user.id)
                .single()

            if (data) {
                setAvatarUrl(data.avatar_url)
                const name = data.full_name || data.username || 'User'
                setInitials(name.slice(0, 2).toUpperCase())
            }
        } else {
            setAvatarUrl(null)
            setInitials('ME')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <header className="h-16 border-b border-white/5 bg-[var(--bg-root)]/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-6">
            {/* Logo */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-heading font-bold text-xl shadow-lg shadow-orange-900/20 group-hover:scale-105 transition-transform">G</div>
                    <span className="font-heading text-2xl font-bold text-white hidden md:block tracking-tight">Gurukul</span>
                </Link>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search rooms, mentors, topics..."
                        className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-stone-200 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all placeholder:text-stone-600 shadow-inner"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-white hover:bg-white/5 rounded-full">
                    <Bell className="w-5 h-5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div data-tour="profile" className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center overflow-hidden relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-heading font-bold text-xs text-white">{initials}</span>
                                )}
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#1C1917] border-white/10 text-stone-200">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer focus:bg-white/5 focus:text-white">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer focus:bg-white/5 focus:text-white">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
