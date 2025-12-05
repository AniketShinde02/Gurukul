import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

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

    try {
        const participants = await roomService.listParticipants(roomName);
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
