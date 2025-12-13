'use client'

import { useState, useEffect, useMemo, useCallback, memo, Suspense } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/client'
import { Video, Menu, Users } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

// Dynamic imports for heavy components - load only when needed
const RoomSidebar = dynamic(() => import('@/components/sangha/RoomSidebar').then(mod => mod.RoomSidebar), {
    loading: () => <SidebarSkeleton />,
    ssr: false
})

const RoomChatArea = dynamic(() => import('@/components/sangha/RoomChatArea').then(mod => mod.RoomChatArea), {
    loading: () => <ContentSkeleton />,
    ssr: false
})

const RoomInfoSidebar = dynamic(() => import('@/components/sangha/RoomInfoSidebar').then(mod => mod.RoomInfoSidebar), {
    loading: () => <div className="w-60 bg-stone-950/40 animate-pulse" />,
    ssr: false
})

const VideoRoom = dynamic(() => import('@/components/sangha/VideoRoom').then(mod => mod.VideoRoom), {
    loading: () => <ContentSkeleton />,
    ssr: false
})

const Whiteboard = dynamic(() => import('@/components/sangha/Whiteboard').then(mod => mod.Whiteboard), {
    loading: () => <ContentSkeleton />,
    ssr: false
})

// Lightweight skeleton components
function SidebarSkeleton() {
    return (
        <div className="w-60 bg-[#1C1917]/80 border-r border-orange-900/20 flex flex-col animate-pulse">
            <div className="h-14 border-b border-white/5 px-4 flex items-center">
                <div className="h-4 bg-stone-800 rounded w-32" />
            </div>
            <div className="flex-1 p-2 space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-stone-800/50 rounded-lg" />
                ))}
            </div>
        </div>
    )
}

function ContentSkeleton() {
    return (
        <div className="flex-1 flex items-center justify-center bg-transparent">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )
}

// Minimal room data type
type RoomBasic = {
    id: string
    name: string
    icon_url?: string
    banner_url?: string
    created_by?: string
}

