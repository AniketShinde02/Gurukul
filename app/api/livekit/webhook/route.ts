import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { redis, isRedisConfigured, RedisKeys } from '@/lib/redis';

// Initialize Webhook Receiver
const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
);

export async function POST(request: NextRequest) {
    try {
        // 1. Verify and parse the webhook event
        const body = await request.text();
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return new NextResponse('Missing Authorization Header', { status: 401 });
        }

        const event = await receiver.receive(body, authHeader);
        const { room, participant } = event;

        // We only care about participant changes
        if (
            event.event === 'participant_joined' ||
            event.event === 'participant_left'
        ) {
            const roomName = room?.name;
            const participantId = participant?.identity;

            if (!roomName || !participantId) {
                return new NextResponse('Invalid webhook data', { status: 400 });
            }

            console.log(`📡 Webhook: ${event.event} - ${participantId} in ${roomName}`);

            // Parse roomName format: "roomId-ChannelName"
            const parts = roomName.split('-');
            const roomId = parts[0];
            const channelName = parts.slice(1).join('-');

            if (isRedisConfigured()) {
                const redisKey = RedisKeys.voiceParticipants(roomId, channelName);

                // 1. Update Redis IMMEDIATELY (this is now the source of truth)
                if (event.event === 'participant_joined') {
                    await redis.sadd(redisKey, participantId);
                } else {
                    await redis.srem(redisKey, participantId);
                }

                // Set expiry to auto-clean (1 hour should be enough)
                await redis.expire(redisKey, 3600);

                // 2. Invalidate old participant cache (if it exists)
                const oldCacheKey = `participants:${roomName}`;
                await redis.del(oldCacheKey);

                // 3. Broadcast via WebSocket Server
                const wsServerUrl = process.env.MATCHMAKING_SERVER_URL || 'http://localhost:8080';

                try {
                    // Get current participant list from Redis
                    const currentParticipants = await redis.smembers(redisKey);

                    await fetch(`${wsServerUrl}/broadcast`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            roomName,
                            participants: currentParticipants
                        })
                    });
                } catch (wsError) {
                    console.warn('Failed to broadcast to WS server (is it running?):', wsError);
                }
            }
        }

        return new NextResponse('ok', { status: 200 });

    } catch (error) {
        console.error('Webhook error:', error);
        return new NextResponse('Webhook processing failed', { status: 500 });
    }
}
