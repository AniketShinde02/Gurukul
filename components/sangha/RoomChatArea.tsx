'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { PlusCircle, Gift, Sticker, Smile, Hash, Bell, Pin, Users, Trash2, Crown, Shield, File as FileIcon, Loader2, Reply, Edit2, X, Image as ImageIcon, FileText, Copy, MoreVertical } from 'lucide-react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { GifPicker } from '@/components/sangha/GifPicker'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { Linkify } from '@/components/ui/linkify'
import { useServerPermissions } from '@/hooks/useServerPermissions'
import { awardXP, XP_RATES } from '@/lib/xp'

type RoomMessage = {
    id: string
    content: string
    created_at: string
    sender_id: string
    type: 'text' | 'image' | 'gif' | 'file' | 'system'
    file_url?: string
    parent_id?: string | null
    is_edited?: boolean
    sender: {
        username: string
        full_name: string | null
        avatar_url: string | null
    }
    reply_to?: {
        sender: { username: string }
        content: string
    }
}

export function RoomChatArea({ roomId, roomName, isSidebar = false }: { roomId: string, roomName: string, isSidebar?: boolean }) {
    const [messages, setMessages] = useState<RoomMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<{ id: string, username?: string } | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showGifPicker, setShowGifPicker] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [replyTo, setReplyTo] = useState<RoomMessage | null>(null)
    const [editingMessage, setEditingMessage] = useState<RoomMessage | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const gifPickerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { can, loading: permissionsLoading } = useServerPermissions(roomId, currentUserId || undefined)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
                setCurrentUser({ id: user.id, username: user.email?.split('@')[0] })
            }
        }
        getUser()
        fetchMessages()

        // Realtime subscription for room messages
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_messages',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    // Fetch full message with sender info
                    const { data } = await supabase
                        .from('room_messages')
                        .select(`
                            *,
                            sender:profiles!sender_id(username, full_name, avatar_url),
                            reply_to:room_messages!parent_id(content, sender:profiles!sender_id(username))
                        `)
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        // Prevent duplicates (in case of race condition)
                        setMessages(prev => {
                            if (prev.some(m => m.id === data.id)) return prev
                            return [...prev, data]
                        })

                        // Auto-scroll to bottom on new message
                        setTimeout(() => {
                            chatEndRef?.current?.scrollIntoView({ behavior: 'smooth' })
                        }, 100)

                        // Show notification if message is from someone else and window not focused
                        if (data.sender_id !== currentUser?.id && document.hidden) {
                            // Import dynamically to avoid SSR issues
                            import('@/hooks/useNotifications').then(({ showMessageNotification }) => {
                                showMessageNotification(
                                    data.sender?.username || 'Unknown',
                                    data.content,
                                    data.sender?.avatar_url,
                                    undefined,
                                    roomName
                                )
                            })
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'room_messages',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'room_messages',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    setMessages(prev => prev.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Realtime connected for room: ${roomId}`)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, currentUser?.id, roomName])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Close pickers
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false)
            }
            if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
                setShowGifPicker(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('room_messages')
            .select(`
                *,
                sender:profiles!sender_id(username, full_name, avatar_url),
                reply_to:room_messages!parent_id(content, sender:profiles!sender_id(username))
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })
            .limit(50)

        if (data) setMessages(data as RoomMessage[])
    }

    const [roomBanner, setRoomBanner] = useState<string | null>(null)

    useEffect(() => {
        const fetchRoomDetails = async () => {
            const { data } = await supabase
                .from('study_rooms')
                .select('banner_url')
                .eq('id', roomId)
                .single()

            if (data?.banner_url) {
                setRoomBanner(data.banner_url)
            }
        }
        fetchRoomDetails()
    }, [roomId])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !currentUserId) return
        if (!can('send_messages')) {
            toast.error('You do not have permission to send messages.')
            return
        }

        const content = newMessage
        setNewMessage('')
        setShowEmojiPicker(false)
        setReplyTo(null)
        setEditingMessage(null)

        if (editingMessage) {
            const { error } = await supabase
                .from('room_messages')
                .update({ content, is_edited: true })
                .eq('id', editingMessage.id)

            if (error) toast.error('Failed to edit message')
        } else {
            const { error } = await supabase
                .from('room_messages')
                .insert({
                    room_id: roomId,
                    sender_id: currentUserId,
                    content,
                    type: 'text',
                    parent_id: replyTo?.id
                })

            if (error) {
                console.error('Error sending message:', error)
                toast.error('Failed to send message')
            } else {
                awardXP(currentUserId, XP_RATES.MESSAGE, 'Sent a message')
            }
        }
    }

    const handleSendGif = async (url: string) => {
        if (!currentUserId) return
        if (!can('send_messages')) return
        setShowGifPicker(false)

        const { error } = await supabase
            .from('room_messages')
            .insert({
                room_id: roomId,
                sender_id: currentUserId,
                content: url,
                type: 'gif'
            })

        if (error) {
            console.error('Error sending GIF:', error)
            toast.error('Failed to send GIF')
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0 || !currentUserId) return
        if (!can('send_messages')) return

        setIsUploading(true)
        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${roomId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('chat-attachments')
                    .getPublicUrl(filePath)

                const type = file.type.startsWith('image/') ? 'image' : 'file'

                const { error: msgError } = await supabase
                    .from('room_messages')
                    .insert({
                        room_id: roomId,
                        sender_id: currentUserId,
                        content: file.name,
                        file_url: publicUrl,
                        type: type
                    })

                if (msgError) throw msgError
            }
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error('Failed to upload file')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        setMessages(prev => prev.filter(m => m.id !== messageId))

        const { error } = await supabase
            .from('room_messages')
            .delete()
            .eq('id', messageId)

        if (error) {
            console.error('Error deleting message:', error)
            toast.error('Failed to delete message')
            fetchMessages()
        }
    }

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Text copied')
    }

    const onEmojiClick = (emojiObject: any) => {
        setNewMessage(prev => prev + emojiObject.emoji)
    }

    return (
        <div className="flex-1 flex flex-col bg-transparent min-w-0 relative">
            {/* Image Preview Overlay */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header - Hide if sidebar */}
            {!isSidebar && (
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-transparent z-10">
                    <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-stone-500" />
                        <div>
                            <span className="font-bold text-white font-serif tracking-wide text-lg block leading-none">{roomName}</span>
                            <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">General Channel</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-stone-400">
                        <Bell className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                        <Pin className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                        <Users className="w-5 h-5 hover:text-white cursor-pointer transition-colors lg:hidden" />
                    </div>
                </div>
            )}

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent flex flex-col"
            >
                <div className="flex-1" />

                <div className="w-full max-w-4xl mx-auto space-y-4 pb-4">
                    {!isSidebar && messages.length < 5 && (
                        <div className="mb-8 rounded-3xl overflow-hidden relative group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                            <img
                                src={roomBanner || "https://picsum.photos/seed/room/800/300"}
                                alt="Room Cover"
                                onError={() => setRoomBanner(null)}
                                className="w-full h-48 object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute bottom-4 left-6 z-20">
                                <h1 className="text-3xl font-bold text-white mb-1 font-serif shadow-sm">
                                    #{roomName}
                                </h1>
                                <p className="text-stone-300 text-sm shadow-sm">
                                    Welcome to the start of the <span className="font-bold text-white">#general</span> channel.
                                </p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender_id === currentUserId
                            const canDelete = isMe || can('manage_messages') || can('admin')

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group relative`}
                                >
                                    <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                                        {/* Avatar */}
                                        <Avatar className="w-8 h-8 mb-1 border border-white/10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                                            <AvatarImage src={msg.sender.avatar_url || undefined} />
                                            <AvatarFallback className="bg-stone-800 text-stone-300 text-xs">
                                                {msg.sender.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0`}>
                                            {/* Header */}
                                            <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <span className="font-bold text-stone-200 text-xs hover:underline cursor-pointer">
                                                    {msg.sender.full_name || msg.sender.username}
                                                </span>
                                                <span className="text-[10px] text-stone-500">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Reply Context */}
                                            {msg.reply_to && (
                                                <div className={`flex items-center gap-1 text-xs text-stone-500 mb-1 opacity-80 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className="w-4 h-2 border-l-2 border-t-2 border-stone-600 rounded-tl-md" />
                                                    <span className="font-bold">@{msg.reply_to?.sender?.username || 'Unknown'}</span>
                                                    <span className="truncate max-w-[200px]">{msg.reply_to?.content || 'Message deleted'}</span>
                                                </div>
                                            )}

                                            {/* Content Bubble Wrapper */}
                                            <div className={`relative group/bubble flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`relative px-4 py-2 rounded-2xl text-sm break-words shadow-sm transition-all duration-300 ${isMe
                                                    ? 'bg-orange-600 text-white rounded-tr-none'
                                                    : 'bg-stone-800 text-stone-200 rounded-tl-none'
                                                    }`}>
                                                    {msg.type === 'image' || msg.type === 'gif' ? (
                                                        <div
                                                            className="group/image relative cursor-pointer overflow-hidden rounded-lg mt-1"
                                                            onClick={() => setPreviewImage(msg.file_url || msg.content)}
                                                        >
                                                            <div className="w-32 h-32 md:w-64 md:h-64 bg-black/20">
                                                                <img
                                                                    src={msg.file_url || msg.content}
                                                                    alt="Content"
                                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                                                                />
                                                            </div>
                                                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                                                                <ImageIcon className="w-6 h-6 text-white drop-shadow-lg" />
                                                            </div>
                                                        </div>
                                                    ) : msg.type === 'file' ? (
                                                        <a
                                                            href={msg.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-stone-900/50 rounded-lg hover:bg-stone-900 transition-colors border border-white/10"
                                                        >
                                                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                                                                <FileIcon className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-stone-200 truncate">{msg.content}</p>
                                                                <p className="text-xs text-stone-500">Click to download</p>
                                                            </div>
                                                        </a>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap leading-relaxed">
                                                            <Linkify text={msg.content} />
                                                            {msg.is_edited && <span className="text-[10px] opacity-70 ml-1">(edited)</span>}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action Bar */}
                                                <div className={`opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex items-center gap-1 bg-stone-900/80 rounded-lg p-1 border border-white/5 backdrop-blur-sm`}>
                                                    <button
                                                        onClick={() => {
                                                            setReplyTo(msg)
                                                            inputRef.current?.focus()
                                                        }}
                                                        className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                        title="Reply"
                                                    >
                                                        <Reply className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleCopyText(msg.content)}
                                                        className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                        title="Copy Text"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>

                                                    {canDelete && (
                                                        <>
                                                            {msg.type === 'text' && isMe && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMessage(msg)
                                                                        setNewMessage(msg.content)
                                                                        inputRef.current?.focus()
                                                                    }}
                                                                    className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteMessage(msg.id)}
                                                                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                    {/* Scroll anchor for auto-scroll on new messages */}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Area */}
            {can('send_messages') ? (
                <div className="px-6 pb-6 pt-2 relative w-full max-w-4xl mx-auto shrink-0 z-20">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple />

                    {/* Reply / Edit Indicator */}
                    {(replyTo || editingMessage) && (
                        <div className="flex items-center justify-between bg-stone-800/50 border-t border-x border-white/10 rounded-t-xl px-4 py-2 text-xs text-stone-300">
                            <div className="flex items-center gap-2">
                                {replyTo ? (
                                    <>
                                        <Reply className="w-3 h-3" />
                                        <span>Replying to <span className="font-bold text-white">@{replyTo.sender.username}</span></span>
                                    </>
                                ) : (
                                    <>
                                        <Edit2 className="w-3 h-3" />
                                        <span>Editing message</span>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setReplyTo(null)
                                    setEditingMessage(null)
                                    setNewMessage('')
                                }}
                                className="hover:text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Emoji Picker Popover */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute bottom-24 right-0 z-50 shadow-2xl rounded-xl overflow-hidden border border-white/10"
                                ref={emojiPickerRef}
                            >
                                <EmojiPicker
                                    theme={Theme.DARK}
                                    onEmojiClick={onEmojiClick}
                                    skinTonesDisabled
                                    searchDisabled={false}
                                    width={350}
                                    height={400}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* GIF Picker Popover */}
                    <AnimatePresence>
                        {showGifPicker && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute bottom-24 right-12 z-50 shadow-2xl rounded-xl overflow-hidden border border-white/10"
                                ref={gifPickerRef}
                            >
                                <GifPicker onSelect={handleSendGif} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`bg-stone-900/90 backdrop-blur-xl ${replyTo || editingMessage ? 'rounded-b-3xl rounded-t-none' : 'rounded-3xl'} px-2 py-2 flex items-center gap-2 border border-white/10 shadow-2xl focus-within:border-orange-500/50 transition-all focus-within:ring-1 focus-within:ring-orange-500/20`}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isUploading}
                                    title="Add files"
                                >
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-orange-500" /> : <PlusCircle className="w-6 h-6" />}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-stone-900 border-white/10 text-stone-200 w-48">
                                <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-white/5 focus:bg-white/5 focus:text-white" onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon className="w-4 h-4 text-green-400" />
                                    Upload Image
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-white/5 focus:bg-white/5 focus:text-white" onClick={() => fileInputRef.current?.click()}>
                                    <FileText className="w-4 h-4 text-blue-400" />
                                    Upload File
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <form onSubmit={handleSend} className="flex-1">
                            <input
                                ref={inputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={`Write a message...`}
                                className="w-full bg-transparent border-none text-stone-200 placeholder:text-stone-500 focus:outline-none px-2 text-sm"
                            />
                        </form>

                        <div className="flex items-center gap-1 pr-2">
                            <button
                                className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
                                title="Send a Gift (Coming Soon)"
                                onClick={() => toast('Gifting coming soon!', { icon: '🎁' })}
                            >
                                <Gift className="w-5 h-5" />
                            </button>
                            <button
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5 ${showGifPicker ? 'text-orange-500' : 'text-stone-400 hover:text-white'}`}
                                title="Send a GIF"
                                onClick={() => {
                                    setShowGifPicker(!showGifPicker)
                                    setShowEmojiPicker(false)
                                }}
                            >
                                <Sticker className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    setShowEmojiPicker(!showEmojiPicker)
                                    setShowGifPicker(false)
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5 ${showEmojiPicker ? 'text-orange-500' : 'text-stone-400 hover:text-white'}`}
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="px-6 pb-6 pt-2 text-center text-stone-500 text-sm">
                    You do not have permission to send messages in this channel.
                </div>
            )}
        </div >
    )
}
