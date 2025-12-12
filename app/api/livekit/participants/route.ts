import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';

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

    // Cache key for this room's participants
    const cacheKey = `participants:${roomName}`;

    try {
        // 1. Try Cache First (if configured)
        if (isRedisConfigured()) {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                // console.log('✅ Cache HIT for:', roomName); // Uncommon to log usage in prod
                return NextResponse.json(cachedData);
            }
        }

        // 2. Fetch from LiveKit (Cache MISS)
        // console.log('❌ Cache MISS for:', roomName);
        const participants = await roomService.listParticipants(roomName);

        // 3. Store in Cache (TTL: 5 seconds - same as poll interval)
        if (isRedisConfigured()) {
            // Use 'ex' (seconds) for expiration
            await redis.set(cacheKey, participants, { ex: 5 });
        }

        return NextResponse.json(participants);

    } catch (error: any) {
        // Suppress "room does not exist" error as it just means the room is empty/inactive
        if (error?.message?.includes('does not exist') || error?.status === 404) {
            return NextResponse.json([]);
        }
        console.error('Error fetching participants:', error);
        return NextResponse.json([]);
    }
}
