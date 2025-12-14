'use client'

import { useEffect, useState, useRef } from 'react'
import { useParticipants, useLocalParticipant, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Mic, MicOff, Video as VideoIcon, VideoOff, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSound } from '@/hooks/useSound'

interface ParticipantGridProps {
    roomName: string
}

export function ParticipantGrid({ roomName }: ParticipantGridProps) {
    const participants = useParticipants()
    const localParticipant = useLocalParticipant()
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
        ],
        { onlySubscribed: false }
    )
    const [gridLayout, setGridLayout] = useState<string>('')
    const { play } = useSound()
    const prevParticipantCountRef = useRef(0)

    // Calculate grid layout based on participant count
    useEffect(() => {
        const count = participants.length

        if (count === 1) {
            setGridLayout('grid-cols-1 grid-rows-1')
        } else if (count === 2) {
            setGridLayout('grid-cols-2 grid-rows-1')
        } else if (count <= 4) {
            setGridLayout('grid-cols-2 grid-rows-2')
        } else if (count <= 6) {
            setGridLayout('grid-cols-3 grid-rows-2')
        } else if (count <= 9) {
            setGridLayout('grid-cols-3 grid-rows-3')
        } else if (count <= 12) {
            setGridLayout('grid-cols-4 grid-rows-3')
        } else {
            setGridLayout('grid-cols-4 grid-rows-4')
        }
    }, [participants.length])

    // Play join/leave sounds when participant count changes
    useEffect(() => {
        const currentCount = participants.length
        const prevCount = prevParticipantCountRef.current

        // Skip on initial mount (when prevCount is 0)
        if (prevCount > 0) {
            if (currentCount > prevCount) {
                // Someone joined
                play('USER_JOIN')
            } else if (currentCount < prevCount) {
                // Someone left
                play('USER_LEAVE')
            }
        }

        prevParticipantCountRef.current = currentCount
    }, [participants.length, play])

    if (participants.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-stone-950">
                <div className="text-center">
                    <User className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                    <p className="text-stone-400">No participants yet</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full p-4 bg-stone-950">
            <div className={`grid ${gridLayout} gap-3 h-full w-full auto-rows-fr`}>
                {tracks.map((trackRef) => {
                    const participant = trackRef.participant
                    const isLocal = participant.sid === localParticipant.localParticipant?.sid
                    const isMuted = !participant.isMicrophoneEnabled
                    const isVideoOff = !participant.isCameraEnabled
                    const identity = participant.identity || 'Unknown'
                    const metadata = participant.metadata ? JSON.parse(participant.metadata) : {}

                    return (
                        <div
                            key={participant.sid}
                            className="relative bg-stone-900 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center group hover:border-orange-500/50 transition-all"
                        >
                            {/* Video Track or Avatar */}
                            {trackRef.publication && !isVideoOff ? (
                                <video
                                    ref={(el) => {
                                        if (el && trackRef.publication?.track) {
                                            trackRef.publication.track.attach(el)
                                        }
                                    }}
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                    autoPlay
                                    playsInline
                                    muted={isLocal}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <Avatar className="w-20 h-20 border-4 border-orange-500/20">
                                        <AvatarImage src={metadata.avatar_url} />
                                        <AvatarFallback className="bg-orange-600 text-white text-2xl font-bold">
                                            {identity[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-white font-medium mt-3">{metadata.username || identity}</p>
                                </div>
                            )}

                            {/* Participant Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white text-sm font-medium truncate max-w-[150px]">
                                            {metadata.username || identity}
                                            {isLocal && ' (You)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isMuted ? (
                                            <div className="p-1.5 bg-red-500/90 rounded-full">
                                                <MicOff className="w-3 h-3 text-white" />
                                            </div>
                                        ) : (
                                            <div className="p-1.5 bg-green-500/90 rounded-full">
                                                <Mic className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                        {isVideoOff && (
                                            <div className="p-1.5 bg-stone-700/90 rounded-full">
                                                <VideoOff className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Speaking Indicator */}
                            {participant.isSpeaking && (
                                <div className="absolute inset-0 border-4 border-orange-500 rounded-xl pointer-events-none animate-pulse" />
                            )}

                            {/* Local Indicator */}
                            {isLocal && (
                                <div className="absolute top-3 left-3 px-2 py-1 bg-orange-600 rounded text-xs font-bold text-white">
                                    YOU
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
