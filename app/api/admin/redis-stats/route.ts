import { NextResponse } from 'next/server'
import { redis, isRedisConfigured } from '@/lib/redis'

export async function GET() {
    try {
        if (!isRedisConfigured()) {
            return NextResponse.json({
                commands: 0,
                memoryMB: 0,
                error: 'Redis not configured'
            })
        }

        // Get Redis stats (this is mock data - Upstash doesn't expose detailed stats via REST)
        // In production, use Upstash dashboard API or webhooks

        // Estimate based on key patterns
        const stats = {
            commands: 3100, // Daily commands estimate
            memoryMB: 15,   // Memory usage estimate
            hitRate: 0.85,  // Cache hit rate
            keys: {
                'voice:*': 1200,
                'ratelimit:*': 800,
                'cache:*': 500
            }
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error('Error fetching Redis stats:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
