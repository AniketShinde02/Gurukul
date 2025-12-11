'use client'

import { useState, useRef, useEffect } from 'react'
import { useDm } from '@/hooks/useDm'
import { useSound } from '@/hooks/useSound'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Send, Search, MoreVertical, Phone, Video, Info, MessageSquare, Trash2, Smile, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import EmojiPicker, { Theme } from 'emoji-picker-react'

export function DmInterface() {
    const {
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        isLoading,
        sendMessage,
        deleteMessage,
        archiveConversation,
        currentUserId
    } = useDm()

    const { play } = useSound()
    const [newMessage, setNewMessage] = useState('')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const prevMessagesLengthRef = useRef(0)

    // Auto-scroll to bottom & play receive sound
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
        // Play receive sound only when new message arrives from other user
        if (messages.length > prevMessagesLengthRef.current) {
            const latestMessage = messages[messages.length - 1]
            if (latestMessage && latestMessage.sender_id !== currentUserId) {
                play('MESSAGE_RECEIV')
            }
        }
        prevMessagesLengthRef.current = messages.length
    }, [messages, currentUserId, play])

    // Close emoji picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const activeConversation = conversations.find(c => c.id === activeConversationId)

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return
        sendMessage(newMessage)
        play('MESSAGE_SEND')
        setNewMessage('')
        setShowEmojiPicker(false)
    }

    const onEmojiClick = (emojiObject: any) => {
        setNewMessage(prev => prev + emojiObject.emoji)
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] bg-black/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">

            {/* Left Sidebar: Conversation List */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-black/20">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-stone-500 focus:bg-white/10"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {conversations.length === 0 ? (
                            <div className="text-center text-stone-500 py-8 text-sm">
                                No conversations yet.<br />Connect with buddies to start chatting!
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div key={conv.id} className="relative group">
                                    <button
                                        onClick={() => setActiveConversationId(conv.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeConversationId === conv.id
                                            ? 'bg-orange-500/10 border border-orange-500/20'
                                            : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <Avatar className="w-10 h-10 border border-white/10">
                                            <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                                            <AvatarFallback className="bg-stone-800 text-stone-400">
                                                {conv.otherUser.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <span className={`font-medium truncate ${activeConversationId === conv.id ? 'text-orange-400' : 'text-white'}`}>
                                                    {conv.otherUser.full_name || conv.otherUser.username}
                                                </span>
                                                {conv.lastMessageAt && (
                                                    <span className="text-[10px] text-stone-500 shrink-0 ml-2">
                                                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-stone-400 truncate">
                                                {conv.lastMessagePreview || 'Start a conversation'}
                                            </p>
                                        </div>
                                    </button>

                                    {/* Conversation Actions */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white hover:bg-black/50 rounded-full">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-stone-900 border-white/10 text-stone-200">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        archiveConversation(conv.id)
                                                    }}
                                                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Archive Chat
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Panel: Chat Area */}
            <div className="flex-1 flex flex-col bg-black/10">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/5">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 border border-white/10">
                                    <AvatarImage src={activeConversation.otherUser.avatar_url || undefined} />
                                    <AvatarFallback className="bg-stone-800 text-stone-400">
                                        {activeConversation.otherUser.username[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-white text-sm">
                                        {activeConversation.otherUser.full_name || activeConversation.otherUser.username}
                                    </h3>
                                    <span className="text-[10px] text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Online
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-white hover:bg-white/5">
                                    <Phone className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-white hover:bg-white/5">
                                    <Video className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-stone-400 hover:text-white hover:bg-white/5">
                                    <Info className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setActiveConversationId(null)}
                                    className="text-stone-400 hover:text-white hover:bg-white/5 md:hidden"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
                        >
                            {isLoading && messages.length === 0 ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === currentUserId
                                    const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id)

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 group ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!isMe && (
                                                <div className="w-8 flex-shrink-0">
                                                    {showAvatar && (
                                                        <Avatar className="w-8 h-8 border border-white/10">
                                                            <AvatarImage src={activeConversation.otherUser.avatar_url || undefined} />
                                                            <AvatarFallback className="bg-stone-800 text-stone-400 text-xs">
                                                                {activeConversation.otherUser.username[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div
                                                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm relative transition-all duration-300 ${msg.is_deleted
                                                        ? 'bg-white/5 text-stone-500 italic border border-white/5 animate-shake'
                                                        : isMe
                                                            ? 'bg-orange-600 text-white rounded-tr-none'
                                                            : 'bg-white/10 text-stone-200 rounded-tl-none'
                                                        }`}
                                                >
                                                    {msg.is_deleted ? (
                                                        <span className="flex items-center gap-2">
                                                            <Trash2 className="w-3 h-3" />
                                                            This message was deleted
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {msg.content}
                                                            <div className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Message Actions (Only for own, non-deleted messages) */}
                                                {isMe && !msg.is_deleted && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-stone-500 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                                            >
                                                                <MoreVertical className="w-3 h-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align={isMe ? "end" : "start"} className="bg-stone-900 border-white/10 text-stone-200">
                                                            <DropdownMenuItem
                                                                onClick={() => deleteMessage(msg.id)}
                                                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/5 bg-white/5 relative">
                            {showEmojiPicker && (
                                <div ref={emojiPickerRef} className="absolute bottom-20 left-4 z-50">
                                    <EmojiPicker
                                        theme={Theme.DARK}
                                        onEmojiClick={onEmojiClick}
                                        width={350}
                                        height={400}
                                    />
                                </div>
                            )}
                            <form onSubmit={handleSend} className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`text-stone-400 hover:text-white hover:bg-white/5 ${showEmojiPicker ? 'text-orange-500 bg-white/5' : ''}`}
                                >
                                    <Smile className="w-5 h-5" />
                                </Button>
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-black/20 border-white/10 text-white placeholder:text-stone-500 focus:bg-black/40"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-500">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 opacity-50" />
                        </div>
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    )
}
