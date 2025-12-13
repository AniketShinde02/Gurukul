import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { redis, isRedisConfigured, RedisKeys } from '@/lib/redis';

const roomService = new RoomServiceClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('room');

    if (!roomName) {
        return NextResponse.json({ error: 'Missing room name' }, { status: 400 });
    }

    // Parse roomName format: "roomId-ChannelName"
    const parts = roomName.split('-');
    const roomId = parts[0];
    const channelName = parts.slice(1).join('-');

    try {
        // 1. Try Redis FIRST (instant response, source of truth)
        if (isRedisConfigured()) {
            const redisKey = RedisKeys.voiceParticipants(roomId, channelName);
            const participants = await redis.smembers(redisKey);

            if (participants && participants.length > 0) {
                // Cache HIT - return immediately
                // Map to expected format: { sid, identity }
                return NextResponse.json(
                    participants.map(identity => ({
                        sid: identity,
                        identity
                    }))
                );
            }
        }

        // 2. Cache MISS - Fetch from LiveKit (room might be new or Redis not configured)
        const liveParticipants = await roomService.listParticipants(roomName);

        // 3. Populate Redis for next request (if participants exist)
        if (isRedisConfigured() && liveParticipants.length > 0) {
            const redisKey = RedisKeys.voiceParticipants(roomId, channelName);
            const identities = liveParticipants.map(p => p.identity);

            await redis.sadd(redisKey, ...(identities as [string, ...string[]]));
            await redis.expire(redisKey, 3600); // 1 hour TTL
        }

        return NextResponse.json(liveParticipants);

    } catch (error: any) {
        // Suppress "room does not exist" error as it just means the room is empty/inactive
        if (error?.message?.includes('does not exist') || error?.status === 404) {
            return NextResponse.json([]);
        }
        console.error('Error fetching participants:', error);
        return NextResponse.json([]);
    }
}
