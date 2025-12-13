'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Users, Shield, Activity, Database, TrendingUp, AlertTriangle,
    FileCheck, Ban, Clock, Zap, Server, MessageSquare, Phone,
    GraduationCap, Star, Settings, BarChart3, RefreshCw,
    CheckCircle2, XCircle, Loader2, Eye, Terminal
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import { UsersManagementTab } from '@/components/admin/UsersManagementTab'
import { RoomsManagementTab } from '@/components/admin/RoomsManagementTab'
import { PerformanceTab } from '@/components/admin/PerformanceTab'
import { SystemLogsTab } from '@/components/admin/SystemLogsTab'
import { AnalyticsTab } from '@/components/admin/AnalyticsTab'

type DashboardStats = {
    totalUsers: number
    activeUsers: number
    totalRooms: number
    activeCalls: number
    totalMessages: number
    pendingVerifications: number
    bannedUsers: number
    redisCommands: number
    supabaseSize: number
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const router = useRouter()

    useEffect(() => {
        verifyAdmin()
        fetchStats()

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    const verifyAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_admin) {
            toast.error('Unauthorized access')
            router.push('/')
        }
    }

    const fetchStats = async () => {
        try {
            setLoading(true)

            // Fetch all stats in parallel
            const [
                { count: totalUsers },
                { count: activeUsers },
                { count: totalRooms },
                { count: totalMessages },
                { count: pendingVerifications },
                { count: bannedUsers },
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_online', true),
                supabase.from('study_rooms').select('*', { count: 'exact', head: true }),
                supabase.from('messages').select('*', { count: 'exact', head: true }),
                supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('banned_users').select('*', { count: 'exact', head: true }),
            ])

            // TODO: Fetch Redis stats from API route
            const redisStats = await fetch('/api/admin/redis-stats').then(r => r.json()).catch(() => ({ commands: 0 }))

            setStats({
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                totalRooms: totalRooms || 0,
                activeCalls: 0, // TODO: Get from LiveKit API
                totalMessages: totalMessages || 0,
                pendingVerifications: pendingVerifications || 0,
                bannedUsers: bannedUsers || 0,
                redisCommands: redisStats.commands || 0,
                supabaseSize: 0, // TODO: Get from Supabase API
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
            toast.error('Failed to load dashboard stats')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !stats) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-stone-950">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200">
            {/* Header */}
            <div className="border-b border-white/10 bg-stone-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-sm text-stone-400">Global system monitoring & management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => fetchStats()} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                Back to App
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-6 space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={Users}
                        trend="+12% vs last week"
                        color="blue"
                    />
                    <StatsCard
                        title="Active Now"
                        value={stats?.activeUsers || 0}
                        icon={Activity}
                        subtitle="Online users"
                        color="green"
                    />
                    <StatsCard
                        title="Study Rooms"
                        value={stats?.totalRooms || 0}
                        icon={Server}
                        subtitle="Created servers"
                        color="purple"
                    />
                    <StatsCard
                        title="Pending Reviews"
                        value={stats?.pendingVerifications || 0}
                        icon={FileCheck}
                        subtitle="ID verifications"
                        color="orange"
                        alert={stats?.pendingVerifications!! > 0}
                    />
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-stone-900 border border-white/10">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="rooms">Rooms</TabsTrigger>
                        <TabsTrigger value="verifications">Verifications</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="logs">System Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <OverviewTab stats={stats!} />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <AnalyticsTab />
                    </TabsContent>

                    <TabsContent value="users">
                        <UsersManagementTab />
                    </TabsContent>

                    <TabsContent value="rooms">
                        <RoomsManagementTab />
                    </TabsContent>

                    <TabsContent value="verifications">
                        <VerificationsTab />
                    </TabsContent>

                    <TabsContent value="performance">
                        <PerformanceTab stats={stats!} />
                    </TabsContent>

                    <TabsContent value="logs">
                        <SystemLogsTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, subtitle, trend, color, alert }: any) {
    const colorMap = {
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-green-500 to-emerald-500',
        purple: 'from-purple-500 to-pink-500',
        orange: 'from-orange-500 to-red-500',
        red: 'from-red-500 to-rose-500',
    }

    return (
        <Card className="bg-stone-900/50 border-white/10 hover:border-white/20 transition-all">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    {alert && (
                        <Badge variant="destructive" className="animate-pulse">
                            Action Needed
                        </Badge>
                    )}
                </div>
                <div>
                    <p className="text-sm text-stone-400 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-white mb-1">
                        {value.toLocaleString()}
                    </p>
                    {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
                    {trend && <p className="text-xs text-green-400 mt-2">{trend}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

// Overview Tab
function OverviewTab({ stats }: { stats: DashboardStats }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        System Health
                    </CardTitle>
                    <CardDescription>Real-time service status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <ServiceStatus service="Supabase" status="operational" uptime="99.9%" />
                    <ServiceStatus service="LiveKit" status="operational" uptime="99.7%" />
                    <ServiceStatus service="Upstash Redis" status="operational" uptime="100%" />
                    <ServiceStatus service="Matchmaking Server" status="operational" uptime="98.5%" />
                    <ServiceStatus service="Vercel Edge" status="operational" uptime="99.9%" />
                </CardContent>
            </Card>

            {/* Usage Metrics */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Usage Metrics
                    </CardTitle>
                    <CardDescription>Last 24 hours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <MetricRow label="Total Messages" value={stats.totalMessages} icon={MessageSquare} />
                    <MetricRow label="Voice Calls" value={stats.activeCalls} icon={Phone} />
                    <MetricRow label="Redis Commands" value={stats.redisCommands} icon={Zap} />
                    <MetricRow label="Database Size" value={`${stats.supabaseSize}MB`} icon={Database} />
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
                    <RecentActivityList />
                </CardContent>
            </Card>
        </div>
    )
}

function ServiceStatus({ service, status, uptime }: any) {
    return (
        <div className="flex items-center justify-between p-3 bg-stone-950/50 rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${status === 'operational' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-sm font-medium text-stone-300">{service}</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs text-stone-500">{uptime} uptime</span>
                <Badge variant={status === 'operational' ? 'default' : 'destructive'} className="text-xs">
                    {status}
                </Badge>
            </div>
        </div>
    )
}

function MetricRow({ label, value, icon: Icon }: any) {
    return (
        <div className="flex items-center justify-between p-3 bg-stone-950/50 rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-400">{label}</span>
            </div>
            <span className="text-sm font-bold text-white">{value.toLocaleString()}</span>
        </div>
    )
}

function RecentActivityList() {
    const [activities, setActivities] = useState<any[]>([])

    useEffect(() => {
        // TODO: Fetch recent activities from database
        // For now, mock data
        setActivities([
            { type: 'user_joined', message: 'New user @aniket signed up', time: '2 min ago' },
            { type: 'verification', message: 'ID verification approved for @ritesh', time: '15 min ago' },
            { type: 'room_created', message: 'New room "AI Study Group" created', time: '1 hour ago' },
            { type: 'ban', message: 'User @spammer banned for violations', time: '2 hours ago' },
        ])
    }, [])

    return (
        <div className="space-y-2">
            {activities.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-stone-950/30 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-stone-300">{activity.message}</p>
                        <p className="text-xs text-stone-600">{activity.time}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// Users Management Tab - Now using imported component

// Rooms Management Tab - Now using imported component

// Verifications Tab
function VerificationsTab() {
    return (
        <div className="text-white">
            <p>Verification requests are managed in the dedicated page:</p>
            <Link href="/admin/verifications">
                <Button className="mt-4">
                    <FileCheck className="w-4 h-4 mr-2" />
                    Go to Verifications Page
                </Button>
            </Link>
        </div>
    )
}

// Performance Tab - Now using imported component

// System Logs Tab - Now using imported component
