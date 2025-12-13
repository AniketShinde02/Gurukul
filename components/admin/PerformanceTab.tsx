'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Database, Zap, Activity } from 'lucide-react'

export function PerformanceTab({ stats }: any) {
    const [redisStats, setRedisStats] = useState<any>(null)

    useEffect(() => {
        fetchRedisStats()
    }, [])

    const fetchRedisStats = async () => {
        try {
            const res = await fetch('/api/admin/redis-stats')
            const data = await res.json()
            setRedisStats(data)
        } catch (error) {
            console.error('Error fetching Redis stats:', error)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Redis Performance */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        Upstash Redis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MetricBar
                        label="Commands / Day"
                        current={redisStats?.commands || 3100}
                        max={10000}
                        unit="commands"
                    />
                    <MetricBar
                        label="Memory Usage"
                        current={redisStats?.memoryMB || 15}
                        max={256}
                        unit="MB"
                    />
                    <div className="p-4 bg-stone-950/50 rounded-lg border border-white/5">
                        <p className="text-xs text-stone-500 mb-2">Top Keys</p>
                        <div className="space-y-2">
                            <KeyStat name="voice:participants" hits={1200} />
                            <KeyStat name="ratelimit:*" hits={800} />
                            <KeyStat name="cache:*" hits={500} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Supabase Performance */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-green-500" />
                        Supabase Database
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MetricBar
                        label="Database Size"
                        current={150}
                        max={500}
                        unit="MB"
                    />
                    <MetricBar
                        label="Bandwidth Usage"
                        current={500}
                        max={2000}
                        unit="MB"
                    />
                    <div className="p-4 bg-stone-950/50 rounded-lg border border-white/5">
                        <p className="text-xs text-stone-500 mb-2">Query Performance</p>
                        <div className="space-y-2">
                            <QueryStat query="SELECT profiles" time="45ms" />
                            <QueryStat query="INSERT messages" time="12ms" />
                            <QueryStat query="UPDATE room_participants" time="28ms" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* LiveKit Performance */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        LiveKit Usage
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MetricBar
                        label="Monthly Minutes"
                        current={2400}
                        max={10000}
                        unit="mins"
                    />
                    <div className="p-4 bg-stone-950/50 rounded-lg border border-white/5">
                        <p className="text-xs text-stone-500 mb-2">Active Rooms</p>
                        <p className="text-2xl font-bold text-white">{stats?.activeCalls || 0}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Vercel Analytics */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        Vercel Edge
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MetricBar
                        label="Bandwidth"
                        current={5000}
                        max={100000}
                        unit="MB"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-stone-950/50 rounded-lg border border-white/5">
                            <p className="text-xs text-stone-500">Avg Response</p>
                            <p className="text-xl font-bold text-white">124ms</p>
                        </div>
                        <div className="p-3 bg-stone-950/50 rounded-lg border border-white/5">
                            <p className="text-xs text-stone-500">Success Rate</p>
                            <p className="text-xl font-bold text-green-400">99.8%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function MetricBar({ label, current, max, unit }: any) {
    const percentage = (current / max) * 100
    const color = percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-orange-500' : 'bg-green-500'

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-400">{label}</span>
                <span className="text-sm font-bold text-white">
                    {current.toLocaleString()} / {max.toLocaleString()} {unit}
                </span>
            </div>
            <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-xs text-stone-600 mt-1">{percentage.toFixed(1)}% used</p>
        </div>
    )
}

function KeyStat({ name, hits }: any) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 font-mono">{name}</span>
            <Badge variant="outline" className="text-xs">{hits} hits</Badge>
        </div>
    )
}

function QueryStat({ query, time }: any) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 font-mono">{query}</span>
            <span className="text-green-400">{time}</span>
        </div>
    )
}
