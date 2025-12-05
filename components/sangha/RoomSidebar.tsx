'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { PomodoroTimer } from './PomodoroTimer'
import { LoFiPlayer } from './LoFiPlayer'
import { Hash, Volume2, Settings, ChevronDown, Presentation, Signal, PhoneOff, Mic, MicOff, Video, VideoOff, Sliders, Plus, Trash2, Edit2, Shield, Users, LogOut, Image as ImageIcon, MonitorPlay } from 'lucide-react'

// ... (existing imports)

// ... (inside component)


import Link from 'next/link'
import { UserProfilePopup } from './UserProfilePopup'
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
                {children}
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
import { useServerPermissions } from '@/hooks/useServerPermissions'

type Channel = {
    id: string
    name: string
    type: 'text' | 'voice' | 'canvas' | 'video' | 'image'
    position: number
}

export function RoomSidebar({ roomId, roomName, onSelectChannel, currentUser, isMobile = false }: { roomId: string, roomName: string, onSelectChannel: (type: 'text' | 'voice' | 'canvas' | 'video' | 'image') => void, currentUser?: any, isMobile?: boolean }) {
    const [activeChannel, setActiveChannel] = useState<'text' | 'voice' | 'canvas' | 'video' | 'image'>('text')
    const [showProfilePopup, setShowProfilePopup] = useState(false)
    const [showQuickSettings, setShowQuickSettings] = useState(false)
    const [showServerSettings, setShowServerSettings] = useState(false)
    const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
    const [duration, setDuration] = useState(0)
    const [participants, setParticipants] = useState<{ sid: string, identity: string }[]>([])
    const [channels, setChannels] = useState<Channel[]>([])
    const [isCreatingChannel, setIsCreatingChannel] = useState(false)
    const [newChannelName, setNewChannelName] = useState('')
    const [newChannelType, setNewChannelType] = useState<'text' | 'voice' | 'canvas' | 'video' | 'image'>('text')

    const quickSettingsRef = useRef<HTMLDivElement>(null)
    const userControlsRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const { state, roomName: activeCallRoom, leaveRoom } = useCall()
    const isConnected = state === 'connected'

    const { can, loading: permissionsLoading } = useServerPermissions(roomId, currentUser?.id)

    // Fetch Channels
    useEffect(() => {
        const fetchChannels = async () => {
            const { data } = await supabase
                .from('room_channels')
                .select('*')
                .eq('room_id', roomId)
                .order('position', { ascending: true })
                .order('created_at', { ascending: true })

            if (data) setChannels(data as Channel[])
        }
        fetchChannels()

        const channel = supabase
            .channel(`room_channels:${roomId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_channels', filter: `room_id=eq.${roomId}` }, () => {
                fetchChannels()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId])

    // Poll for participants - ONLY when connected to voice
    useEffect(() => {
        if (!isConnected) {
            setParticipants([]);
            return;
        }

        const fetchParticipants = async () => {
            try {
                const res = await fetch(`/api/livekit/participants?room=${roomName}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    setParticipants(data)
                }
            } catch (e) { console.error(e) }
        }
        fetchParticipants()
        const interval = setInterval(fetchParticipants, 5000)
        return () => clearInterval(interval)
    }, [roomName, isConnected])

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
                position: channels.length
            })

        if (error) {
            console.error('Channel creation error:', error)
            toast.error(`Failed to create channel: ${error.message}`)
        } else {
            toast.success('Channel created')
            setIsCreatingChannel(false)
            setNewChannelName('')
        }
    }

    const handleDeleteChannel = async (channelId: string) => {
        if (!confirm('Are you sure you want to delete this channel?')) return
        if (!can('manage_channels')) return

        const { error } = await supabase
            .from('room_channels')
            .delete()
            .eq('id', channelId)

        if (error) {
            toast.error('Failed to delete channel')
        } else {
            toast.success('Channel deleted')
            // Optimistic update
            setChannels(prev => prev.filter(c => c.id !== channelId))
        }
    }

    const textChannels = channels.filter(c => c.type === 'text')
    const voiceChannels = channels.filter(c => c.type === 'voice')
    const videoChannels = channels.filter(c => c.type === 'video')
    const canvasChannels = channels.filter(c => c.type === 'canvas')
    const imageChannels = channels.filter(c => c.type === 'image')

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

            {/* Channels List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
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
                    onDelete={handleDeleteChannel}
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
                    onDelete={handleDeleteChannel}
                    onContextMenu={handleContextMenu}
                >
                    {/* ... participants ... */}
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
                    onDelete={handleDeleteChannel}
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
                    onDelete={handleDeleteChannel}
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
                    onDelete={handleDeleteChannel}
                    onContextMenu={handleContextMenu}
                />
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
                                    handleDeleteChannel(contextMenu.channelId)
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
                <div className="bg-[#1E1F22] border-t border-white/5 p-2 pb-2 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-green-500">
                            <Signal className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-wide">Voice Connected</span>
                        </div>
                    </div>
                    <div className="mb-2 pl-0.5">
                        <span className="text-xs font-bold text-white block truncate">{activeCallRoom || 'Study Lounge'} / General</span>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-0.5">
                            <span className="bg-green-500/10 text-green-500 px-1 rounded">RTC Connected</span>
                            <span>•</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 border-t border-white/5 pt-2">
                        <button
                            onClick={leaveRoom}
                            className="flex items-center justify-center p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-white transition-colors text-xs font-medium"
                        >
                            <PhoneOff className="w-3 h-3 mr-1.5" />
                            Disconnect
                        </button>
                        <button
                            onClick={() => setShowServerSettings(true)}
                            className="flex items-center justify-center p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-white transition-colors text-xs font-medium"
                        >
                            <Settings className="w-3 h-3 mr-1.5" />
                            Settings
                        </button>
                    </div>
                </div>
            )}
            {isConnected && (
                <div className="bg-[#1E1F22] border-t border-white/5 p-2 pb-2 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-green-500">
                            <Signal className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-wide">Voice Connected</span>
                        </div>
                    </div>
                    <div className="mb-2 pl-0.5">
                        <span className="text-xs font-bold text-white block truncate">{activeCallRoom || 'Study Lounge'} / General</span>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-0.5">
                            <span className="bg-green-500/10 text-green-500 px-1 rounded">RTC Connected</span>
                            <span>•</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 border-t border-white/5 pt-2">
                        <button
                            onClick={leaveRoom}
                            className="flex items-center justify-center p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-white transition-colors text-xs font-medium"
                        >
                            <PhoneOff className="w-3 h-3 mr-1.5" />
                            Disconnect
                        </button>
                        <button
                            onClick={() => setShowServerSettings(true)}
                            className="flex items-center justify-center p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-white transition-colors text-xs font-medium"
                        >
                            <Settings className="w-3 h-3 mr-1.5" />
                            Settings
                        </button>
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

            {/* Create Channel Dialog */}
            <Dialog open={isCreatingChannel} onOpenChange={setIsCreatingChannel}>
                <DialogContent className="bg-stone-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Create Channel</DialogTitle>
                        <DialogDescription className="text-stone-400">
                            Create a new channel for your server.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Channel Type</Label>
                            <RadioGroup value={newChannelType} onValueChange={(v) => setNewChannelType(v as 'text' | 'voice' | 'canvas' | 'video' | 'image')} className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="text" id="text" className="border-white/20 text-orange-500" />
                                    <Label htmlFor="text" className="cursor-pointer flex items-center gap-2"><Hash className="w-4 h-4" /> Text</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="voice" id="voice" className="border-white/20 text-orange-500" />
                                    <Label htmlFor="voice" className="cursor-pointer flex items-center gap-2"><Volume2 className="w-4 h-4" /> Voice</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="video" id="video" className="border-white/20 text-orange-500" />
                                    <Label htmlFor="video" className="cursor-pointer flex items-center gap-2"><MonitorPlay className="w-4 h-4" /> Video</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="canvas" id="canvas" className="border-white/20 text-orange-500" />
                                    <Label htmlFor="canvas" className="cursor-pointer flex items-center gap-2"><Presentation className="w-4 h-4" /> Canvas</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="image" id="image" className="border-white/20 text-orange-500" />
                                    <Label htmlFor="image" className="cursor-pointer flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Image</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-2">
                            <Label>Channel Name</Label>
                            <Input
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                placeholder="new-channel"
                                className="bg-stone-800 border-white/10 text-white placeholder:text-stone-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreatingChannel(false)} className="hover:bg-white/5 hover:text-white">Cancel</Button>
                        <Button onClick={handleCreateChannel} className="bg-orange-600 hover:bg-orange-700 text-white">Create Channel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


