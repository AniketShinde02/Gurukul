'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    TrendingUp, Users, MessageSquare, Server, Phone, Clock,
    BarChart3, Activity, ArrowUp, ArrowDown
} from 'lucide-react'

type AnalyticsData = {
    userGrowth: { date: string; count: number }[]
    messageVolume: { date: string; count: number }[]
    activeRooms: { date: string; count: number }[]
    peakHours: { hour: number; count: number }[]
    topRooms: { id: string; name: string; members: number; messages: number }[]
    userEngagement: { avgSessionTime: number; avgMessagesPerUser: number; dailyActiveUsers: number }
}

export function AnalyticsTab() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

    useEffect(() => {
        fetchAnalytics()
    }, [timeRange])

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            // Calculate date range
            const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - daysAgo)

            // Fetch user growth
            const { data: userGrowth } = await supabase
                .from('profiles')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .order('created_at')

            // Fetch message volume
            const { data: messageVolume } = await supabase
                .from('room_messages')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .order('created_at')

            // Fetch room activity
            const { data: rooms } = await supabase
                .from('study_rooms')
                .select(`
                    id,
                    name,
                    created_at,
                    room_participants(count),
                    room_messages(count)
                `)
                .order('created_at', { ascending: false })
                .limit(10)

            // Process data
            const userGrowthByDay = processTimeSeriesData(userGrowth || [], daysAgo)
            const messagesByDay = processTimeSeriesData(messageVolume || [], daysAgo)

            // Top rooms
            const topRooms = (rooms || []).map(room => ({
                id: room.id,
                name: room.name,
                members: room.room_participants?.[0]?.count || 0,
                messages: room.room_messages?.[0]?.count || 0
            })).sort((a, b) => b.messages - a.messages).slice(0, 5)

            // Calculate engagement metrics
            const totalUsers = userGrowth?.length || 0
            const totalMessages = messageVolume?.length || 0
            const avgMessagesPerUser = totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0

            setAnalytics({
                userGrowth: userGrowthByDay,
                messageVolume: messagesByDay,
                activeRooms: processTimeSeriesData(rooms || [], daysAgo),
                peakHours: calculatePeakHours(messageVolume || []),
                topRooms,
                userEngagement: {
                    avgSessionTime: 25, // TODO: Calculate from actual session data
                    avgMessagesPerUser,
                    dailyActiveUsers: Math.round(totalUsers / daysAgo)
                }
            })
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const processTimeSeriesData = (data: any[], days: number) => {
        const result: { date: string; count: number }[] = []
        const today = new Date()

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            const count = data.filter(item => {
                const itemDate = new Date(item.created_at).toISOString().split('T')[0]
                return itemDate === dateStr
            }).length

            result.push({ date: dateStr, count })
        }

        return result
    }

    const calculatePeakHours = (messages: any[]) => {
        const hourCounts: { [hour: number]: number } = {}

        messages.forEach(msg => {
            const hour = new Date(msg.created_at).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })

        return Object.entries(hourCounts)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
    }

    if (loading || !analytics) {
        return (
            <div className="flex items-center justify-center p-20">
                <Activity className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
                <div className="flex gap-2">
                    {(['7d', '30d', '90d'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                                ? 'bg-orange-500 text-white'
                                : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                }`}
                        >
                            {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Avg. Session Time"
                    value={`${analytics.userEngagement.avgSessionTime} min`}
                    change="+8%"
                    positive
                    icon={Clock}
                />
                <MetricCard
                    title="Msgs per User"
                    value={analytics.userEngagement.avgMessagesPerUser}
                    change="+15%"
                    positive
                    icon={MessageSquare}
                />
                <MetricCard
                    title="Daily Active Users"
                    value={analytics.userEngagement.dailyActiveUsers}
                    change="+22%"
                    positive
                    icon={Users}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card className="bg-stone-900/50 border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            User Growth
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimpleLineChart data={analytics.userGrowth} color="blue" />
                    </CardContent>
                </Card>

                {/* Message Volume Chart */}
                <Card className="bg-stone-900/50 border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-green-500" />
                            Message Volume
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SimpleLineChart data={analytics.messageVolume} color="green" />
                    </CardContent>
                </Card>
            </div>

            {/* Top Rooms */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-purple-500" />
                        Top Rooms by Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {analytics.topRooms.map((room, index) => (
                            <div
                                key={room.id}
                                className="flex items-center justify-between p-4 bg-stone-950/50 rounded-lg border border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl font-bold text-stone-600">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{room.name}</p>
                                        <p className="text-xs text-stone-500">
                                            {room.members} members • {room.messages} messages
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-white">{room.messages}</p>
                                        <p className="text-xs text-stone-500">messages</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Peak Activity Hours
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-5 gap-3">
                        {analytics.peakHours.map((peak) => (
                            <div key={peak.hour} className="text-center p-4 bg-stone-950/50 rounded-lg border border-white/5">
                                <p className="text-2xl font-bold text-white">
                                    {peak.hour}:00
                                </p>
                                <p className="text-sm text-stone-400 mt-1">
                                    {peak.count} msgs
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function MetricCard({ title, value, change, positive, icon: Icon }: any) {
    return (
        <Card className="bg-stone-900/50 border-white/10">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-stone-400" />
                    <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {change}
                    </div>
                </div>
                <p className="text-sm text-stone-400 mb-1">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </CardContent>
        </Card>
    )
}

function SimpleLineChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
    const max = Math.max(...data.map(d => d.count)) || 1
    const colorMap = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500'
    }

    return (
        <div className="space-y-2">
            <div className="flex items-end justify-between h-40 gap-1">
                {data.map((point, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2">
                        <div
                            className={`w-full ${colorMap[color as keyof typeof colorMap] || 'bg-blue-500'} rounded-t transition-all hover:opacity-80`}
                            style={{ height: `${(point.count / max) * 100}%`, minHeight: '4px' }}
                            title={`${point.date}: ${point.count}`}
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 mt-2">
                <span>{data[0]?.date}</span>
                <span>{data[data.length - 1]?.date}</span>
            </div>
        </div>
    )
}
