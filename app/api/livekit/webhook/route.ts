import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { redis, isRedisConfigured } from '@/lib/redis';

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
            if (!roomName) return new NextResponse('No room name', { status: 400 });

            console.log(`📡 Webhook: ${event.event} - ${participant?.identity} in ${roomName}`);

            if (isRedisConfigured()) {
                const cacheKey = `participants:${roomName}`;

                // 2. Invalidate the cache (force next fetch to get fresh data)
                // Alternatively, we could maintain a Set in Redis, but deleting the key 
                // is safer and simpler to ensure consistency with LiveKit's truth.
                await redis.del(cacheKey);

                // 3. Publish an update signal to Redis Pub/Sub
                // The SSE stream will listen to this and trigger a client update
                const channel = `updates:${roomName}`;
                // Broadcast via WebSocket Server
                // Use env var MATCHMAKING_SERVER_URL or default to localhost
                const wsServerUrl = process.env.MATCHMAKING_SERVER_URL || 'http://localhost:8080';

                try {
                    await fetch(`${wsServerUrl}/broadcast`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ roomName, participants: [] })
                    });
                } catch (wsError) {
                    console.warn('Failed to broadcast to WS server (is it running?):', wsError);
                    // Fallback: Redis publish (client can listen if they want, but WS is preferred)
                    const message = JSON.stringify({ type: 'PARTICIPANT_UPDATE', room: roomName });
                    await redis.publish(channel, message);
                }
            }
        }

        return new NextResponse('ok', { status: 200 });

    } catch (error) {
        console.error('Webhook error:', error);
        return new NextResponse('Webhook processing failed', { status: 500 });
    }
}
