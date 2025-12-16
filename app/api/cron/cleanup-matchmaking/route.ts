import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Cron job to cleanup stale matchmaking queue entries
 * Runs every 5 minutes via Vercel Cron
 * 
 * Removes:
 * - Queue entries older than 5 minutes (orphaned users)
 * - Active sessions older than 2 hours (stuck sessions)
 */
export async function GET(req: Request) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
        console.error('[Cron] CRON_SECRET not configured')
        return NextResponse.json(
            { error: 'Cron not configured' },
            { status: 500 }
        )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('[Cron] Unauthorized access attempt')
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    try {
        const supabase = await createClient()

        // Call the cleanup function (already exists in database)
        const { data, error } = await supabase.rpc('cleanup_matchmaking')

        if (error) {
            console.error('[Cron] Cleanup failed:', error)
            return NextResponse.json(
                { error: 'Cleanup failed', details: error.message },
                { status: 500 }
            )
        }

        const deletedCount = data || 0

        console.log(`[Cron] Cleanup successful: ${deletedCount} entries removed`)

        return NextResponse.json({
            success: true,
            deletedCount,
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('[Cron] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal error', details: error.message },
            { status: 500 }
        )
    }
}
