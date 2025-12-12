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
