import { useEffect, useRef } from 'react'
import { UserX } from 'lucide-react'

interface VideoGridProps {
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    isVideoEnabled: boolean // For local user preference
}

export function VideoGrid({ localStream, remoteStream, isVideoEnabled }: VideoGridProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)

    // Helper to safely play video
    const safePlay = async (video: HTMLVideoElement, stream: MediaStream) => {
        try {
            video.srcObject = stream
            await video.play()
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Video playback error:', error)
            }
        }
    }

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            safePlay(localVideoRef.current, localStream)
        }
    }, [localStream, isVideoEnabled])

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            safePlay(remoteVideoRef.current, remoteStream)
        }
    }, [remoteStream])

    return (
        <div className="relative w-full h-full bg-black overflow-hidden rounded-3xl">
            {/* Remote Video (Main View) */}
            <div className="absolute inset-0 flex items-center justify-center">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 text-stone-500">
                        <div className="w-24 h-24 rounded-full bg-stone-800/50 flex items-center justify-center animate-pulse">
                            <UserX className="w-10 h-10" />
                        </div>
                        <p>Waiting for partner...</p>
                    </div>
                )}
            </div>

            {/* Local Video (PIP) */}
            <div className="absolute bottom-6 right-6 w-48 h-36 bg-stone-900 rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-10 transition-all hover:scale-105">
                {localStream && isVideoEnabled ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-800">
                        <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center">
                            <span className="text-xs text-stone-400">You</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
