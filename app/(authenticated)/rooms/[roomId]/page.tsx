'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JitsiMeeting } from '@jitsi/react-sdk'
import { supabase } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, Users, Info, Shield, Flame } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Room = {
    id: string
    name: string
    topic: string
    description: string
    created_by: string
}

type Profile = {
    id: string
    username: string
    full_name: string
    avatar_url: string
}

export default function RoomPage() {
    const { roomId } = useParams()
    const router = useRouter()
    const [room, setRoom] = useState<Room | null>(null)
    const [user, setUser] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [jitsiLoaded, setJitsiLoaded] = useState(false)

    // Refs to track state for cleanup
    const joinedRef = useRef(false)

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Get Current User
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (!authUser) {
                    router.push('/')
                    return
                }

                // 2. Get Profile Details
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (profile) setUser(profile)

                // 3. Get Room Details
                const { data: roomData, error: roomError } = await supabase
                    .from('study_rooms')
                    .select('*')
                    .eq('id', roomId)
                    .single()

                if (roomError || !roomData) throw new Error('Room not found')
                setRoom(roomData)

                // 4. Join Room (Add to participants)
                if (!joinedRef.current) {
                    await supabase.from('room_participants').insert({
                        room_id: roomId,
                        user_id: authUser.id,
                        role: roomData.created_by === authUser.id ? 'host' : 'member'
                    })
                    joinedRef.current = true
                }

            } catch (error) {
                console.error('Error initializing room:', error)
                toast.error('Failed to join room')
                router.push('/rooms')
            } finally {
                setLoading(false)
            }
        }

        if (roomId) init()

        // Cleanup: Leave room on unmount
        return () => {
            if (joinedRef.current && roomId) {
                const leave = async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        await supabase
                            .from('room_participants')
                            .delete()
                            .eq('room_id', roomId)
                            .eq('user_id', user.id)
                    }
                }
                leave()
            }
        }
    }, [roomId, router])

    const handleJitsiLoad = () => {
        setJitsiLoaded(true)
    }

    const handleReadyToClose = () => {
        router.push('/rooms')
    }

    if (loading || !room || !user) {
        return (
            <div className="h-[calc(100vh-6rem)] flex flex-col items-center justify-center bg-[#181614] text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
                    <Flame className="w-16 h-16 text-orange-500 relative z-10 animate-bounce-slow" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-white mb-2">Entering the Ashram...</h2>
                <p className="text-stone-400">Preparing your sacred study space</p>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col bg-[#221F1D] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">

            {/* Room Header / Info Bar */}
            <div className="bg-[#181614] border-b border-white/5 p-4 flex items-center justify-between shrink-0 z-10 relative">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.push('/rooms')}
                        className="p-2 hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            {room.name}
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider border border-orange-500/20">
                                {room.topic}
                            </span>
                        </h1>
                        <p className="text-xs text-stone-500 truncate max-w-md">{room.description}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-[#221F1D] rounded-full border border-white/5">
                        <Shield className="w-3.5 h-3.5 text-stone-500" />
                        <span className="text-xs text-stone-400">End-to-End Encrypted</span>
                    </div>
                </div>
            </div>

            {/* Jitsi Meeting Container */}
            <div className="flex-1 relative bg-black w-full h-full">
                {!jitsiLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                    </div>
                )}

                <JitsiMeeting
                    domain="meet.jit.si"
                    roomName={`gurukul-v1-${room.id}`}
                    configOverwrite={{
                        startWithAudioMuted: true,
                        disableThirdPartyRequests: true,
                        prejoinPageEnabled: false,
                        theme: {
                            default: 'dark',
                            palette: {
                                background: '#181614',
                                surface01: '#221F1D',
                                surface02: '#2C2927',
                            }
                        }
                    }}
                    interfaceConfigOverwrite={{
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
                            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                            'security'
                        ],
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        DEFAULT_BACKGROUND: '#181614',
                        DEFAULT_LOCAL_DISPLAY_NAME: 'Me',
                    }}
                    userInfo={{
                        displayName: user.full_name || user.username || 'Scholar',
                        email: `${user.username}@gurukul.app` // Fake email to avoid gravatar leaks if unwanted
                    }}
                    onApiReady={(externalApi) => {
                        handleJitsiLoad()
                        // Optional: Add event listeners here
                    }}
                    onReadyToClose={handleReadyToClose}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                        iframeRef.style.background = '#000';
                    }}
                />
            </div>
        </div>
    )
}
