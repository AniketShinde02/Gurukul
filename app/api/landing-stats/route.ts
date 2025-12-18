import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Landing Page Stats API
 * Fetches real data for landing page instead of mock data
 * 
 * Returns:
 * - userCount: Total registered users
 * - activeRoom: Most active public room
 * - participantCount: Participants in that room
 * - avatars: Random user avatars (max 4)
 */
export async function GET() {
    try {
        const supabase = await createClient()

        // 1. Get total user count
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        if (userError) {
            console.error('Error fetching user count:', userError)
        }

        // 2. Get most active public room
        const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select(`
                id,
                name,
                room_participants (
                    user_id
                )
            `)
            .eq('is_public', true)
            .limit(5)

        if (roomsError) {
            console.error('Error fetching rooms:', roomsError)
        }

        // Find room with most participants
        let activeRoom = null
        let participantCount = 0

        if (rooms && rooms.length > 0) {
            const roomWithMostParticipants = rooms.reduce((max: any, room: any) => {
                const count = room.room_participants?.length || 0
                return count > (max.room_participants?.length || 0) ? room : max
            }, rooms[0])

            activeRoom = roomWithMostParticipants.name
            participantCount = roomWithMostParticipants.room_participants?.length || 0
        }

        // 3. Get random user avatars (only if we have users)
        let avatars: string[] = []

        if (userCount && userCount > 0) {
            const { data: profilesWithAvatars, error: avatarError } = await supabase
                .from('profiles')
                .select('avatar_url')
                .not('avatar_url', 'is', null)
                .limit(10) // Get 10, then randomize client-side

            if (avatarError) {
                console.error('Error fetching avatars:', avatarError)
            } else if (profilesWithAvatars) {
                // Shuffle and take first 4
                const shuffled = profilesWithAvatars
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 4)
                    .map((p: any) => p.avatar_url)
                    .filter(Boolean) as string[]

                avatars = shuffled
            }
        }

        // Return stats
        return NextResponse.json({
            userCount: userCount || 0,
            activeRoom: activeRoom,
            participantCount: participantCount,
            avatars: avatars,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Landing stats API error:', error)

        // Return safe defaults on error
        return NextResponse.json({
            userCount: 0,
            activeRoom: null,
            participantCount: 0,
            avatars: [],
            error: 'Failed to fetch stats'
        }, { status: 500 })
    }
}

// Cache for 5 minutes
export const revalidate = 300
