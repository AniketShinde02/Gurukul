import { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('room');

    if (!roomName) {
        return new Response('Missing room name', { status: 400 });
    }

    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
        async start(controller) {
            // Helper to send data
            const sendEvent = (data: any) => {
                if (isClosed) return;
                const message = `data: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            // 1. Send initial "Connected" message
            sendEvent({ type: 'CONNECTED', room: roomName });

            // 2. Subscribe to Redis updates for this room
            // Note: Upstash HTTP Redis doesn't support persistent 'subscribe' in the same way 
            // a TCP client does. We have to poll strictly for the *updates* or use a workaround.
            // HOWEVER, for a true Event-Driven setup with Upstash, we can't block the Edge function forever.
            //
            // SOLUTION for Serverless SSE:
            // We unfortunately can't hold a persistent Redis subscription in a Vercel/Next.js Serverless function constantly.
            // But we CAN make the client re-fetch when we tell it to.
            //
            // ALTERNATIVE: Since we cannot hold a permanent socket open in Next.js API routes (without custom server),
            // The logic below acts as a "Long Polling" simplified wrapper or we accept that
            // for true SSE we need a separate server or Vercel Edge implementation.
            // 
            // For THIS implementation (Next.js App Router):
            // We will send a "ping" every few seconds to keep connection alive, 
            // but the REAL updates depend on the Client's EventSource.

            // Wait... standard Redis Pub/Sub doesn't work well over HTTP (Upstash).
            // We will simplify: The client will use the 'long-polling' fallback if SSE fails,
            // BUT, let's try to just send a "heartbeat" to keep it open.

            // Due to limitations of Serverless + Upstash HTTP not supporting blocking .subscribe(),
            // We will actually implement a "Smart Poller" in the client instead of complex server-side hooks,
            // OR we'd need a TCP-based Redis client which might timeout.

            // REVISION: To barely change your infrastructure, we will stick to the PLAN:
            // The client already polls. We want to stop that. 
            // If we can't easily do Pub/Sub in serverless, we might just stick to 
            // highly optimized caching (Phase 1) which we just did.
            //
            // IF YOU WANT ZERO POLLING:
            // You really need a WebSocket server (like your `matchmaking-server`).

            // Let's abort this SSE route for now because Serverless SSE + Redis Pub/Sub is brittle 
            // without a dedicated WS server.
            // I will pivot to optimizing the Client to use "Smart Backoff" instead of just 5s.

            // WAIT - I can use the existing 'matchmaking-server' (WebSocket) to broadcast!
            // That is much better than a fragile Next.js SSE route.

            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
