'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { PomodoroTimer } from './PomodoroTimer'
import { LoFiPlayer } from './LoFiPlayer'
import { Hash, Volume2, Settings, ChevronDown, Presentation, Signal, PhoneOff, Mic, MicOff, Video, VideoOff, Sliders, Plus, Trash2, Edit2, Shield, Users, LogOut, Image as ImageIcon, MonitorPlay, Radio } from 'lucide-react'

// ... (existing imports)

// ... (inside component)


import Link from 'next/link'
import { UserProfilePopup } from './UserProfilePopup'
import { EventCard } from './EventCard'
import { useCall } from './GlobalCallManager'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Check, Copy, Bell, VolumeX } from 'lucide-react'

// ... RoomSidebar component start



// ...

type ChannelGroupProps = {
    title: string
    channels: Channel[]
    type: 'text' | 'voice' | 'canvas' | 'video' | 'image'
    activeChannel: string
    onSelect: (type: any) => void
    onSelectGlobal: (type: any) => void
    canManage: boolean
    onCreate: () => void
    onEdit: (id: string) => void
    onDelete: (id: string) => void
    onContextMenu: (e: React.MouseEvent, channelId: string) => void
    children?: React.ReactNode
}

function ChannelGroup({ title, channels, type, activeChannel, onSelect, onSelectGlobal, canManage, onCreate, onEdit, onDelete, onContextMenu, children }: ChannelGroupProps) {
    if (channels.length === 0 && !canManage && type !== 'text') return null

    return (
        <div>
            <div className="flex items-center justify-between px-2 mb-1 text-xs font-bold text-stone-500 uppercase hover:text-stone-400 cursor-pointer group tracking-wider">
                <div className="flex items-center gap-0.5">
                    <ChevronDown className="w-3 h-3" />
                    <span>{title}</span>
                </div>
                {canManage && (
                    <button onClick={onCreate} className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                        <Plus className="w-3 h-3" />
                    </button>
                )}
            </div>
            <div className="space-y-[2px]">
                {/* Render children if provided (for custom voice channel rendering) */}
                {children ? children : (
                    <>
                        {channels.map((channel) => (
                            <ChannelItem
                                key={channel.id}
                                id={channel.id}
                                name={channel.name}
                                type={type}
                                active={activeChannel === type && false}
                                onClick={() => { onSelect(type); onSelectGlobal(type) }}
                                onEdit={canManage ? () => onEdit(channel.id) : undefined}
                                onDelete={canManage ? () => onDelete(channel.id) : undefined}
                                onContextMenu={(e) => onContextMenu(e, channel.id)}
                            />
                        ))}
                        {channels.length === 0 && <div className="px-2 text-[10px] text-stone-600 italic">No channels</div>}
                    </>
                )}
            </div>
        </div>
    )
}

