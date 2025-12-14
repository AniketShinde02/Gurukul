'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { PlusCircle, Gift, Sticker, Smile, Hash, Bell, Pin, Users, Trash2, Crown, Shield, File as FileIcon, Loader2, Reply, Edit2, X, Image as ImageIcon, FileText, Copy, MoreVertical, Mic } from 'lucide-react'
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
import { useServerPermissions } from '@/hooks/useServerPermissions'
import { awardXP, XP_RATES } from '@/lib/xp'
import { useOptimisticMessages } from '@/hooks/useOptimisticMessages'
import { MessageList } from '@/components/MessageList'
import { RoomMessage } from '@/hooks/useMessages'
import { useTypingIndicator, TypingIndicator } from '@/hooks/useTypingIndicator'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer'

export function RoomChatArea({ roomId, roomName, isSidebar = false }: { roomId: string, roomName: string, isSidebar?: boolean }) {
    const [newMessage, setNewMessage] = useState('')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<{ id: string, username?: string, avatar_url?: string | null, full_name?: string | null } | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showGifPicker, setShowGifPicker] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [replyTo, setReplyTo] = useState<RoomMessage | null>(null)
    const [editingMessage, setEditingMessage] = useState<RoomMessage | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [showPinnedMessages, setShowPinnedMessages] = useState(false)
    const [pinnedMessages, setPinnedMessages] = useState<any[]>([])
    const [loadingPins, setLoadingPins] = useState(false)
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const gifPickerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { can } = useServerPermissions(roomId, currentUserId || undefined)
    const { sendMessage, isSending } = useOptimisticMessages(roomId)
    const { typingUsers, startTyping, stopTyping } = useTypingIndicator(roomId, currentUserId || '')

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Fetch profile for optimistic updates
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

                setCurrentUserId(user.id)
                setCurrentUser({
                    id: user.id,
                    username: profile?.username || user.email?.split('@')[0],
                    full_name: profile?.full_name,
                    avatar_url: profile?.avatar_url
                })
            }
        }
        getUser()
    }, [])

    // Fetch pinned messages
    const fetchPinnedMessages = async () => {
        setLoadingPins(true)
        try {
            const { data, error } = await supabase
                .from('room_pinned_messages')
                .select(`
                    id,
                    message_id,
                    pinned_by,
                    created_at,
                    room_messages (
                        id,
                        content,
                        user_id,
                        created_at,
                        profiles:user_id (username, avatar_url)
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setPinnedMessages(data || [])
        } catch (error) {
            console.error('Error fetching pinned messages:', error)
        } finally {
            setLoadingPins(false)
        }
    }

    // Pin a message
    const handlePinMessage = async (messageId: string) => {
        if (!currentUserId) return
        try {
            const { error } = await supabase
                .from('room_pinned_messages')
                .insert({
                    message_id: messageId,
                    pinned_by: currentUserId
                })

            if (error) throw error
            toast.success('Message pinned!')
            fetchPinnedMessages()
        } catch (error: any) {
            if (error.code === '23505') {
                toast.error('Message already pinned')
            } else {
                toast.error('Failed to pin message')
            }
        }
    }

    // Unpin a message
    const handleUnpinMessage = async (pinId: string) => {
        try {
            const { error } = await supabase
                .from('room_pinned_messages')
                .delete()
                .eq('id', pinId)

            if (error) throw error
            toast.success('Message unpinned')
            setPinnedMessages(prev => prev.filter(p => p.id !== pinId))
        } catch (error) {
            toast.error('Failed to unpin message')
        }
    }

    // Send voice message
    const handleVoiceSend = async (audioUrl: string, duration: number, waveform: number[]) => {
        if (!currentUserId || !currentUser) return

        try {
            // Send message with type='voice'
            sendMessage({
                content: audioUrl,
                userId: currentUserId,
                type: 'voice',
                fileUrl: audioUrl,
                senderProfile: {
                    username: currentUser.username || 'You',
                    full_name: currentUser.full_name || null,
                    avatar_url: currentUser.avatar_url || null
                }
            })

            setShowVoiceRecorder(false)
            toast.success('Voice message sent!')
        } catch (error) {
            console.error('Failed to send voice message:', error)
            toast.error('Failed to send voice message')
        }
    }

    // Close pickers checks
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
            // Edit is not optimistic yet for simplicity, but could be
            const { error } = await supabase
                .from('room_messages')
                .update({ content, is_edited: true })
                .eq('id', editingMessage.id)

            if (error) toast.error('Failed to edit message')
        } else {
            // Optimistic send
            sendMessage({
                content,
                userId: currentUserId,
                type: 'text',
                parentId: replyTo?.id,
                senderProfile: currentUser ? {
                    username: currentUser.username || 'You',
                    full_name: currentUser.full_name || null,
                    avatar_url: currentUser.avatar_url || null
                } : undefined
            })
            // XP is handled on server or can be optimistically added, but stick to component logic
            awardXP(currentUserId, XP_RATES.MESSAGE, 'Sent a message')
        }
    }

    const handleSendGif = async (url: string) => {
        if (!currentUserId || !can('send_messages')) return
        setShowGifPicker(false)

        sendMessage({
            content: url,
            userId: currentUserId,
            type: 'gif',
            senderProfile: currentUser ? {
                username: currentUser.username || 'You',
                full_name: currentUser.full_name || null,
                avatar_url: currentUser.avatar_url || null
            } : undefined
        })
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

                sendMessage({
                    content: file.name,
                    fileUrl: publicUrl,
                    userId: currentUserId,
                    type: type as any,
                    senderProfile: currentUser ? {
                        username: currentUser.username || 'You',
                        full_name: currentUser.full_name || null,
                        avatar_url: currentUser.avatar_url || null
                    } : undefined
                })
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
        // Optimistic delete not implemented yet, just direct
        const { error } = await supabase
            .from('room_messages')
            .delete()
            .eq('id', messageId)

        if (error) {
            console.error('Error deleting message:', error)
            toast.error('Failed to delete message')
        }
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

                        {/* Pinned Messages Button */}
                        <DropdownMenu open={showPinnedMessages} onOpenChange={(open) => {
                            setShowPinnedMessages(open)
                            if (open) fetchPinnedMessages()
                        }}>
                            <DropdownMenuTrigger asChild>
                                <button className={`relative ${showPinnedMessages ? 'text-orange-500' : 'hover:text-white'} transition-colors`}>
                                    <Pin className="w-5 h-5" />
                                    {pinnedMessages.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                                            {pinnedMessages.length}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-stone-900 border-white/10">
                                <div className="p-3 border-b border-white/10">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Pin className="w-4 h-4 text-orange-500" />
                                        Pinned Messages
                                    </h3>
                                </div>
                                {loadingPins ? (
                                    <div className="p-4 flex justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                                    </div>
                                ) : pinnedMessages.length === 0 ? (
                                    <div className="p-6 text-center text-stone-500">
                                        <Pin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No pinned messages yet</p>
                                        <p className="text-xs mt-1">Click the pin icon on any message to pin it</p>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-2">
                                        {pinnedMessages.map((pin) => (
                                            <div key={pin.id} className="p-2 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors group">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-orange-400 font-medium mb-1">
                                                            {pin.room_messages?.profiles?.username || 'Unknown'}
                                                        </p>
                                                        <p className="text-sm text-stone-200 line-clamp-2">
                                                            {pin.room_messages?.content || 'Message deleted'}
                                                        </p>
                                                        <p className="text-[10px] text-stone-500 mt-1">
                                                            {new Date(pin.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnpinMessage(pin.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                                        title="Unpin"
                                                    >
                                                        <X className="w-3 h-3 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Users className="w-5 h-5 hover:text-white cursor-pointer transition-colors lg:hidden" />
                    </div>
                </div>
            )}

            {/* Messages via MessageList */}
            <div className="flex-1 overflow-hidden">
                <MessageList
                    roomId={roomId}
                    currentUserId={currentUserId}
                    onReply={(msg) => {
                        setReplyTo(msg)
                        inputRef.current?.focus()
                    }}
                    onEdit={(msg) => {
                        setEditingMessage(msg)
                        setNewMessage(msg.content)
                        inputRef.current?.focus()
                    }}
                    onDelete={handleDeleteMessage}
                    onImageClick={setPreviewImage}
                    onPin={handlePinMessage}
                />
            </div>

            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />

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
                                        <span>Replying to <span className="font-bold text-white">@{replyTo.sender?.username}</span></span>
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
                                onChange={(e) => {
                                    setNewMessage(e.target.value)
                                    if (e.target.value && currentUser?.username) {
                                        startTyping(currentUser.username)
                                    } else {
                                        stopTyping()
                                    }
                                }}
                                onBlur={() => stopTyping()}
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

                            {/* Voice Message Button */}
                            <button
                                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5 ${showVoiceRecorder ? 'text-orange-500' : 'text-stone-400 hover:text-white'}`}
                                title="Send Voice Message"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Voice Recorder */}
                    {showVoiceRecorder && (
                        <div className="mt-3 px-6">
                            <VoiceRecorder
                                onSend={handleVoiceSend}
                                onCancel={() => setShowVoiceRecorder(false)}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="px-6 pb-6 pt-2 text-center text-stone-500 text-sm">
                    You do not have permission to send messages in this channel.
                </div>
            )}
        </div >
    )
}
