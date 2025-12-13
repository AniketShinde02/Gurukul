import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export type DashboardStats = {
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

export function useAdminStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

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
                supabase.from('room_messages').select('*', { count: 'exact', head: true }),
                supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('banned_users').select('*', { count: 'exact', head: true }),
            ])

            // Fetch Redis stats from API route
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
                supabaseSize: 0,
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
            toast.error('Failed to load dashboard stats')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    return { stats, loading, refetch: fetchStats }
}