function ChannelItem({ id, name, type, active, onClick, onEdit, onDelete, onContextMenu }: { id: string, name: string, type: 'text' | 'voice' | 'canvas' | 'video' | 'image', active: boolean, onClick: () => void, onEdit?: () => void, onDelete?: () => void, onContextMenu: (e: React.MouseEvent) => void }) {
    return (
        <div className="group relative flex items-center" onContextMenu={onContextMenu}>
            <button
                onClick={onClick}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${active
                    ? 'bg-stone-800 text-white shadow-sm border border-white/5'
                    : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
                    }`}
            >
                {type === 'text' && <Hash className="w-4 h-4 text-stone-500" />}
                {type === 'voice' && <Volume2 className="w-4 h-4 text-stone-500" />}
                {type === 'video' && <MonitorPlay className="w-4 h-4 text-stone-500" />}
                {type === 'canvas' && <Presentation className="w-4 h-4 text-stone-500" />}
                {type === 'image' && <ImageIcon className="w-4 h-4 text-stone-500" />}
                <span className={`font-medium truncate text-sm ${active ? 'text-white' : ''}`}>{name}</span>
            </button>
            {onEdit && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit() }}
                    className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-white transition-all"
                >
                    <Settings className="w-3 h-3" />
                </button>
            )}
        </div>
    )
}
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { ServerSettingsModal } from './ServerSettingsModal'
import { ChannelSettingsModal } from './ChannelSettingsModal'
import { UnifiedCreationModal } from './UnifiedCreationModal'
import { useServerPermissions } from '@/hooks/useServerPermissions'

type Channel = {
    id: string
    name: string
    type: 'text' | 'voice' | 'canvas' | 'video' | 'image'
    position: number
    category_id?: string | null
    description?: string | null
    is_private?: boolean
}

type Category = {
    id: string
    name: string
    position: number
}

type RoomEvent = {
    id: string
    name: string
    description?: string | null
    start_time: string
    end_time?: string | null
    channel_id?: string | null
    status?: 'upcoming' | 'active' | 'past'
    participant_count?: number
}

// Participant Item with Timer (Discord-style)
function ParticipantItem({ participant }: { participant: { sid: string, identity: string } }) {
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        // Start timer when participant mounts
        const interval = setInterval(() => {
            setDuration(d => d + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        if (mins === 0) return `${secs}s`
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors group">
            <Avatar className="w-5 h-5 border border-white/10">
                <AvatarFallback className="bg-stone-700 text-white text-[10px] font-bold">
                    {participant.identity[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-stone-300 group-hover:text-white truncate transition-colors">
                    {participant.identity}
                </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Timer (Discord-style) */}
                <span className="text-[10px] text-stone-500 font-mono">
                    {formatDuration(duration)}
                </span>
                {/* Green dot */}
                <div className="w-2 h-2 rounded-full bg-green-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    )
}

export function RoomSidebar({ roomId, roomName, onSelectChannel, currentUser, isMobile = false }: { roomId: string, roomName: string, onSelectChannel: (type: 'text' | 'voice' | 'canvas' | 'video' | 'image') => void, currentUser?: any, isMobile?: boolean }) {
    const [activeChannel, setActiveChannel] = useState<'text' | 'voice' | 'canvas' | 'video' | 'image'>('text')
    const [showProfilePopup, setShowProfilePopup] = useState(false)
    const [showQuickSettings, setShowQuickSettings] = useState(false)
    const [showServerSettings, setShowServerSettings] = useState(false)
    const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
    const [duration, setDuration] = useState(0)
    // Store participants per channel: { channelName: participants[] }
    const [channelParticipants, setChannelParticipants] = useState<Record<string, { sid: string, identity: string }[]>>({})
    const [channels, setChannels] = useState<Channel[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [events, setEvents] = useState<RoomEvent[]>([])
    const [isCreatingChannel, setIsCreatingChannel] = useState(false)
    const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null)
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
    const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
    const [showPastEvents, setShowPastEvents] = useState(false)
    const [creationMode, setCreationMode] = useState<'channel' | 'category' | 'event'>('channel')
    const [newChannelName, setNewChannelName] = useState('')
    const [newChannelType, setNewChannelType] = useState<'text' | 'voice' | 'canvas' | 'video' | 'image'>('text')
    const [newChannelCategory, setNewChannelCategory] = useState<string>('')
    const [newChannelDescription, setNewChannelDescription] = useState('')
    const [newChannelPrivate, setNewChannelPrivate] = useState(false)
    // Category fields
    const [newCategoryName, setNewCategoryName] = useState('')
    // Event fields
    const [newEventName, setNewEventName] = useState('')
    const [newEventDescription, setNewEventDescription] = useState('')
    const [newEventStartTime, setNewEventStartTime] = useState('')
    const [newEventEndTime, setNewEventEndTime] = useState('')

    const quickSettingsRef = useRef<HTMLDivElement>(null)
    const userControlsRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const { state, roomName: activeCallRoom, leaveRoom, joinRoom } = useCall()
    const isConnected = state === 'connected'

    const { can, loading: permissionsLoading } = useServerPermissions(roomId, currentUser?.id)

    // Computed channel filters (must be before useEffects that use them)
    const textChannels = channels.filter(c => c.type === 'text')
    const voiceChannels = channels.filter(c => c.type === 'voice')
    const videoChannels = channels.filter(c => c.type === 'video')
    const canvasChannels = channels.filter(c => c.type === 'canvas')
    const imageChannels = channels.filter(c => c.type === 'image')

    // Fetch functions defined with useCallback so they can be called from modal
    const fetchChannels = useCallback(async () => {
        const { data } = await supabase
            .from('room_channels')
            .select('*')
            .eq('room_id', roomId)
            .order('position', { ascending: true })
            .order('created_at', { ascending: true })

        if (data) setChannels(data as Channel[])
    }, [roomId])

    const fetchCategories = useCallback(async () => {
        const { data } = await supabase
            .from('room_categories')
            .select('*')
            .eq('room_id', roomId)
            .order('position', { ascending: true })

        if (data) setCategories(data as Category[])
    }, [roomId])

    const fetchEvents = useCallback(async () => {
        // Fetch all events (not just upcoming)
        const { data: eventsData } = await supabase
            .from('room_events')
            .select('*')
            .eq('room_id', roomId)
            .order('start_time', { ascending: true })

        if (!eventsData) return

        // Fetch participant counts for each event
        const eventsWithStatus: RoomEvent[] = await Promise.all(
            eventsData.map(async (event) => {
                // Get participant count
                const { count } = await supabase
                    .from('room_event_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id)
                    .is('left_at', null)

                // Compute status based on time
                const now = new Date()
                const startTime = new Date(event.start_time)
                const endTime = event.end_time ? new Date(event.end_time) : null

                let status: 'upcoming' | 'active' | 'past'
                if (startTime > now) {
                    status = 'upcoming'
                } else if (!endTime || endTime > now) {
                    status = 'active'
                } else {
                    status = 'past'
                }

                return {
                    ...event,
                    status,
                    participant_count: count || 0
                }
            })
        )

        setEvents(eventsWithStatus)
    }, [roomId])

    const refetchAll = useCallback(() => {
        fetchChannels()
        fetchCategories()
        fetchEvents()
    }, [fetchChannels, fetchCategories, fetchEvents])

    // Fetch Channels, Categories and Events
    useEffect(() => {
        fetchChannels()
        fetchCategories()
        fetchEvents()

        // Realtime subscriptions
        const channelSub = supabase
            .channel(`room_channels:${roomId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_channels', filter: `room_id=eq.${roomId}` }, () => {
                fetchChannels()
            })
            .subscribe()

        const categorySub = supabase
            .channel(`room_categories:${roomId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_categories', filter: `room_id=eq.${roomId}` }, () => {
                fetchCategories()
            })
            .subscribe()

        const eventSub = supabase
            .channel(`room_events:${roomId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_events', filter: `room_id=eq.${roomId}` }, () => {
                fetchEvents()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channelSub)
            supabase.removeChannel(categorySub)
            supabase.removeChannel(eventSub)
        }
    }, [roomId, fetchChannels, fetchCategories, fetchEvents])

    // Dynamic Multi-Channel Participant System (Discord-style)
    useEffect(() => {
        if (voiceChannels.length === 0) return

        // Fetch participants for a SPECIFIC channel (called on-demand)
        const fetchChannelParticipants = async (channelName: string) => {
            const livekitRoom = `${roomId}-${channelName}`
            try {
                const res = await fetch(`/api/livekit/participants?room=${encodeURIComponent(livekitRoom)}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    const uniqueParticipants = Array.from(
                        new Map(data.map((p: { sid: string, identity: string }) => [p.identity, p])).values()
                    )
                    setChannelParticipants(prev => ({
                        ...prev,
                        [channelName]: uniqueParticipants
                    }))
                }
            } catch (e) {
                setChannelParticipants(prev => ({
                    ...prev,
                    [channelName]: []
                }))
            }
        }

        // NO initial fetch - wait for users to actually join

        // WebSocket: Subscribe to ALL voice channels
        const WS_URL = process.env.NEXT_PUBLIC_MATCHMAKING_WS_URL || 'ws://localhost:8080'
        let ws: WebSocket | null = null
        let reconnectTimeout: NodeJS.Timeout

        const connect = () => {
            try {
                ws = new WebSocket(WS_URL)

                ws.onopen = () => {
                    voiceChannels.forEach((channel) => {
                        const livekitRoom = `${roomId}-${channel.name}`
                        ws?.send(JSON.stringify({
                            type: 'subscribe_room',
                            data: { roomId: livekitRoom }
                        }))
                    })
                }

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data)
                        if (message.type === 'participants_update' && message.roomName) {
                            const channelName = message.roomName.replace(`${roomId}-`, '')
                            fetchChannelParticipants(channelName)
                        }
                    } catch (e) { }
                }

                ws.onclose = () => {
                    reconnectTimeout = setTimeout(connect, 3000)
                }

                ws.onerror = () => {
                    ws?.close()
                }
            } catch (e) { }
        }

        connect()

        return () => {
            clearTimeout(reconnectTimeout)
            if (ws && ws.readyState === WebSocket.OPEN) {
                voiceChannels.forEach((channel) => {
                    const livekitRoom = `${roomId}-${channel.name}`
                    ws?.send(JSON.stringify({
                        type: 'unsubscribe_room',
                        data: { roomId: livekitRoom }
                    }))
                })
            }
            if (ws) {
                ws.close()
            }
        }
    }, [voiceChannels, roomId])

    // Immediate fetch when user joins a channel
    useEffect(() => {
        if (activeCallRoom) {
            // Extract channel name from activeCallRoom (format: roomId-ChannelName)
            const channelName = activeCallRoom.replace(`${roomId}-`, '')
            // Fetch immediately so user sees themselves
            const fetchNow = async () => {
                try {
                    const res = await fetch(`/api/livekit/participants?room=${encodeURIComponent(activeCallRoom)}`)
                    const data = await res.json()
                    if (Array.isArray(data)) {
                        setChannelParticipants(prev => ({
                            ...prev,
                            [channelName]: data
                        }))
                    }
                } catch (e) { }
            }
            fetchNow()
        }
    }, [activeCallRoom, roomId])

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isConnected) {
            interval = setInterval(() => setDuration(d => d + 1), 1000)
        } else {
            setDuration(0)
        }
        return () => clearInterval(interval)
    }, [isConnected])

    // Close quick settings on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (quickSettingsRef.current && !quickSettingsRef.current.contains(event.target as Node)) {
                setShowQuickSettings(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, channelId: string } | null>(null)

    const handleContextMenu = (e: React.MouseEvent, channelId: string) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, channelId })
    }

    useEffect(() => {
        const closeMenu = () => setContextMenu(null)
        window.addEventListener('click', closeMenu)
        return () => window.removeEventListener('click', closeMenu)
    }, [])

    const handleCopyChannelId = (id: string) => {
        navigator.clipboard.writeText(id)
        toast.success('Channel ID copied')
    }

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return
        if (!can('manage_channels')) {
            toast.error('You do not have permission to create channels')
            return
        }

        const { error } = await supabase
            .from('room_channels')
            .insert({
                room_id: roomId,
                name: newChannelName,
                type: newChannelType,
                position: channels.length,
                category_id: newChannelCategory || null,
                description: newChannelDescription || null,
                is_private: newChannelPrivate
            })

        if (error) {
            console.error('Channel creation error:', error)
            toast.error(`Failed to create channel: ${error.message}`)
        } else {
            toast.success('Channel created')
            resetCreationForm()
        }
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return
        if (!can('manage_channels')) {
            toast.error('You do not have permission to create categories')
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase
            .from('room_categories')
            .insert({
                room_id: roomId,
                name: newCategoryName,
                position: categories.length,
                created_by: user?.id
            })

        if (error) {
            console.error('Category creation error:', error)
            toast.error(`Failed to create category: ${error.message}`)
        } else {
            toast.success('Category created')
            resetCreationForm()
        }
    }

    const handleCreateEvent = async () => {
        if (!newEventName.trim() || !newEventStartTime) {
            toast.error('Event name and start time are required')
            return
        }
        if (!can('manage_channels')) {
            toast.error('You do not have permission to create events')
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase
            .from('room_events')
            .insert({
                room_id: roomId,
                name: newEventName,
                description: newEventDescription || null,
                start_time: newEventStartTime,
                end_time: newEventEndTime || null,
                created_by: user?.id
            })

        if (error) {
            console.error('Event creation error:', error)
            toast.error(`Failed to create event: ${error.message}`)
        } else {
            toast.success('Event created')
            resetCreationForm()
        }
    }

    const handleSubmitCreation = () => {
        if (creationMode === 'channel') handleCreateChannel()
        else if (creationMode === 'category') handleCreateCategory()
        else if (creationMode === 'event') handleCreateEvent()
    }

    const resetCreationForm = () => {
        setIsCreatingChannel(false)
        setNewChannelName('')
        setNewChannelDescription('')
        setNewChannelCategory('')
        setNewChannelPrivate(false)
        setNewCategoryName('')
        setNewEventName('')
        setNewEventDescription('')
        setNewEventStartTime('')
        setNewEventEndTime('')
        setCreationMode('channel')
    }

    const handleDeleteChannel = async (channelId: string) => {
        if (!can('manage_channels')) {
            toast.error('You do not have permission to delete channels')
            return
        }

        const { error } = await supabase
            .from('room_channels')
            .delete()
            .eq('id', channelId)

        if (error) {
            console.error('Channel deletion error:', error)
            toast.error('Failed to delete channel')
        } else {
            toast.success('Channel deleted')
            setChannels(prev => prev.filter(c => c.id !== channelId))
            setDeletingChannelId(null)
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        if (!can('manage_channels')) {
            toast.error('You do not have permission to delete categories')
            return
        }

        const { error } = await supabase
            .from('room_categories')
            .delete()
            .eq('id', categoryId)

        if (error) {
            console.error('Category deletion error:', error)
            toast.error('Failed to delete category')
        } else {
            toast.success('Category deleted')
            setCategories(prev => prev.filter(c => c.id !== categoryId))
            setDeletingCategoryId(null)
        }
    }

    const handleDeleteEvent = async (eventId: string) => {
        if (!can('manage_channels')) {
            toast.error('You do not have permission to delete events')
            return
        }

        const { error } = await supabase
            .from('room_events')
            .delete()
            .eq('id', eventId)

        if (error) {
            console.error('Event deletion error:', error)
            toast.error('Failed to delete event')
        } else {
            toast.success('Event deleted')
            setEvents(prev => prev.filter(e => e.id !== eventId))
            setDeletingEventId(null)
        }
    }

    const handleJoinEvent = async (event: RoomEvent) => {
        if (!currentUser?.id) return

        // Add user to event participants
        const { error } = await supabase
            .from('room_event_participants')
            .upsert({
                event_id: event.id,
                user_id: currentUser.id,
                left_at: null
            }, {
                onConflict: 'event_id,user_id'
            })

        if (error) {
            console.error('Join event error:', error)
            toast.error('Failed to join event')
            return
        }

        // If event has a linked channel, open it
        if (event.channel_id) {
            const channel = channels.find(c => c.id === event.channel_id)
            if (channel) {
                setActiveChannel(channel.type)
                onSelectChannel(channel.type)
                toast.success(`Joined ${event.name}!`)
            }
        } else {
            toast.success('Marked as attending!')
        }

        // Refresh events to update participant count
        fetchEvents()
    }

    // (Moved these computed values earlier to fix TS scoping)

    // Filter events by status
    const activeEvents = events.filter(e => e.status === 'active')
    const upcomingEvents = events.filter(e => e.status === 'upcoming')
    const pastEvents = events.filter(e => e.status === 'past')

    return (
        <div className={cn(
            "bg-stone-950/40 backdrop-blur-md flex flex-col border-r border-white/5 h-full relative",
            isMobile ? "w-full" : "w-60"
        )}>
            {/* Room Header */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="h-12 px-4 flex items-center justify-between shadow-sm hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 shrink-0">
                        <h1 className="font-bold text-white truncate font-serif tracking-wide">{roomName}</h1>
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-stone-900 border-white/10 text-stone-200 ml-2">
                    <DropdownMenuLabel className="text-xs font-bold text-stone-500 uppercase tracking-wider">Server Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {(can('manage_server') || can('admin')) && (
                        <DropdownMenuItem onClick={() => setShowServerSettings(true)} className="cursor-pointer gap-2">
                            <Settings className="w-4 h-4" /> Server Settings
                        </DropdownMenuItem>
                    )}
                    {(can('manage_channels') || can('admin')) && (
                        <DropdownMenuItem onClick={() => setIsCreatingChannel(true)} className="cursor-pointer gap-2">
                            <Plus className="w-4 h-4" /> Create Channel
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="cursor-pointer gap-2">
                        <Shield className="w-4 h-4" /> Privacy Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10" onClick={() => router.push('/sangha')}>
                        <LogOut className="w-4 h-4" /> Leave Server
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Channels List - Scrollable without visible scrollbar */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
                {/* Text Channels */}
                <ChannelGroup
                    title="Text Channels"
                    channels={textChannels}
                    type="text"
                    activeChannel={activeChannel}
                    onSelect={setActiveChannel}
                    onSelectGlobal={onSelectChannel}
                    canManage={can('manage_channels')}
                    onCreate={() => { setIsCreatingChannel(true); setNewChannelType('text') }}
                    onEdit={setEditingChannelId}
                    onDelete={setDeletingChannelId}
                    onContextMenu={handleContextMenu}
                />

                {/* Voice Channels */}
                <ChannelGroup
                    title="Voice Channels"
                    channels={voiceChannels}
                    type="voice"
                    activeChannel={activeChannel}
                    onSelect={setActiveChannel}
                    onSelectGlobal={onSelectChannel}
                    canManage={can('manage_channels')}
                    onCreate={() => { setIsCreatingChannel(true); setNewChannelType('voice') }}
                    onEdit={setEditingChannelId}
                    onDelete={setDeletingChannelId}
                    onContextMenu={handleContextMenu}
                >
                    {/* Discord-style voice channels with nested participants */}
                    {voiceChannels.map((channel) => {
                        // Get participants for THIS specific channel
                        const channelParts = channelParticipants[channel.name] || []
                        const showParticipants = channelParts.length > 0

                        return (
                            <div key={channel.id}>
                                {/* Channel Button with Count */}
                                <ChannelItem
                                    id={channel.id}
                                    name={`${channel.name}${showParticipants ? ` (${channelParts.length})` : ''}`}
                                    type="voice"
                                    active={activeChannel === 'voice'}
                                    onClick={() => {
                                        setActiveChannel('voice');
                                        onSelectChannel('voice');
                                    }}
                                    onEdit={can('manage_channels') ? () => setEditingChannelId(channel.id) : undefined}
                                    onDelete={can('manage_channels') ? () => setDeletingChannelId(channel.id) : undefined}
                                    onContextMenu={(e) => handleContextMenu(e, channel.id)}
                                />

                                {/* Participants: Show for THIS channel only */}
                                {showParticipants && (
                                    <div className="ml-6 mt-1 space-y-0.5 pb-2">
                                        {channelParts.map((participant: { sid: string, identity: string }) => (
                                            <ParticipantItem
                                                key={participant.sid}
                                                participant={participant}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </ChannelGroup>

                {/* Video Channels */}
                <ChannelGroup
                    title="Video Rooms"
                    channels={videoChannels}
                    type="video"
                    activeChannel={activeChannel}
                    onSelect={setActiveChannel}
                    onSelectGlobal={onSelectChannel}
                    canManage={can('manage_channels')}
                    onCreate={() => { setIsCreatingChannel(true); setNewChannelType('video') }}
                    onEdit={setEditingChannelId}
                    onDelete={setDeletingChannelId}
                    onContextMenu={handleContextMenu}
                />

                {/* Collaboration */}
                <ChannelGroup
                    title="Collaboration"
                    channels={canvasChannels}
                    type="canvas"
                    activeChannel={activeChannel}
                    onSelect={setActiveChannel}
                    onSelectGlobal={onSelectChannel}
                    canManage={can('manage_channels')}
                    onCreate={() => { setIsCreatingChannel(true); setNewChannelType('canvas') }}
                    onEdit={setEditingChannelId}
                    onDelete={setDeletingChannelId}
                    onContextMenu={handleContextMenu}
                />

                {/* Image Channels */}
                <ChannelGroup
                    title="Image / Meme"
                    channels={imageChannels}
                    type="image"
                    activeChannel={activeChannel}
                    onSelect={setActiveChannel}
                    onSelectGlobal={onSelectChannel}
                    canManage={can('manage_channels')}
                    onCreate={() => { setIsCreatingChannel(true); setNewChannelType('image') }}
                    onEdit={setEditingChannelId}
                    onDelete={setDeletingChannelId}
                    onContextMenu={handleContextMenu}
                />

                {/* Categories with grouped channels */}
                {categories.map(category => {
                    const categoryChannels = channels.filter(c => c.category_id === category.id)
                    return (
                        <div key={category.id} className="space-y-1">
                            <div className="flex items-center justify-between px-2 text-xs font-bold text-stone-500 uppercase hover:text-stone-400 cursor-pointer group tracking-wider">
                                <div className="flex items-center gap-0.5">
                                    <ChevronDown className="w-3 h-3" />
                                    <span>{category.name}</span>
                                </div>
                                {can('manage_channels') && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setIsCreatingChannel(true)} className="hover:text-white">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => setDeletingCategoryId(category.id)} className="hover:text-red-400">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-[2px]">
                                {categoryChannels.length === 0 && (
                                    <div className="px-2 text-[10px] text-stone-600 italic">No channels</div>
                                )}
                                {categoryChannels.map(channel => (
                                    <ChannelItem
                                        key={channel.id}
                                        id={channel.id}
                                        name={channel.name}
                                        type={channel.type}
                                        active={false}
                                        onClick={() => { setActiveChannel(channel.type); onSelectChannel(channel.type) }}
                                        onEdit={can('manage_channels') ? () => setEditingChannelId(channel.id) : undefined}
                                        onDelete={can('manage_channels') ? () => setDeletingChannelId(channel.id) : undefined}
                                        onContextMenu={(e) => handleContextMenu(e, channel.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}

                {/* Active Events - Always at top with LIVE badge */}
                {activeEvents.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-2 text-xs font-bold text-red-500 uppercase tracking-wider animate-pulse">
                            <div className="flex items-center gap-1.5">
                                <Radio className="w-3 h-3" />
                                <span>Live Events</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {activeEvents.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    canManage={can('manage_channels')}
                                    onDelete={setDeletingEventId}
                                    onJoin={handleJoinEvent}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-2 text-xs font-bold text-orange-500 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                                <span>📅</span>
                                <span>Upcoming Events</span>
                            </div>
                            {can('manage_channels') && (
                                <button onClick={() => setIsCreatingChannel(true)} className="opacity-70 hover:opacity-100 hover:text-orange-400 transition-opacity">
                                    <Plus className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-1">
                            {upcomingEvents.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    canManage={can('manage_channels')}
                                    onDelete={setDeletingEventId}
                                    onJoin={handleJoinEvent}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Events - Collapsible */}
                {pastEvents.length > 0 && (
                    <div className="space-y-1">
                        <div
                            onClick={() => setShowPastEvents(!showPastEvents)}
                            className="flex items-center justify-between px-2 text-xs font-bold text-stone-600 uppercase tracking-wider cursor-pointer hover:text-stone-500 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                <ChevronDown className={`w-3 h-3 transition-transform ${showPastEvents ? '' : '-rotate-90'}`} />
                                <span>Past Events ({pastEvents.length})</span>
                            </div>
                        </div>
                        {showPastEvents && (
                            <div className="space-y-1">
                                {pastEvents.slice(0, 5).map(event => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        canManage={can('manage_channels')}
                                        onDelete={setDeletingEventId}
                                        onJoin={handleJoinEvent}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 w-56 rounded-md border border-white/10 bg-stone-900 p-1 text-stone-200 shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2">
                        <Check className="w-4 h-4" /> Mark As Read
                    </div>
                    <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2">
                        <Bell className="w-4 h-4" /> Notification Settings
                    </div>
                    <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2">
                        <VolumeX className="w-4 h-4" /> Mute Channel
                    </div>

                    {(can('manage_channels') || can('admin')) && (
                        <>
                            <div className="h-px bg-white/10 my-1" />
                            <div
                                className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2"
                                onClick={() => {
                                    setEditingChannelId(contextMenu.channelId)
                                    setContextMenu(null)
                                }}
                            >
                                <Edit2 className="w-4 h-4" /> Edit Channel
                            </div>
                            <div
                                className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-red-500/10 hover:text-red-400 text-red-400 gap-2"
                                onClick={() => {
                                    setDeletingChannelId(contextMenu.channelId)
                                    setContextMenu(null)
                                }}
                            >
                                <Trash2 className="w-4 h-4" /> Delete Channel
                            </div>
                        </>
                    )}

                    <div className="h-px bg-white/10 my-1" />
                    <div
                        className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-white/10 hover:text-stone-50 text-stone-500 gap-2"
                        onClick={() => {
                            handleCopyChannelId(contextMenu.channelId)
                            setContextMenu(null)
                        }}
                    >
                        <Copy className="w-3 h-3" /> Copy Channel ID
                    </div>
                </div>
            )}

            {/* Voice Connected Card */}
            {isConnected && (
                <div className="px-2 pb-2 shrink-0">
                    <div className="bg-stone-900/50 border border-white/10 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider">Voice Connected</span>
                            </div>
                        </div>

                        <div className="mb-3">
                            <span className="text-sm font-bold text-white block truncate mb-1"></span>
                            <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
                                <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    <Signal className="w-3 h-3" />
                                    RTC Connected
                                </span>
                                <span>•</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={leaveRoom}
                                className="flex items-center justify-center py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all text-xs font-medium border border-red-500/10 hover:border-red-500/20"
                            >
                                <PhoneOff className="w-3 h-3 mr-1.5" />
                                Disconnect
                            </button>
                            {can('manage_server') && (
                                <button
                                    onClick={() => setShowServerSettings(true)}
                                    className="flex items-center justify-center py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all text-xs font-medium border border-white/5 hover:border-white/10"
                                >
                                    <Settings className="w-3 h-3 mr-1.5" />
                                    Settings
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Settings Popover */}
            {showQuickSettings && (
                <div ref={quickSettingsRef} className="absolute bottom-16 left-2 w-64 bg-[#111214] border border-white/10 rounded-xl shadow-2xl p-3 z-50 animate-in slide-in-from-bottom-2">
                    <h3 className="text-xs font-bold text-stone-400 uppercase mb-3 px-1">Voice Settings</h3>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                            <span className="text-sm text-white">Input Device</span>
                            <span className="text-xs text-stone-500">Default</span>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                            <span className="text-sm text-white">Output Device</span>
                            <span className="text-xs text-stone-500">Default</span>
                        </div>

                        <div className="h-px bg-white/5 my-2" />

                        <div className="grid grid-cols-2 gap-2">
                            <button className="flex flex-col items-center gap-1 p-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors">
                                <Mic className="w-5 h-5 text-white" />
                                <span className="text-[10px] text-stone-400">Mute</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors">
                                <Video className="w-5 h-5 text-white" />
                                <span className="text-[10px] text-stone-400">Camera</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 p-2">
                            <Volume2 className="w-4 h-4 text-stone-400" />
                            <input type="range" className="w-full h-1 bg-stone-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
                        </div>
                    </div>
                </div>
            )}

            {/* Productivity Tools (Fixed Bottom) */}
            <div className="px-2 pb-2 space-y-2 shrink-0">
                <PomodoroTimer
                    roomId={roomId}
                    currentUser={currentUser}
                />
                <LoFiPlayer />
            </div>

            {/* User Controls (Bottom) */}
            <div className="h-[52px] bg-stone-950/60 flex items-center px-2 gap-2 border-t border-white/5 shrink-0">
                <div
                    ref={userControlsRef}
                    className="flex-1 flex items-center gap-2 hover:bg-white/5 p-1 rounded-lg cursor-pointer transition-colors group"
                    onClick={() => setShowProfilePopup(!showProfilePopup)}
                >
                    <Avatar className="w-8 h-8 border border-white/10">
                        <AvatarImage src={currentUser?.avatar_url || undefined} />
                        <AvatarFallback className="bg-orange-600 text-white text-xs font-bold">
                            {currentUser?.username?.[0]?.toUpperCase() || 'ME'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-xs overflow-hidden">
                        <div className="font-bold text-white truncate">{currentUser?.username || 'You'}</div>
                        <div className="text-stone-400 truncate text-[10px]">Online</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={() => setShowServerSettings(true)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>


            <UserProfilePopup
                user={currentUser}
                isOpen={showProfilePopup}
                onClose={() => setShowProfilePopup(false)}
                anchorRef={userControlsRef as React.RefObject<HTMLDivElement>}
            />

            <ServerSettingsModal
                roomId={roomId}
                isOpen={showServerSettings}
                onClose={() => setShowServerSettings(false)}
            />

            <ChannelSettingsModal
                roomId={roomId}
                channelId={editingChannelId}
                isOpen={!!editingChannelId}
                onClose={() => setEditingChannelId(null)}
            />

            <UnifiedCreationModal
                isOpen={isCreatingChannel}
                onClose={() => setIsCreatingChannel(false)}
                roomId={roomId}
                categories={categories}
                channelsCount={channels.length}
                categoriesCount={categories.length}
                canManage={can('manage_channels')}
                onSuccess={refetchAll}
            />

            {/* Delete Channel Confirmation */}
            <Dialog open={!!deletingChannelId} onOpenChange={(open) => !open && setDeletingChannelId(null)}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Delete Channel</DialogTitle>
                        <DialogDescription className="text-stone-400">
                            Are you sure you want to delete this channel? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Channel: <span className="font-bold text-white">#{channels.find(c => c.id === deletingChannelId)?.name}</span>
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                            Type: {channels.find(c => c.id === deletingChannelId)?.type}
                        </p>
                        <p className="text-xs text-red-400 mt-2">⚠️ This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeletingChannelId(null)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => deletingChannelId && handleDeleteChannel(deletingChannelId)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Channel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Category Confirmation */}
            <Dialog open={!!deletingCategoryId} onOpenChange={(open) => !open && setDeletingCategoryId(null)}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Delete Category</DialogTitle>
                        <DialogDescription className="text-stone-400">
                            Are you sure you want to delete this category? All channels in this category will be moved to "No Category".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Category: <span className="font-bold text-white">{categories.find(c => c.id === deletingCategoryId)?.name}</span>
                        </p>
                        <p className="text-xs text-red-400 mt-2">⚠️ This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeletingCategoryId(null)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => deletingCategoryId && handleDeleteCategory(deletingCategoryId)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Event Confirmation */}
            <Dialog open={!!deletingEventId} onOpenChange={(open) => !open && setDeletingEventId(null)}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Delete Event</DialogTitle>
                        <DialogDescription className="text-stone-400">
                            Are you sure you want to delete this event? This will remove it from the schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Event: <span className="font-bold text-white">{events.find(e => e.id === deletingEventId)?.name}</span>
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                            {deletingEventId && events.find(e => e.id === deletingEventId) && (
                                <>
                                    {new Date(events.find(e => e.id === deletingEventId)!.start_time).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    })}
                                </>
                            )}
                        </p>
                        <p className="text-xs text-red-400 mt-2">⚠️ This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeletingEventId(null)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => deletingEventId && handleDeleteEvent(deletingEventId)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


