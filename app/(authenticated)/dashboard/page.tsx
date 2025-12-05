'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Clock, Users, BookOpen, Network, ArrowUpRight, Play, Search, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BuddyList } from '@/components/dm/BuddyList'

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        studyHours: 0,
        activeGroups: 0,
        resources: 0,
        connections: 0
    })
    const [activeRooms, setActiveRooms] = useState<any[]>([])
    const [userName, setUserName] = useState('Student')
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch Profile & Name & Admin Status
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, username, is_admin')
                .eq('id', user.id)
                .single()

            if (profile) {
                setUserName(profile.full_name || profile.username || 'Student')
                setIsAdmin(profile.is_admin || false)
            }

            // ... (rest of fetch logic for stats etc)
            // Active Rooms Count
            const { count: roomCount } = await supabase
                .from('study_rooms')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true)

            // Connections (Unique people matched with)
            const { data: sessions } = await supabase
                .from('chat_sessions')
                .select('user1_id, user2_id, ended_at, started_at')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

            const uniquePeers = new Set()
            let totalSeconds = 0

            sessions?.forEach(session => {
                const peer = session.user1_id === user.id ? session.user2_id : session.user1_id
                if (peer) uniquePeers.add(peer)

                if (session.started_at && session.ended_at) {
                    const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
                    totalSeconds += duration / 1000
                }
            })

            setStats({
                studyHours: Math.round(totalSeconds / 3600 * 10) / 10, // Convert to hours with 1 decimal
                activeGroups: roomCount || 0,
                resources: 12, // Placeholder until resources table exists
                connections: uniquePeers.size
            })

            // 3. Fetch Active Rooms (Upcoming/Live)
            const { data: rooms } = await supabase
                .from('study_rooms')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(3)

            setActiveRooms(rooms || [])

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white mb-1">Namaste, {userName}</h1>
                    <p className="text-stone-400">Ready to expand your knowledge today?</p>
                </div>
                {isAdmin && (
                    <Link href="/admin/verifications">
                        <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 w-full md:w-auto">
                            <Shield className="w-4 h-4 mr-2" /> Admin Panel
                        </Button>
                    </Link>
                )}
                <Link href="/rooms">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 shadow-lg shadow-orange-900/20 w-full md:w-auto">
                        Start Studying
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Study Hours', value: stats.studyHours.toString(), icon: Clock, trend: 'Total' },
                    { label: 'Active Rooms', value: stats.activeGroups.toString(), icon: Users, trend: 'Live' },
                    { label: 'Resources', value: stats.resources.toString(), icon: BookOpen, trend: 'Shared' },
                    { label: 'Connections', value: stats.connections.toString(), icon: Network, trend: 'Peers' },
                ].map((stat, i) => (
                    <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md hover:border-orange-500/20 transition-colors group">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <stat.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-medium bg-white/5 px-2 py-1 rounded-full text-stone-400">{stat.trend}</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-xs text-stone-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className={`grid grid-cols-1 md:grid-cols-3 ${isAdmin ? 'lg:grid-cols-4' : ''} gap-6`}>
                <Link href="/rooms" className="bg-gradient-to-br from-orange-900/20 to-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-orange-500/30 transition-all group h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-orange-900/30 group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-1" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Join Room</h3>
                        <p className="text-xs text-stone-400 mt-1">Hop into a live study session</p>
                    </div>
                    <ArrowUpRight className="absolute top-4 right-4 w-5 h-5 text-stone-600 group-hover:text-orange-500 transition-colors" />
                </Link>

                <Link href="/chat" className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-orange-500/30 transition-all group h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-900/30 group-hover:scale-110 transition-transform">
                            <Search className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Find Partner</h3>
                        <p className="text-xs text-stone-400 mt-1">Match with a peer instantly</p>
                    </div>
                </Link>

                {isAdmin && (
                    <Link href="/admin/verifications" className="bg-gradient-to-br from-red-900/20 to-black/40 border border-red-500/20 rounded-2xl p-6 flex flex-col justify-between hover:border-red-500/40 transition-all group h-48 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-red-900/30 group-hover:scale-110 transition-transform">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Admin Panel</h3>
                            <p className="text-xs text-stone-400 mt-1">Verifications & Security</p>
                        </div>
                        <ArrowUpRight className="absolute top-4 right-4 w-5 h-5 text-stone-600 group-hover:text-red-500 transition-colors" />
                    </Link>
                )}

                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-orange-500/30 transition-all group h-48 relative overflow-hidden cursor-not-allowed opacity-70">
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-900/30">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Resources</h3>
                        <p className="text-xs text-stone-400 mt-1">Coming Soon</p>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Live Rooms & My Sangha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Rooms List */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading font-bold text-xl text-white">Live Rooms</h3>
                        <Link href="/rooms" className="text-xs text-orange-500 hover:underline">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {activeRooms.length > 0 ? (
                            activeRooms.map((room) => (
                                <Link key={room.id} href={`/rooms/${room.id}`}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                                        <div className="w-12 h-12 rounded-lg bg-stone-800 flex flex-col items-center justify-center border border-white/5 text-orange-500">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors truncate">{room.name}</h4>
                                            <p className="text-xs text-stone-500 truncate">{room.topic} • {room.current_participants} online</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10">Join</Button>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8 text-stone-500 text-sm">
                                <p>No active rooms right now.</p>
                                <Link href="/rooms" className="text-orange-500 hover:underline mt-2 inline-block">Create one?</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* My Sangha / Buddies */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                    <BuddyList />
                </div>
            </div>
        </div>
    )
}
