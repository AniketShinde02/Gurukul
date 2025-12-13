import { Redis } from '@upstash/redis'

// Initialize Redis client
// We expect UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

/**
 * Helper to check if Redis is configured
 */
export const isRedisConfigured = () => {
    return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
}

/**
 * Redis Key Schemas - Organized namespace for all Redis keys
 * This prevents key collisions and makes debugging easier
 */
export const RedisKeys = {
    // Voice channel participants (Set)
    voiceParticipants: (roomId: string, channelName: string) =>
        `voice:${roomId}:${channelName}:participants`,

    // Rate limiting (String with TTL)
    rateLimit: (identifier: string, endpoint: string) =>
        `rl:${endpoint}:${identifier}`,

    // Cached queries (JSON with TTL)
    roomMembers: (roomId: string) => `cache:members:${roomId}`,
    roomStats: (roomId: string) => `cache:stats:${roomId}`,

    // Matchmaking queue cache (for faster lookups)
    queuePosition: (userId: string) => `queue:pos:${userId}`,
}

/**
 * Rate Limiting using Redis
 * Sliding window algorithm
 */
export async function rateLimit(
    identifier: string,
    endpoint: string,
    limit: number = 10,
    windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
    if (!isRedisConfigured()) {
        // If Redis not configured, allow request (fail open)
        return { allowed: true, remaining: limit }
    }

    const key = RedisKeys.rateLimit(identifier, endpoint)

    try {
        const count = await redis.incr(key)

        // Set expiry only on first request
        if (count === 1) {
            await redis.expire(key, windowSeconds)
        }

        const allowed = count <= limit
        const remaining = Math.max(0, limit - count)

        return { allowed, remaining }

    } catch (e) {
        // If Redis fails, allow request (fail open)
        console.error('[RateLimit] Redis error:', e)
        return { allowed: true, remaining: limit }
    }
}
