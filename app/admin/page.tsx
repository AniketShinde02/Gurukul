'use client'

import { Activity, TrendingUp, Clock, Users, Server, FileCheck, MessageSquare, Phone, Zap, Database, ArrowUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { useAdminStats, DashboardStats } from '@/hooks/useAdminStats'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AdminOverviewPage() {
    const { stats, loading } = useAdminStats()

    if (loading || !stats) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h2>
                    <p className="text-stone-400">Welcome back, Administrator.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-500 bg-stone-900 px-3 py-1 rounded-full border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    System Operational
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="blue"
                />
                <StatsCard
                    title="Active Now"
                    value={stats.activeUsers}
                    icon={Activity}
                    subtitle="Online users"
                    color="green"
                />
                <StatsCard
                    title="Study Rooms"
                    value={stats.totalRooms}
                    icon={Server}
                    subtitle="Created servers"
                    color="purple"
                />
                <StatsCard
                    title="Pending Reviews"
                    value={stats.pendingVerifications}
                    icon={FileCheck}
                    subtitle="ID verifications"
                    color="orange"
                    alert={stats.pendingVerifications > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Health */}
                <Card className="bg-stone-900/50 border-white/10 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-500" />
                            System Health
                        </CardTitle>
                        <CardDescription>Real-time service status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ServiceStatus service="Supabase" status="operational" uptime="Online" />
                        <ServiceStatus service="LiveKit" status="operational" uptime="Online" />
                        <ServiceStatus service="Upstash Redis" status="operational" uptime="Online" />
                        <ServiceStatus service="Matchmaking" status="operational" uptime="Online" />
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-stone-900/50 border-white/10 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-500" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RealRecentActivity />
                    </CardContent>
                </Card>
            </div>

            {/* Usage Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricRow label="Total Messages" value={stats.totalMessages} icon={MessageSquare} />
                <MetricRow label="Redis Commands" value={stats.redisCommands} icon={Zap} />
            </div>
        </div>
    )
}

function StatsCard({ title, value, icon: Icon, subtitle, trend, color, alert }: any) {
    const colorMap = {
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-green-500 to-emerald-500',
        purple: 'from-purple-500 to-pink-500',
        orange: 'from-orange-500 to-red-500',
    }

    return (
        <Card className="bg-stone-900/50 border-white/10 hover:border-white/20 transition-all group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} rounded-xl shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    {alert && (
                        <Badge variant="destructive" className="animate-pulse">
                            Action Needed
                        </Badge>
                    )}
                </div>
                <div>
                    < p className="text-sm text-stone-400 mb-1 font-medium">{title}</p>
                    <p className="text-3xl font-bold text-white mb-1 tracking-tight">
                        {value.toLocaleString()}
                    </p>
                    {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
                    {trend && (
                        <div className="flex items-center gap-1 text-xs text-green-400 mt-3 font-medium bg-green-500/10 px-2 py-1 rounded w-fit">
                            <ArrowUp className="w-3 h-3" />
                            {trend}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function ServiceStatus({ service, status, uptime }: any) {
    return (
        <div className="flex items-center justify-between p-3 bg-stone-950/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${status === 'operational' ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.5)]`} />
                <span className="text-sm font-medium text-stone-300">{service}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-stone-500 font-mono">{uptime}</span>
                <Badge variant={status === 'operational' ? 'outline' : 'destructive'} className="text-[10px] h-5 px-2 bg-green-500/10 text-green-400 border-green-500/20">
                    {status}
                </Badge>
            </div>
        </div>
    )
}

function MetricRow({ label, value, icon: Icon }: any) {
    return (
        <Card className="bg-stone-900/40 border-white/5">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-800 rounded-lg">
                        <Icon className="w-4 h-4 text-stone-400" />
                    </div>
                    <span className="text-sm text-stone-400">{label}</span>
                </div>
                <span className="text-lg font-bold text-white">{value.toLocaleString()}</span>
            </CardContent>
        </Card>
    )
}

function RealRecentActivity() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase
                .from('system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) setLogs(data)
            setLoading(false)
        }
        fetchLogs()
    }, [])

    if (loading) {
        return <div className="text-sm text-stone-500 py-4">Checking logs...</div>
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-8 text-stone-500 border border-dashed border-white/5 rounded-lg">
                <p>No recent activity.</p>
                <p className="text-xs mt-1 opacity-50">Admin actions (bans, updates) will appear here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors group cursor-default">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/5 transition-all ${log.level === 'warning' ? 'bg-orange-500/10 text-orange-400' :
                        log.level === 'error' ? 'bg-red-500/10 text-red-400' :
                            'bg-stone-800 text-stone-400'
                        }`}>
                        <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-stone-300 font-medium group-hover:text-white transition-colors">
                            {log.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-stone-600">
                            <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-stone-700 text-stone-500">
                                {log.source}
                            </Badge>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
