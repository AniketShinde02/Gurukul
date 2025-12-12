'use client'

import { useParticipants } from '@livekit/components-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mic, MicOff } from 'lucide-react'

/**
 * LiveKitParticipantList - Real-time participant display using LiveKit hooks
 * 
 * This component MUST be rendered inside a <LiveKitRoom> component.
 * It uses LiveKit's useParticipants() hook which automatically updates
 * when participants join/leave the room.
 * 
 * Features:
 * - Real-time updates (no polling needed)
 * - Shows mic status
 * - Shows "You" label for local participant
 * - Displays avatar and username
 */
export function LiveKitParticipantList() {
    const participants = useParticipants()

    if (participants.length === 0) {
        return (
            <div className="px-2 py-3 text-center">
                <p className="text-xs text-stone-500 italic">No one connected</p>
            </div>
        )
    }

    return (
        <div className="space-y-1 px-2 py-2">
            {participants.map((participant) => {
                const isLocal = participant.isLocal
                const isMuted = participant.isMicrophoneEnabled === false
                const identity = participant.identity
                const metadata = participant.metadata ? JSON.parse(participant.metadata) : {}

                return (
                    <div
                        key={participant.sid}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                        <Avatar className="w-7 h-7 border border-white/10">
                            <AvatarImage src={metadata.avatar_url} />
                            <AvatarFallback className="bg-orange-600 text-white text-xs font-bold">
                                {identity[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                                {metadata.username || identity}
                                {isLocal && <span className="text-stone-500 ml-1">(You)</span>}
                            </p>
                        </div>

                        <div className="flex-shrink-0">
                            {isMuted ? (
                                <MicOff className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                                <Mic className="w-3.5 h-3.5 text-green-500" />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
