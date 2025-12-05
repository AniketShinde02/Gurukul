'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/client'
import { RoomSidebar } from '@/components/sangha/RoomSidebar'
import { Video, Menu, Users, Check, X } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

// Dynamic imports for heavy components (Next.js way)
const RoomChatArea = dynamic(() => import('@/components/sangha/RoomChatArea').then(mod => mod.RoomChatArea), {
    loading: () => <LoadingSpinner />,
    ssr: false
})

const RoomInfoSidebar = dynamic(() => import('@/components/sangha/RoomInfoSidebar').then(mod => mod.RoomInfoSidebar), {
    loading: () => <div className="w-60 bg-stone-950/40 animate-pulse" />,
    ssr: false
})

const VideoRoom = dynamic(() => import('@/components/sangha/VideoRoom').then(mod => mod.VideoRoom), {
    loading: () => <LoadingSpinner />,
    ssr: false
})

const Whiteboard = dynamic(() => import('@/components/sangha/Whiteboard').then(mod => mod.Whiteboard), {
    loading: () => <LoadingSpinner />,
    ssr: false
})

// Loading fallback
function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )
}

export default function RoomPage() {
    const params = useParams()
    const roomId = params.roomId as string
    const [room, setRoom] = useState<any>(null)
    const [activeChannel, setActiveChannel] = useState<'text' | 'voice' | 'canvas' | 'video' | 'image'>('text')
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<{ id: string, username: string } | null>(null)
    const [isJoinedVideo, setIsJoinedVideo] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const [showJoinScreen, setShowJoinScreen] = useState(false)
    const [memberCount, setMemberCount] = useState(0)
    const router = useRouter()

    useEffect(() => {
        const fetchRoomAndUser = async () => {
            try {
                // Parallel queries for faster loading
                const [roomResult, userResult, countResult] = await Promise.all([
                    supabase.from('study_rooms').select('*').eq('id', roomId).single(),
                    supabase.auth.getUser(),
                    supabase.from('room_participants').select('*', { count: 'exact', head: true }).eq('room_id', roomId)
                ])

                if (roomResult.data) {
                    setRoom(roomResult.data)
                }

                if (countResult.count !== null) {
                    setMemberCount(countResult.count)
                }

                if (userResult.data.user) {
                    const user = userResult.data.user

                    // Parallel queries for profile and participant
                    const [profileResult, participantResult] = await Promise.all([
                        supabase.from('users').select('username').eq('id', user.id).single(),
                        supabase.from('room_participants').select('*').eq('room_id', roomId).eq('user_id', user.id).single()
                    ])

                    setCurrentUser({
                        id: user.id,
                        username: profileResult.data?.username || user.email?.split('@')[0] || 'User'
                    })

                    // If NOT a participant, show join screen
                    if (!participantResult.data) {
                        setShowJoinScreen(true)
                    }
                }
            } catch (error) {
                console.error('Error loading room:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchRoomAndUser()
    }, [roomId])

    // Memoized callbacks to prevent re-renders
    const handleChannelSelect = useCallback((channel: 'text' | 'voice' | 'canvas' | 'video' | 'image') => {
        setActiveChannel(channel)
    }, [])

    const handleVideoLeave = useCallback(() => {
        setIsJoinedVideo(false)
    }, [])

    const handleToggleChat = useCallback(() => {
        setShowChat(prev => !prev)
    }, [])

    const handleJoinVideo = useCallback(() => {
        setIsJoinedVideo(true)
    }, [])

    const handleAcceptInvite = async () => {
        if (!currentUser || !room) return

        try {
            const { error } = await supabase.from('room_participants').insert({
                room_id: roomId,
                user_id: currentUser.id
            })

            if (error) throw error

            // Reload to refresh state and sidebar
            window.location.reload()
        } catch (error) {
            console.error('Error joining room:', error)
        }
    }

    const handleRejectInvite = () => {
        router.push('/sangha')
    }

    // Memoized room name to prevent unnecessary re-renders
    const roomName = useMemo(() => room?.name || '', [room?.name])

    if (loading) {
        return (
            <div className="flex-1 bg-transparent flex items-center justify-center text-stone-500">
                <LoadingSpinner />
            </div>
        )
    }

    if (!room) {
        return (
            <div className="flex-1 bg-transparent flex items-center justify-center text-stone-500">
                Room not found
            </div>
        )
    }

    if (showJoinScreen) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#313338] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>

                {/* Floating Elements Animation */}
                <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 left-20 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 right-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#2B2D31] p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 relative z-10 text-center border border-white/5"
                >
                    {room.banner_url && (
                        <div className="h-32 w-full rounded-t-lg absolute top-0 left-0 overflow-hidden opacity-50">
                            <img src={room.banner_url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2B2D31]" />
                        </div>
                    )}

                    <div className="relative mt-8 mb-6">
                        <div className="w-24 h-24 mx-auto rounded-[30px] bg-stone-800 border-4 border-[#2B2D31] shadow-xl overflow-hidden flex items-center justify-center group">
                            {room.icon_url ? (
                                <img src={room.icon_url} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-stone-500">{room.name.substring(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                        {/* Online Indicator */}
                        <div className="absolute bottom-0 right-[calc(50%-40px)] w-6 h-6 bg-green-500 border-4 border-[#2B2D31] rounded-full" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{room.name}</h2>

                    <div className="flex items-center justify-center gap-6 text-stone-400 text-sm mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>{Math.max(1, Math.floor(memberCount * 0.3))} Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-stone-600 rounded-full" />
                            <span>{memberCount} Members</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleAcceptInvite}
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded transition-colors flex items-center justify-center gap-2"
                        >
                            Accept Invite
                        </button>
                        <button
                            onClick={handleRejectInvite}
                            className="w-full py-3 bg-transparent hover:underline text-stone-400 text-sm font-medium transition-colors"
                        >
                            No Thanks
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-stone-900 border-b border-white/5 flex items-center px-4 shrink-0 justify-between">
                <div className="flex items-center gap-3">
                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="text-stone-400 hover:text-white">
                                <Menu className="w-6 h-6" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r border-white/10 bg-black w-[85vw] max-w-[320px]">
                            {/* Mobile Sidebar Content */}
                            <div className="h-full flex">
                                {/* We could add simplified Server Rail here if we had data, 
                                    but for now let's just show channels + Home link */}
                                <RoomSidebar
                                    roomId={roomId}
                                    roomName={roomName}
                                    onSelectChannel={(c) => {
                                        handleChannelSelect(c)
                                        // Auto-close sheet? Simple click outside or we can pass a close handler
                                    }}
                                    currentUser={currentUser}
                                    isMobile={true}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <span className="font-bold text-white truncate">{roomName}</span>
                </div>
            </div>

            {/* Desktop Sidebar: Room Channels */}
            <div className="hidden md:flex h-full">
                <RoomSidebar
                    roomId={roomId}
                    roomName={roomName}
                    onSelectChannel={handleChannelSelect}
                    currentUser={currentUser}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {(activeChannel === 'text' || activeChannel === 'image') && (
                    <RoomChatArea roomId={roomId} roomName={roomName} />
                )}

                {(activeChannel === 'voice' || activeChannel === 'video') && (
                    <div className="flex-1 flex h-full overflow-hidden">
                        <div className="flex-1 relative flex flex-col min-w-0">
                            {!isJoinedVideo ? (
                                <VoiceLounge onJoin={handleJoinVideo} />
                            ) : (
                                <VideoRoom
                                    roomName={roomName}
                                    username={currentUser?.username || 'Guest'}
                                    onLeave={handleVideoLeave}
                                    onToggleChat={handleToggleChat}
                                />
                            )}
                        </div>

                        {/* Chat Sidebar Overlay/Panel */}
                        {showChat && (
                            <div className="w-80 border-l border-white/5 bg-stone-950/90 backdrop-blur-md flex flex-col transition-all duration-300 absolute md:relative right-0 h-full z-20 shadow-2xl">
                                <RoomChatArea roomId={roomId} roomName={roomName} isSidebar={true} />
                            </div>
                        )}
                    </div>
                )}

                {activeChannel === 'canvas' && (
                    <div className="absolute inset-0 z-0">
                        <Whiteboard roomId={roomId} currentUser={currentUser} />
                    </div>
                )}
            </div>

            {/* Right Sidebar: Info Panel */}
            <div className="hidden xl:block h-full z-10 relative">
                <RoomInfoSidebar roomId={roomId} />
            </div>
        </div>
    )
}

// Memoized Voice Lounge component
const VoiceLounge = memo(({ onJoin }: { onJoin: () => void }) => (
    <div className="flex-1 bg-stone-950/30 backdrop-blur-sm flex flex-col items-center justify-center text-stone-400">
        <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-lg">
            <Video className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-serif">Voice & Video Lounge</h2>
        <p className="max-w-md text-center text-stone-400">
            This is where the magic happens. Join the voice channel to study together with video or audio.
        </p>
        <button
            onClick={onJoin}
            className="mt-8 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-all shadow-lg shadow-green-900/20"
        >
            Join Voice Channel
        </button>
    </div>
))

VoiceLounge.displayName = 'VoiceLounge'
