'use client'

import { PerformanceTab } from '@/components/admin/PerformanceTab'
import { useAdminStats } from '@/hooks/useAdminStats'
import { Loader2 } from 'lucide-react'

export default function AdminPerformancePage() {
    const { stats, loading } = useAdminStats()

    if (loading || !stats) {
        return (
            <div className="flex bg-transparent w-full items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        )
    }

    return <PerformanceTab stats={stats} />
}
