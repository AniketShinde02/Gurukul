'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Crown, Medal, Trophy, TrendingUp, Flame, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
    id: string
    username: string
    full_name: string
    avatar_url: string
    xp: number
    level: number
    total_study_minutes: number
    is_student: boolean
}

export default function LeaderboardPage() {
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [timeframe, setTimeframe] = useState<'all-time' | 'weekly'>('all-time') // Ready for future filtering

    useEffect(() => {
        fetchLeaderboard()
    }, [timeframe])

    const fetchLeaderboard = async () => {
        try {
            // For now, simple all-time XP fetch
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, xp, level, total_study_minutes, is_student')
                .order('xp', { ascending: false })
                .limit(50)

            if (error) throw error
            setLeaders(data || [])
        } catch (error) {
            console.error('Error fetching leaderboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
        )
    }

    const TopThree = leaders.slice(0, 3)
    const Rest = leaders.slice(3)

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white mb-2 flex items-center gap-3">
                        <Trophy className="text-yellow-500 w-8 h-8" />
                        Hall of Fame
                    </h1>
                    <p className="text-stone-400">Top scholars dedicated to their craft.</p>
                </div>

                <div className="flex bg-stone-900/50 p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setTimeframe('weekly')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", timeframe === 'weekly' ? "bg-stone-800 text-white shadow" : "text-stone-500 hover:text-stone-300")}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setTimeframe('all-time')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", timeframe === 'all-time' ? "bg-stone-800 text-white shadow" : "text-stone-500 hover:text-stone-300")}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {/* TOP 3 PODIUM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 items-end mb-12 min-h-[300px]">
                {/* 2nd Place */}
                <div className="order-2 md:order-1">
                    {TopThree[1] && <PodiumCard user={TopThree[1]} rank={2} />}
                </div>

                {/* 1st Place */}
                <div className="order-1 md:order-2 -mt-12 z-10">
                    {TopThree[0] && <PodiumCard user={TopThree[0]} rank={1} />}
                </div>

                {/* 3rd Place */}
                <div className="order-3">
                    {TopThree[2] && <PodiumCard user={TopThree[2]} rank={3} />}
                </div>
            </div>

            {/* THE LIST */}
            <div className="bg-stone-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-stone-500 uppercase tracking-wider border-b border-white/5">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-6 md:col-span-5">Scholar</div>
                    <div className="col-span-3 md:col-span-2 text-right">Level</div>
                    <div className="col-span-2 md:col-span-2 text-right">XP</div>
                    <div className="hidden md:block md:col-span-2 text-right">Time</div>
                </div>

                <div className="divide-y divide-white/5">
                    {Rest.length > 0 ? (
                        Rest.map((user, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={user.id}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                            >
                                <div className="col-span-1 text-center font-mono text-stone-400 font-bold group-hover:text-white">
                                    {index + 4}
                                </div>
                                <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-stone-200 truncate group-hover:text-orange-400 transition-colors">
                                            {user.username}
                                        </h4>
                                        {user.is_student && (
                                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                Student
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right">
                                    <span className="bg-stone-800 text-stone-300 px-2 py-1 rounded text-xs font-mono">
                                        Lvl {user.level || 1}
                                    </span>
                                </div>
                                <div className="col-span-2 md:col-span-2 text-right font-bold text-orange-500">
                                    {user.xp?.toLocaleString() || 0}
                                </div>
                                <div className="hidden md:block md:col-span-2 text-right text-stone-500 text-sm">
                                    {Math.round((user.total_study_minutes || 0) / 60)}h
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-stone-500">
                            No other scholars yet. Keep working!
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function PodiumCard({ user, rank }: { user: LeaderboardEntry, rank: number }) {
    const isFirst = rank === 1
    const color = isFirst ? 'text-yellow-400' : rank === 2 ? 'text-slate-300' : 'text-amber-600'
    const bgColor = isFirst ? 'bg-yellow-400/10 border-yellow-400/20' : rank === 2 ? 'bg-slate-300/10 border-slate-300/20' : 'bg-amber-600/10 border-amber-600/20'
    const glow = isFirst ? 'shadow-yellow-500/20' : ''

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative flex flex-col items-center p-6 rounded-3xl border backdrop-blur-md shadow-2xl transition-all hover:-translate-y-2",
                bgColor,
                glow,
                isFirst ? "h-[320px] justify-center scale-110 z-20" : "h-[260px] justify-end opacity-90 hover:opacity-100"
            )}
        >
            <div className="absolute -top-6">
                {isFirst ? (
                    <Crown className="w-12 h-12 text-yellow-400 drop-shadow-lg animate-bounce" />
                ) : (
                    <Medal className={cn("w-10 h-10 drop-shadow-md", color)} />
                )}
            </div>

            <Avatar className={cn(
                "border-4 mb-4",
                isFirst ? "w-24 h-24 border-yellow-400" : "w-16 h-16 border-white/20"
            )}>
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{user.username?.[0]}</AvatarFallback>
            </Avatar>

            <h3 className="text-xl font-bold text-white mb-1">{user.username}</h3>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-black/30 px-2 py-1 rounded text-stone-300">Level {user.level || 1}</span>
                {user.is_student && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">🎓</span>}
            </div>

            <div className="text-center">
                <div className={cn("text-2xl font-black tabular-nums", color)}>
                    {user.xp?.toLocaleString() || 0}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Total XP</div>
            </div>

            <div className="absolute bottom-4 flex items-center gap-1 text-xs text-stone-400">
                <Flame className="w-3 h-3 text-orange-500" />
                {Math.round((user.total_study_minutes || 0) / 60)} hours studied
            </div>
        </motion.div>
    )
}
