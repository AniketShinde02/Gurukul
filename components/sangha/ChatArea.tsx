'use client'

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { useDm } from '@/hooks/useDm'
import { useSound } from '@/hooks/useSound'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Info, PlusCircle, Smile, Gift, Sticker, Trash2, MoreVertical, X, Image as ImageIcon, FileText, Paperclip, Copy, Search, Pin, Loader2, Mic } from 'lucide-react'
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
import { supabase } from '@/lib/supabase/client'
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer'

export function ChatArea({ conversationId, onClose }: { conversationId: string, onClose?: () => void }) {
    const {
        conversations,
        messages,
        isLoading,
        isMoreLoading,
        hasMore,
        loadMoreMessages,
        sendMessage,
        uploadFile,
        deleteMessage,
        deleteConversation,
        currentUserId,
        setActiveConversationId,
        addReaction
    } = useDm()

    const { play } = useSound()
    const [newMessage, setNewMessage] = useState('')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showGifPicker, setShowGifPicker] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [showSearch, setShowSearch] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Use search results if searching, otherwise show normal messages
    const filteredMessages = searchResults.length > 0 ? searchResults : messages

    const [showPinnedMessages, setShowPinnedMessages] = useState(false)
    const [pinnedMessages, setPinnedMessages] = useState<any[]>([])
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [isUploadingVoice, setIsUploadingVoice] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const [loadingPins, setLoadingPins] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const gifPickerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const prevScrollHeightRef = useRef(0)
    const prevMessageCountRef = useRef(0)

    // Drag & Drop Handlers
    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFileUpload(files)
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(Array.from(e.target.files))
        }
    }

    const handleFileUpload = async (files: File[]) => {
        for (const file of files) {
            await uploadFile(file)
        }
    }

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Text copied')
    }

    // Start voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                await uploadVoiceMessage(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingDuration(0)

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1)
            }, 1000)

            toast.success('Recording started')
        } catch (error) {
            console.error('Recording error:', error)
            toast.error('Failed to access microphone')
        }
    }

    // Stop voice recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
        }
    }

    // Cancel recording
    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
            }
        }
        setIsRecording(false)
        setRecordingDuration(0)
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
        }
        audioChunksRef.current = []
        toast.success('Recording cancelled')
    }

    // Upload voice message
    const uploadVoiceMessage = async (audioBlob: Blob) => {
        setIsUploadingVoice(true)
        try {
            const timestamp = Date.now()
            const filename = `voice_${timestamp}.webm`
            const filepath = `${conversationId}/${filename}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('voice-messages')
                .upload(filepath, audioBlob, {
                    contentType: 'audio/webm',
                    cacheControl: '3600'
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('voice-messages')
                .getPublicUrl(filepath)

            // Send message
            await sendMessage(publicUrl, 'voice')

            toast.success('Voice message sent!')
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to send voice message')
        } finally {
            setIsUploadingVoice(false)
            setRecordingDuration(0)
        }
    }

    // Fetch pinned DM messages
    const fetchPinnedMessages = async () => {
        setLoadingPins(true)
        try {
            const { data, error } = await supabase
                .from('dm_pinned_messages')
                .select(`
                    id,
                    message_id,
                    pinned_by,
                    created_at,
                    dm_messages (
                        id,
                        content,
                        sender_id,
                        created_at
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

    // Pin a DM message
    const handlePinMessage = async (messageId: string) => {
        if (!currentUserId) return
        try {
            const { error } = await supabase
                .from('dm_pinned_messages')
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

    // Unpin a DM message
    const handleUnpinMessage = async (pinId: string) => {
        try {
            const { error } = await supabase
                .from('dm_pinned_messages')
                .delete()
                .eq('id', pinId)

            if (error) throw error
            toast.success('Message unpinned')
            setPinnedMessages(prev => prev.filter(p => p.id !== pinId))
        } catch (error) {
            toast.error('Failed to unpin message')
        }
    }

    // Full-text search handler
    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        try {
            const response = await fetch(
                `/api/search?q=${encodeURIComponent(query)}&type=dm&id=${conversationId}&limit=50`
            )

            if (!response.ok) throw new Error('Search failed')

            const data = await response.json()
            setSearchResults(data.results || [])
        } catch (error) {
            console.error('Search error:', error)
            toast.error('Search failed')
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }, [conversationId])

    // Debounced search
    useEffect(() => {
        if (!searchTerm) {
            setSearchResults([])
            return
        }

        const timer = setTimeout(() => {
            handleSearch(searchTerm)
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [searchTerm, handleSearch])

    // Sync active ID
    useEffect(() => {
        setActiveConversationId(conversationId)
    }, [conversationId, setActiveConversationId])

    const handleScroll = useCallback(() => {
        const div = scrollRef.current
        if (!div) return

        if (div.scrollTop === 0 && hasMore && !isMoreLoading && !isLoading) {
            prevScrollHeightRef.current = div.scrollHeight
            loadMoreMessages()
        }
    }, [hasMore, isMoreLoading, isLoading, loadMoreMessages])

    // Restore scroll position after loading older messages
    useLayoutEffect(() => {
        const div = scrollRef.current
        if (!div || prevScrollHeightRef.current === 0) return

        if (div.scrollHeight > prevScrollHeightRef.current) {
            const diff = div.scrollHeight - prevScrollHeightRef.current
            div.scrollTop = diff
            prevScrollHeightRef.current = 0
        }
    }, [messages])

    // Auto-scroll logic for NEW messages
    useEffect(() => {
        const div = scrollRef.current
        if (!div) return

        // If not loading history...
        if (!isMoreLoading && prevScrollHeightRef.current === 0) {
            const isAtBottom = div.scrollHeight - div.scrollTop - div.clientHeight < 150
            const lastMsg = messages[messages.length - 1]
            // Scroll if at bottom OR I sent the message
            if (isAtBottom || (lastMsg && lastMsg.sender_id === currentUserId)) {
                div.scrollTop = div.scrollHeight
            }
        }
    }, [messages, isMoreLoading, currentUserId])

    // Sound effect (Receive)
    useEffect(() => {
        if (messages.length > prevMessageCountRef.current) {
            const latestMessage = messages[messages.length - 1]
            // Only play if it's a NEW message (not history load) and not from me
            // History loads usually maintain or increase count, but we check isMoreLoading
            if (latestMessage && latestMessage.sender_id !== currentUserId && !isMoreLoading && !isLoading) {
                play('MESSAGE_ROOM')
            }
        }
        prevMessageCountRef.current = messages.length
    }, [messages, currentUserId, play, isMoreLoading, isLoading])

    // Close pickers when clicking outside
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

    const activeConversation = conversations.find(c => c.id === conversationId)

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return
        sendMessage(newMessage)
        play('MESSAGE_SEND')
        setNewMessage('')
        setShowEmojiPicker(false)
    }

    const handleSendGif = (url: string) => {
        sendMessage(url, 'image') // Sending as image type for now, or 'gif' if supported by backend
        play('MESSAGE_SEND')
        setShowGifPicker(false)
    }

    const onEmojiClick = (emojiObject: any) => {
        setNewMessage(prev => prev + emojiObject.emoji)
    }

    if (!activeConversation) return (
        <div className="flex-1 flex items-center justify-center text-stone-500">
            <div className="flex flex-col items-center gap-2">
                <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                <p className="text-sm">Loading conversation...</p>
            </div>
        </div>
    )

    return (
        <div
            className="flex-1 flex flex-col bg-transparent min-w-0 relative h-full overflow-hidden"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
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

            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-transparent z-10 shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="w-8 h-8 border border-white/10">
                            <AvatarImage src={activeConversation.otherUser.avatar_url || undefined} />
                            <AvatarFallback className="bg-stone-800 text-stone-300">
                                {activeConversation.otherUser.username[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-stone-950" />
                    </div>
                    <div>
                        <span className="font-bold text-white font-serif tracking-wide text-lg block leading-none">
                            {activeConversation.otherUser.full_name || activeConversation.otherUser.username}
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">
                            @{activeConversation.otherUser.username}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-stone-400">
                    <Button variant="ghost" size="icon" className="hover:text-white hover:bg-white/5">
                        <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-white hover:bg-white/5">
                        <Video className="w-5 h-5" />
                    </Button>

                    <Button variant="ghost" size="icon" className={`hover:text-white hover:bg-white/5 ${showSearch ? 'text-orange-500 bg-white/5' : ''}`} onClick={() => { setShowSearch(!showSearch); if (!showSearch) setSearchTerm('') }}>
                        <Search className="w-5 h-5" />
                    </Button>

                    {/* Pinned Messages */}
                    <DropdownMenu open={showPinnedMessages} onOpenChange={(open) => {
                        setShowPinnedMessages(open)
                        if (open) fetchPinnedMessages()
                    }}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={`relative hover:text-white hover:bg-white/5 ${showPinnedMessages ? 'text-orange-500 bg-white/5' : ''}`}>
                                <Pin className="w-5 h-5" />
                                {pinnedMessages.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                                        {pinnedMessages.length}
                                    </span>
                                )}
                            </Button>
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
                                    <p className="text-xs mt-1">Hover a message and click 📌 to pin</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-2">
                                    {pinnedMessages.map((pin) => (
                                        <div key={pin.id} className="p-2 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors group">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-stone-200 line-clamp-2">
                                                        {pin.dm_messages?.content || 'Message deleted'}
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:text-white hover:bg-white/5">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-stone-900 border-white/10 text-stone-200">
                            <DropdownMenuItem
                                onClick={() => deleteConversation(activeConversation.id)}
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setActiveConversationId(null)
                            if (onClose) onClose()
                        }}
                        className="hover:text-white hover:bg-white/5 text-stone-500"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-white/5 bg-stone-900/50 backdrop-blur-md overflow-hidden relative"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                        <input
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search in conversation..."
                            className="w-full bg-transparent border-none py-3 pl-10 pr-4 text-sm text-white placeholder:text-stone-500 focus:outline-none"
                        />
                        {isSearching ? (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                            </div>
                        ) : searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
                {/* Loading History Spinner */}
                {isMoreLoading && (
                    <div className="flex justify-center py-2">
                        <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full" />
                    </div>
                )}

                {!hasMore && messages.length > 10 && (
                    <div className="text-center py-4 text-xs text-stone-600 font-medium uppercase tracking-widest">
                        Start of History
                    </div>
                )}

                <div className="flex-1" /> {/* Spacer */}

                <div className="w-full max-w-4xl mx-auto space-y-2 pb-4">
                    {/* Welcome Message - Only show when no messages */}
                    {messages.length === 0 && !isLoading && (
                        <div className="mb-8 text-center py-10">
                            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-stone-900 shadow-2xl">
                                <AvatarImage src={activeConversation.otherUser.avatar_url || undefined} />
                                <AvatarFallback className="bg-stone-800 text-stone-300 text-4xl">
                                    {activeConversation.otherUser.username[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <h1 className="text-3xl font-bold text-white mb-2 font-serif">
                                {activeConversation.otherUser.full_name || activeConversation.otherUser.username}
                            </h1>
                            <p className="text-stone-400 text-sm max-w-md mx-auto">
                                This is the beginning of your direct message history with <span className="font-bold text-stone-200">@{activeConversation.otherUser.username}</span>.
                            </p>
                        </div>
                    )}

                    {isLoading && messages.length === 0 ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {filteredMessages.map((msg, idx) => {
                                const isMe = msg.sender_id === currentUserId

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                        className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group relative`}
                                    >
                                        <div className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                                            {/* Avatar */}
                                            <Avatar className="w-8 h-8 mb-1 border border-white/10 shrink-0">
                                                <AvatarImage loading="lazy" src={isMe ? undefined : activeConversation.otherUser.avatar_url || undefined} />
                                                <AvatarFallback className="bg-stone-800 text-stone-300 text-xs">
                                                    {isMe ? 'ME' : activeConversation.otherUser.username[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0`}>
                                                {/* Header */}
                                                <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span className="font-bold text-stone-200 text-xs">
                                                        {isMe ? 'You' : activeConversation.otherUser.full_name || activeConversation.otherUser.username}
                                                    </span>
                                                    <span className="text-[10px] text-stone-500">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Content Bubble Wrapper */}
                                                <div className={`relative group/bubble flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className={`relative px-4 py-2 rounded-2xl text-sm break-words shadow-sm transition-all duration-300 ${msg.is_deleted
                                                        ? 'bg-white/5 text-stone-500 italic border border-white/5'
                                                        : isMe
                                                            ? 'bg-orange-600 text-white rounded-tr-none'
                                                            : 'bg-stone-800 text-stone-200 rounded-tl-none'
                                                        }`}>
                                                        <AnimatePresence mode="wait">
                                                            {msg.is_deleted ? (
                                                                <motion.span
                                                                    key="deleted"
                                                                    initial={{ opacity: 0, filter: 'blur(5px)' }}
                                                                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                                                                    transition={{ duration: 0.3 }}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                    This message was deleted
                                                                </motion.span>
                                                            ) : (
                                                                <motion.div
                                                                    key="content"
                                                                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    {msg.type === 'image' || msg.type === 'gif' ? (
                                                                        <div
                                                                            className="group/image relative cursor-pointer overflow-hidden rounded-lg mt-1"
                                                                            onClick={() => setPreviewImage(msg.content)}
                                                                        >
                                                                            <div className="w-32 h-32 md:w-40 md:h-40 bg-black/20">
                                                                                <img
                                                                                    src={msg.content}
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
                                                                            href={msg.content}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-3 p-3 bg-stone-900/50 rounded-lg hover:bg-stone-900 transition-colors border border-white/10"
                                                                        >
                                                                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                                                                                <FileText className="w-6 h-6" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-medium text-stone-200 truncate">{msg.file_name || 'Attachment'}</p>
                                                                                <p className="text-xs text-stone-500">{msg.file_size ? `${(msg.file_size / 1024).toFixed(1)} KB` : 'File'}</p>
                                                                            </div>
                                                                        </a>
                                                                    ) : msg.type === 'voice' ? (
                                                                        <VoiceMessagePlayer
                                                                            audioUrl={msg.content}
                                                                            duration={60} // Default, will be replaced with actual
                                                                            waveform={[]}
                                                                            isMe={isMe}
                                                                        />
                                                                    ) : (
                                                                        <p className="whitespace-pre-wrap leading-relaxed">
                                                                            <Linkify text={msg.content} />
                                                                        </p>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    {/* Minimal Action Bar (Side of Message) */}
                                                    {!msg.is_deleted && (
                                                        <div className={`opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex items-center gap-1`}>
                                                            {/* Reaction */}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-1.5 text-stone-500 hover:text-yellow-400 transition-colors" title="Add Reaction">
                                                                        <Smile className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top">
                                                                    <EmojiPicker
                                                                        onEmojiClick={(e) => addReaction(msg.id, e.emoji)}
                                                                        width={300}
                                                                        height={350}
                                                                        theme={Theme.DARK}
                                                                        lazyLoadEmojis={true}
                                                                    />
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>

                                                            {/* Reply */}
                                                            <button
                                                                className="p-1.5 text-stone-500 hover:text-white transition-colors"
                                                                title="Reply"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></svg>
                                                            </button>

                                                            <button
                                                                onClick={() => handleCopyText(msg.content)}
                                                                className="p-1.5 text-stone-500 hover:text-white transition-colors"
                                                                title="Copy Text"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>

                                                            {/* Pin */}
                                                            <button
                                                                onClick={() => handlePinMessage(msg.id)}
                                                                className="p-1.5 text-stone-500 hover:text-orange-500 transition-colors"
                                                                title="Pin Message"
                                                            >
                                                                <Pin className="w-3.5 h-3.5" />
                                                            </button>

                                                            {/* Delete (Only Me) */}
                                                            {isMe && (
                                                                <button
                                                                    onClick={() => deleteMessage(msg.id)}
                                                                    className="p-1.5 text-stone-500 hover:text-red-400 transition-colors group/trash"
                                                                    title="Delete Message"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 group-hover/trash:animate-bounce" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Reactions Display */}
                                                {msg.dm_reactions && msg.dm_reactions.length > 0 && (
                                                    <div className={`mt-1 flex flex-wrap gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        {(Object.entries(msg.dm_reactions.reduce((acc: Record<string, number>, r: { emoji: string; user_id: string }) => {
                                                            acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                                            return acc
                                                        }, {} as Record<string, number>)) as [string, number][]).map(([emoji, count]) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => addReaction(msg.id, emoji)}
                                                                className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors flex items-center gap-1
                                                                    ${msg.dm_reactions?.some((r: { emoji: string; user_id: string }) => r.user_id === currentUserId && r.emoji === emoji)
                                                                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30'
                                                                        : 'bg-stone-800 border-white/5 text-stone-300 hover:bg-stone-700'}`}
                                                            >
                                                                <span>{emoji}</span>
                                                                <span className="opacity-70 font-medium">{count}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Drag & Drop Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-orange-500 m-4 rounded-xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Drop files to upload</h3>
                        <p className="text-stone-400">Images and files supported</p>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="px-6 pb-6 pt-2 relative w-full max-w-4xl mx-auto shrink-0">
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

                <div className="bg-stone-900/90 backdrop-blur-xl rounded-full px-2 py-2 flex items-center gap-2 border border-white/10 shadow-2xl focus-within:border-orange-500/50 transition-all focus-within:ring-1 focus-within:ring-orange-500/20">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
                                title="Add files"
                            >
                                <PlusCircle className="w-6 h-6" />
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

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        multiple
                    />

                    <form onSubmit={handleSend} className="flex-1">
                        <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Message @${activeConversation.otherUser.username}`}
                            className="w-full bg-transparent border-none text-stone-200 placeholder:text-stone-500 focus:outline-none px-2 text-sm"
                        />
                    </form>

                    <div className="flex items-center gap-1 pr-2">
                        {/* Gift Button - Placeholder */}
                        <button
                            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Send a Gift (Coming Soon)"
                            onClick={() => toast('Gifting coming soon!', { icon: '🎁' })}
                        >
                            <Gift className="w-5 h-5" />
                        </button>

                        {/* GIF Button - Moved to 2nd position (Sticker icon) */}
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

                        {/* Emoji Button */}
                        <button
                            onClick={() => {
                                setShowEmojiPicker(!showEmojiPicker)
                                setShowGifPicker(false)
                            }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5 ${showEmojiPicker ? 'text-orange-500' : 'text-stone-400 hover:text-white'}`}
                            title="Send an Emoji"
                        >
                            <Smile className="w-5 h-5" />
                        </button>

                        {/* Voice Message Button - Shows recording state */}
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                disabled={isUploadingVoice}
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5 text-stone-400 hover:text-white disabled:opacity-50"
                                title="Record Voice Message"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-xs font-mono text-white">
                                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                                </span>
                                <button
                                    onClick={stopRecording}
                                    className="w-7 h-7 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
                                    title="Send"
                                >
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={cancelRecording}
                                    className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
                                    title="Cancel"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Uploading Voice Indicator */}
                {isUploadingVoice && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-stone-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending voice message...</span>
                    </div>
                )}
            </div>
        </div>
    )
}
