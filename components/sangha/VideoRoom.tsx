'use client'

import { useEffect, useRef } from 'react'
import { useCall } from './GlobalCallManager'

export function VideoRoom({ roomName, username, onLeave, onToggleChat }: { roomName: string, username: string, onLeave?: () => void, onToggleChat?: () => void }) {
    const { joinRoom, minimize, setVideoContainer, state } = useCall()
    const containerRef = useRef<HTMLDivElement>(null)
    const previousState = useRef(state)
    const shouldJoin = useRef(true)

    // Handle disconnect detection
    useEffect(() => {
        if (previousState.current === 'connected' && state === 'idle') {
            shouldJoin.current = false
            onLeave?.()
        }
        previousState.current = state
    }, [state, onLeave])

    useEffect(() => {
        if (shouldJoin.current) {
            joinRoom(roomName)
        }

        if (containerRef.current) {
            setVideoContainer(containerRef.current)
        }

        return () => {
            setVideoContainer(null)
            minimize()
        }
    }, [roomName, joinRoom, minimize, setVideoContainer])

    return (
        <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center bg-stone-950/50 backdrop-blur-sm relative overflow-hidden">
            {/* This text will be covered by the portal content when it arrives */}
            {state !== 'connected' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
                        <h2 className="text-5xl font-sanskrit font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200 relative z-10 animate-in fade-in zoom-in duration-1000 py-4 leading-relaxed">
                            Entering Digital Gurukul...
                        </h2>
                    </div>
                    <p className="text-stone-500 mt-4 font-mono text-xs tracking-widest uppercase opacity-70">
                        Entering Digital Gurukul...
                    </p>
                </div>
            )}
        </div>
    )
}
