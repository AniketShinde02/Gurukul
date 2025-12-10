'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Home, Plus, Compass, MessageCircle, Bell, VolumeX, Shield, Copy, User, LogOut, Settings, ChevronRight, LayoutDashboard, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CreateServerModal } from '@/components/sangha/CreateServerModal'
import { ServerSettingsModal } from '@/components/sangha/ServerSettingsModal'
import { UnifiedCreationModal, CreationMode } from '@/components/sangha/UnifiedCreationModal'
import { GlobalCallManager } from '@/components/sangha/GlobalCallManager'
import { toast } from 'react-hot-toast'

export default function SanghaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [rooms, setRooms] = useState<any[]>([])
    const [username, setUsername] = useState('Guest')
    const [userId, setUserId] = useState<string | null>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, roomId: string } | null>(null)
    const [leavingServerId, setLeavingServerId] = useState<string | null>(null)
    const [deletingServerId, setDeletingServerId] = useState<string | null>(null)
    const [creationModalOpen, setCreationModalOpen] = useState(false)
    const [creationMode, setCreationMode] = useState<CreationMode>('channel')
    const [creationRoomId, setCreationRoomId] = useState<string | null>(null)

    const handleContextMenu = (e: React.MouseEvent, roomId: string) => {
        e.preventDefault()
        e.stopPropagation()

        // Calculate dynamic height based on role
        const room = rooms.find(r => r.id === roomId)
        const isOwner = room?.created_by === userId
        const isAdmin = isOwner || userRoles[roomId] === 'Administrator'

        // Admin menu is ~560px, Regular is ~380px
        const menuHeight = isAdmin ? 560 : 380
        const windowHeight = window.innerHeight

        let y = e.clientY

        // If fits below, keep it. If not, check if it fits above.
        // If it goes off the bottom, position it upwards from bottom margin
        if (y + menuHeight > windowHeight) {
            y = windowHeight - menuHeight - 10
        }

        // Check if shifting up made it go off the top, and clamp it
        if (y < 10) {
            y = 10
        }

        setContextMenu({ x: e.clientX, y, roomId })
    }
    useEffect(() => {
        const closeMenu = () => setContextMenu(null)
        window.addEventListener('click', closeMenu)
        return () => window.removeEventListener('click', closeMenu)
    }, [])

    const executeLeaveServer = async (roomId: string) => {
        if (!userId) return

        // Check if it's the demo server
        if (roomId === 'demo-server') {
            setRooms(prev => prev.filter(r => r.id !== roomId))
            if (pathname?.includes(roomId)) {
                router.push('/sangha')
            }
            setLeavingServerId(null)
            return
        }

        const { error } = await supabase
            .from('room_participants')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', userId)

        if (error) {
            console.error('Failed to leave server', error)
            toast.error('Failed to leave server')
        } else {
            setRooms(prev => prev.filter(r => r.id !== roomId)) // Update state immediately
            if (pathname?.includes(roomId)) {
                router.push('/sangha')
            }
            toast.success('Left server')
            setLeavingServerId(null)
        }
    }

    const executeDeleteServer = async (roomId: string) => {
        if (!userId) return

        // Check if it's the demo server
        if (roomId === 'demo-server') {
            setRooms(prev => prev.filter(r => r.id !== roomId))
            if (pathname?.includes(roomId)) {
                router.push('/sangha')
            }
            setDeletingServerId(null)
            return
        }

        const { error } = await supabase
            .from('study_rooms')
            .delete()
            .eq('id', roomId)

        if (error) {
            console.error('Failed to delete server', error)
            toast.error('Failed to delete server')
        } else {
            setRooms(prev => prev.filter(r => r.id !== roomId)) // Update state immediately
            if (pathname?.includes(roomId)) {
                router.push('/sangha')
            }
            toast.success('Server deleted')
            setDeletingServerId(null)
        }
    }

    const [serverSettingsId, setServerSettingsId] = useState<string | null>(null)
    const [userRoles, setUserRoles] = useState<Record<string, string>>({}) // roomId -> roleName

    // ... (existing fetchUser)

    const fetchRooms = useCallback(async () => {
        const { data: roomsData } = await supabase
            .from('study_rooms')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })

        let finalRooms = roomsData || []

        if (finalRooms.length === 0) {
            finalRooms.push({
                id: 'demo-server',
                name: 'Demo Server',
                is_demo: true,
                created_by: 'system', // prevent admin actions unless we want to allow delete
            })
        }

        setRooms(finalRooms)

        if (finalRooms.length > 0) {
            // Fetch roles for these rooms
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)

                // Fetch roles for all rooms the user is in
                // Only for real rooms
                const realRoomIds = finalRooms.filter((r: any) => r.id !== 'demo-server').map((r: any) => r.id)

                if (realRoomIds.length > 0) {
                    const { data: participantData } = await supabase
                        .from('room_participants')
                        .select(`
                           room_id,
                           role:room_roles(name, permissions)
                       `)
                        .eq('user_id', user.id)
                        .in('room_id', realRoomIds)

                    if (participantData) {
                        const rolesMap: Record<string, string> = {}
                        participantData.forEach((p: any) => {
                            if (p.role) {
                                rolesMap[p.room_id] = p.role.name
                            }
                        })
                        setUserRoles(rolesMap)
                    }
                }
            }
        }
    }, [])

    useEffect(() => {
        fetchRooms()
    }, [fetchRooms])

    // Realtime subscription for server rail updates
    useEffect(() => {
        const channel = supabase
            .channel('study_rooms_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'study_rooms' },
                (payload) => {
                    console.log('Room change detected:', payload.eventType)

                    if (payload.eventType === 'INSERT') {
                        // Add new room to list
                        setRooms(prev => {
                            // Check if already exists (avoid duplicates)
                            if (prev.some(r => r.id === payload.new.id)) return prev
                            return [...prev, payload.new]
                        })
                    } else if (payload.eventType === 'UPDATE') {
                        // Update existing room
                        setRooms(prev => prev.map(r =>
                            r.id === payload.new.id ? { ...r, ...payload.new } : r
                        ))
                    } else if (payload.eventType === 'DELETE') {
                        // Remove deleted room
                        setRooms(prev => prev.filter(r => r.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleInvite = (roomId: string) => {
        const link = `${window.location.protocol}//${window.location.host}/invite/${roomId}`
        navigator.clipboard.writeText(link)
        toast.success('Invite link copied!')
        setContextMenu(null)
    }

    const handleMarkAsRead = (roomId: string) => {
        toast.success('Marked as read')
        setContextMenu(null)
    }

    const handleMute = (roomId: string) => {
        toast.success('Server muted')
        setContextMenu(null)
    }

    const isAdmin = (roomId: string) => {
        if (roomId === 'demo-server') return true // Allow full control for demo
        const room = rooms.find(r => r.id === roomId)
        const isOwner = room?.created_by === userId
        return isOwner || userRoles[roomId] === 'Administrator'
    }

    return (
        <GlobalCallManager username={username}>
            <div className="flex h-screen bg-[var(--bg-root)] bg-vedic-pattern text-stone-200 font-sans selection:bg-orange-500/30">
                {/* 1. Server Rail */}
                <div className="hidden md:flex w-[72px] flex-col items-center py-3 gap-2 bg-[#1C1917]/90 backdrop-blur-xl border-r border-orange-900/20 z-50">
                    {/* Main Dashboard Button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard">
                                    <div className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-stone-800 text-stone-400 hover:bg-sky-600 hover:text-white transition-all duration-200 flex items-center justify-center group relative">
                                        <LayoutDashboard className="w-5 h-5" />
                                    </div>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-stone-900 border-white/10 text-white">
                                <p>Main Dashboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="w-8 h-[2px] bg-stone-800 rounded-full mx-auto" />

                    {/* Home Button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/sangha">
                                    <div className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center group relative ${pathname === '/sangha' ? 'bg-indigo-500 text-white rounded-[16px]' : 'bg-stone-800 text-stone-400 hover:bg-indigo-500 hover:text-white'}`}>
                                        <Home className="w-5 h-5" />
                                        {pathname === '/sangha' && (
                                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
                                        )}
                                    </div>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-stone-900 border-white/10 text-white">
                                <p>Home</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="w-8 h-[2px] bg-stone-800 rounded-full mx-auto" />

                    {/* Server List - Scrollable Area */}
                    <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar min-h-0 pb-2">
                        {rooms.map((room) => (
                            <TooltipProvider key={room.id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative group">
                                            {pathname?.includes(room.id) && (
                                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
                                            )}
                                            <Link
                                                href={`/sangha/rooms/${room.id}`}
                                                onContextMenu={(e) => handleContextMenu(e, room.id)}
                                            >
                                                <div className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden ${pathname?.includes(room.id) ? 'rounded-[16px] ring-2 ring-offset-2 ring-offset-stone-900 ring-indigo-500' : 'bg-stone-800 hover:bg-indigo-500'}`}>
                                                    {room.icon_url ? (
                                                        <img
                                                            src={room.icon_url}
                                                            alt={room.name}
                                                            className="w-full h-full object-cover select-none pointer-events-none"
                                                            draggable={false}
                                                            onContextMenu={(e) => e.preventDefault()}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-stone-400 group-hover:text-white font-bold text-sm">
                                                            {room.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-stone-900 border-white/10 text-white">
                                        <p>{room.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}

                        {/* Custom Context Menu */}
                        {contextMenu && (
                            <div
                                className="fixed z-50 w-56 rounded-md border border-white/10 bg-stone-900 p-1 text-stone-200 shadow-md animate-in fade-in-80 max-h-[85vh] overflow-y-auto no-scrollbar"
                                style={{ top: contextMenu.y, left: contextMenu.x }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div onClick={() => handleMarkAsRead(contextMenu.roomId)} className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2">
                                    Mark as Read
                                </div>
                                <div className="h-px bg-white/10 my-1" />
                                <div onClick={() => handleInvite(contextMenu.roomId)} className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2 text-indigo-400">
                                    Invite to Server
                                </div>
                                <div className="h-px bg-white/10 my-1" />
                                <div onClick={() => handleMute(contextMenu.roomId)} className="flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2">
                                    Mute Server <ChevronRight className="w-4 h-4" />
                                </div>
                                <div className="flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2">
                                    Notification Settings <ChevronRight className="w-4 h-4" />
                                </div>
                                <div className="flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2">
                                    Hide Muted Channels
                                </div>
                                <div className="h-px bg-white/10 my-1" />

                                {isAdmin(contextMenu.roomId) && (
                                    <>
                                        <div onClick={() => {
                                            setServerSettingsId(contextMenu.roomId)
                                            setContextMenu(null)
                                        }} className="flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2">
                                            Server Settings <Settings className="w-4 h-4" />
                                        </div>
                                    </>
                                )}

                                <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2">
                                    Privacy Settings
                                </div>
                                <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2">
                                    Edit Per-server Profile
                                </div>
                                <div className="h-px bg-white/10 my-1" />

                                {isAdmin(contextMenu.roomId) ? (
                                    <>
                                        <div
                                            className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2"
                                            onClick={() => {
                                                setCreationRoomId(contextMenu.roomId)
                                                setCreationMode('channel')
                                                setCreationModalOpen(true)
                                                setContextMenu(null)
                                            }}
                                        >
                                            Create Channel
                                        </div>
                                        <div
                                            className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2"
                                            onClick={() => {
                                                setCreationRoomId(contextMenu.roomId)
                                                setCreationMode('category')
                                                setCreationModalOpen(true)
                                                setContextMenu(null)
                                            }}
                                        >
                                            Create Category
                                        </div>
                                        <div
                                            className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2"
                                            onClick={() => {
                                                setCreationRoomId(contextMenu.roomId)
                                                setCreationMode('event')
                                                setCreationModalOpen(true)
                                                setContextMenu(null)
                                            }}
                                        >
                                            Create Event
                                        </div>
                                        <div className="h-px bg-white/10 my-1" />
                                        <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 gap-2 text-red-400">
                                            Security Actions
                                        </div>
                                        <div
                                            className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-red-500/10 hover:text-red-400 gap-2 text-red-500 mt-1"
                                            onClick={() => {
                                                setDeletingServerId(contextMenu.roomId)
                                                setContextMenu(null)
                                            }}
                                        >
                                            Delete Server <Trash2 className="w-4 h-4 ml-auto" />
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-red-500/10 hover:text-red-400 text-red-400 gap-2"
                                        onClick={() => {
                                            setLeavingServerId(contextMenu.roomId)
                                            setContextMenu(null)
                                        }}
                                    >
                                        Leave Server <LogOut className="w-4 h-4 ml-auto" />
                                    </div>
                                )}

                                <div className="h-px bg-white/10 my-1" />
                                <div
                                    className="flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-white/10 hover:text-stone-50 text-stone-500 gap-2"
                                    onClick={() => {
                                        navigator.clipboard.writeText(contextMenu.roomId)
                                        setContextMenu(null)
                                    }}
                                >
                                    Copy Server ID <Copy className="w-3 h-3" />
                                </div>
                            </div>
                        )}

                        {/* Server Settings Modal */}
                        {serverSettingsId && (
                            <ServerSettingsModal
                                roomId={serverSettingsId}
                                isOpen={!!serverSettingsId}
                                onClose={() => setServerSettingsId(null)}
                                onDelete={() => {
                                    setServerSettingsId(null)
                                    setRooms(prev => prev.filter(r => r.id !== serverSettingsId))
                                    router.push('/sangha')
                                }}
                            />
                        )}

                        {/* Add Server */}
                        <TooltipProvider>
                            <Tooltip>
                                <CreateServerModal>
                                    <TooltipTrigger asChild>
                                        <button className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-stone-800/30 text-green-500 hover:bg-green-600 hover:text-white flex items-center justify-center transition-all duration-200 group border border-dashed border-stone-700 hover:border-transparent">
                                            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                                        </button>
                                    </TooltipTrigger>
                                </CreateServerModal>
                                <TooltipContent side="right" className="bg-stone-900 border-white/10 text-white">
                                    <p>Create a Room</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Explore */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/rooms"
                                        className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-stone-800/30 text-orange-500 hover:bg-orange-600 hover:text-white flex items-center justify-center transition-all duration-200 group border border-dashed border-stone-700 hover:border-transparent"
                                    >
                                        <Compass className="w-5 h-5" />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-stone-900 border-white/10 text-white">
                                    <p>Explore Servers</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* 2. Main Content Area */}
                <div className="flex-1 flex overflow-hidden bg-transparent">
                    {children}
                </div>
            </div>
            {/* Leave Server Confirmation */}
            <Dialog open={!!leavingServerId} onOpenChange={(open) => !open && setLeavingServerId(null)}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Leave Server</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Are you sure you want to leave this server?
                        </p>
                        {leavingServerId && (() => {
                            const room = rooms.find(r => r.id === leavingServerId)
                            return room ? (
                                <div className="flex items-center gap-3 mt-3 p-2 bg-stone-800/50 rounded-lg">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={room.icon_url || undefined} />
                                        <AvatarFallback>{room.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-bold text-white">{room.name}</span>
                                </div>
                            ) : null
                        })()}
                        <p className="text-xs text-stone-400 mt-3">You won't be able to see channels or messages unless you rejoin.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setLeavingServerId(null)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={() => leavingServerId && executeLeaveServer(leavingServerId)} className="bg-red-600 hover:bg-red-700 text-white">
                            Leave Server
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Server Confirmation */}
            <Dialog open={!!deletingServerId} onOpenChange={(open) => !open && setDeletingServerId(null)}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Delete Server</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Are you sure you want to <span className="font-bold text-red-400">DELETE</span> this server?
                        </p>
                        {deletingServerId && (() => {
                            const room = rooms.find(r => r.id === deletingServerId)
                            return room ? (
                                <div className="flex items-center gap-3 mt-3 p-2 bg-stone-800/50 rounded-lg">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={room.icon_url || undefined} />
                                        <AvatarFallback>{room.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-bold text-white">{room.name}</span>
                                </div>
                            ) : null
                        })()}
                        <p className="text-xs text-red-400 mt-3">⚠️ This action cannot be undone. All channels, messages, and data will be permanently deleted.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeletingServerId(null)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={() => deletingServerId && executeDeleteServer(deletingServerId)} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Server
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Creation Modal */}
            {creationRoomId && (
                <UnifiedCreationModal
                    isOpen={creationModalOpen}
                    onClose={() => setCreationModalOpen(false)}
                    roomId={creationRoomId}
                    categories={[]}
                    channelsCount={0}
                    categoriesCount={0}
                    canManage={true}
                    initialMode={creationMode}
                />
            )}
        </GlobalCallManager>
    )
}