export default function RoomPage() {
    const params = useParams()
    const roomId = params.roomId as string
    const router = useRouter()

    // Core state - minimal for fast initial render
    const [room, setRoom] = useState<RoomBasic | null>(null)
    const [activeChannel, setActiveChannel] = useState<'text' | 'voice' | 'canvas' | 'video' | 'image'>('text')
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<{ id: string, username: string } | null>(null)

    // Deferred state - loaded after initial render
    const [isJoinedVideo, setIsJoinedVideo] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const [showJoinScreen, setShowJoinScreen] = useState(false)
    const [memberCount, setMemberCount] = useState(0)
    const [selectedVoiceChannel, setSelectedVoiceChannel] = useState('General Lounge') // Default voice channel

    // Optimized initial load
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch Room, User, and Member Count in parallel
                const [roomResult, userAuth, countResult] = await Promise.all([
                    supabase.from('study_rooms').select('id, name, icon_url, banner_url, created_by').eq('id', roomId).single(),
                    supabase.auth.getUser(),
                    supabase.from('room_participants').select('*', { count: 'exact', head: true }).eq('room_id', roomId)
                ])

                if (roomResult.data) {
                    setRoom(roomResult.data)
                }

                if (countResult.count !== null) {
                    setMemberCount(countResult.count)
                }

                // 2. If user exists, fetch their specific data (Profile + Membership)
                if (userAuth.data.user && roomResult.data) {
                    const userId = userAuth.data.user.id
                    const createdBy = roomResult.data.created_by

                    const [profileResult, participantResult] = await Promise.all([
                        supabase.from('profiles').select('username').eq('id', userId).single(),
                        supabase.from('room_participants').select('user_id').eq('room_id', roomId).eq('user_id', userId).single()
                    ])

                    setCurrentUser({
                        id: userId,
                        username: profileResult.data?.username || userAuth.data.user.email?.split('@')[0] || 'User'
                    })

                    // Membership Logic
                    const isCreator = createdBy === userId
                    const isMember = !!participantResult.data

                    if (isCreator && !isMember) {
                        // Auto-join creator if missing
                        await supabase.from('room_participants').insert({ room_id: roomId, user_id: userId })
                        setMemberCount(prev => prev + 1)
                    } else if (!isCreator && !isMember) {
                        setShowJoinScreen(true)
                    }
                }
            } catch (error) {
                console.error('Error loading room data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [roomId])

    // Memoized callbacks
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
            await supabase.from('room_participants').insert({
                room_id: roomId,
                user_id: currentUser.id
            })
            setShowJoinScreen(false)
            setMemberCount(prev => prev + 1)
        } catch (error) {
            console.error('Error joining room:', error)
        }
    }

    const handleRejectInvite = () => {
        router.push('/sangha')
    }

    const roomName = useMemo(() => room?.name || '', [room?.name])

    // Fast loading state with skeleton
    if (loading) {
        return (
            <div className="flex-1 flex overflow-hidden">
                <SidebarSkeleton />
                <ContentSkeleton />
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
            <div className="flex-1 flex items-center justify-center bg-[var(--bg-root)] bg-vedic-pattern relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />

                <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 left-20 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 right-20 w-40 h-40 bg-orange-600/20 rounded-full blur-3xl"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#1C1917]/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative z-10 text-center border border-orange-900/20"
                >
                    <div className="relative mt-4 mb-6">
                        <div className="w-24 h-24 mx-auto rounded-2xl bg-stone-800 border-4 border-[#1C1917] shadow-xl overflow-hidden flex items-center justify-center">
                            {room.icon_url ? (
                                <img src={room.icon_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <span className="text-3xl font-bold text-orange-500">{room.name.substring(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 font-serif">{room.name}</h2>

                    <div className="flex items-center justify-center gap-6 text-stone-400 text-sm mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>{Math.max(1, Math.floor(memberCount * 0.3))} Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{memberCount} Members</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleAcceptInvite}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            Join Server
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
            <div className="md:hidden h-14 bg-[#1C1917]/90 border-b border-orange-900/20 flex items-center px-4 shrink-0 justify-between backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="text-stone-400 hover:text-white">
                                <Menu className="w-6 h-6" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r border-orange-900/20 bg-[#1C1917] w-[85vw] max-w-[320px]">
                            <div className="h-full flex">
                                <Suspense fallback={<SidebarSkeleton />}>
                                    <RoomSidebar
                                        roomId={roomId}
                                        roomName={roomName}
                                        onSelectChannel={handleChannelSelect}
                                        currentUser={currentUser}
                                        isMobile={true}
                                    />
                                </Suspense>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <span className="font-bold text-white truncate">{roomName}</span>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full">
                <Suspense fallback={<SidebarSkeleton />}>
                    <RoomSidebar
                        roomId={roomId}
                        roomName={roomName}
                        onSelectChannel={handleChannelSelect}
                        currentUser={currentUser}
                    />
                </Suspense>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                <Suspense fallback={<ContentSkeleton />}>
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
                                        roomName={`${roomId}-Study Lounge`}
                                        username={currentUser?.username || 'Guest'}
                                        onLeave={handleVideoLeave}
                                        onToggleChat={handleToggleChat}
                                    />
                                )}
                            </div>

                            {showChat && (
                                <div className="w-80 border-l border-orange-900/20 bg-[#1C1917]/90 backdrop-blur-md flex flex-col absolute md:relative right-0 h-full z-20 shadow-2xl">
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
                </Suspense>
            </div>

            {/* Right Sidebar */}
            <div className="hidden xl:block h-full z-10 relative">
                <Suspense fallback={<div className="w-60 bg-stone-950/40 animate-pulse h-full" />}>
                    <RoomInfoSidebar roomId={roomId} />
                </Suspense>
            </div>
        </div>
    )
}

// Memoized Voice Lounge
const VoiceLounge = memo(({ onJoin }: { onJoin: () => void }) => (
    <div className="flex-1 bg-transparent flex flex-col items-center justify-center text-stone-400">
        <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-6 border border-orange-900/20 shadow-lg">
            <Video className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-serif">Voice & Video Lounge</h2>
        <p className="max-w-md text-center text-stone-400">
            This is where the magic happens. Join the voice channel to study together.
        </p>
        <button
            onClick={onJoin}
            className="mt-8 px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full transition-all shadow-lg shadow-orange-900/20"
        >
            Join Voice Channel
        </button>
    </div>
))

VoiceLounge.displayName = 'VoiceLounge'
