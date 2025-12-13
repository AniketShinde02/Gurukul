'use client'

import React, { useEffect, useRef } from 'react'
import { RoomMessage, useMessages } from '@/hooks/useMessages'
import { Loader2, Reply, Copy, Edit2, Trash2, Image as ImageIcon, File as FileIcon, Pin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Linkify } from '@/components/ui/linkify'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

// Row component for react-window
const MessageRow = React.memo(({ index, style, data }: {
    index: number,
    style: React.CSSProperties,
    data: {
        messages: RoomMessage[],
        currentUserId: string | null,
        setSize: (index: number, size: number) => void,
        onReply: (msg: RoomMessage) => void,
        onEdit: (msg: RoomMessage) => void,
        onDelete: (msgId: string) => void,
        onImageClick: (url: string) => void,
        onPin?: (msgId: string) => void
    }
}) => {
    const { messages, currentUserId, setSize, onReply, onEdit, onDelete, onImageClick, onPin } = data
    const messageIndex = messages.length - 1 - index
    const msg = messages[messageIndex]

    if (!msg) return null

    const isMe = msg.sender_id === currentUserId
    // Optimistic messages have temp IDs
    const isOptimistic = msg.id.startsWith('temp-')

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Text copied')
    }

    return (
        <div style={style} className="px-4 py-1">
            <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group relative py-1`}>
                <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                    {/* Avatar */}
                    <Avatar className="w-8 h-8 mb-1 border border-white/10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={msg.sender?.avatar_url || undefined} />
                        <AvatarFallback className="bg-stone-800 text-stone-300 text-xs">
                            {msg.sender?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                    </Avatar>

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0`}>
                        {/* Header */}
                        <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="font-bold text-stone-200 text-xs hover:underline cursor-pointer">
                                {msg.sender?.full_name || msg.sender?.username || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-stone-500">
                                {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}
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
                                } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}>

                                {msg.type === 'image' || msg.type === 'gif' ? (
                                    <div
                                        className="group/image relative cursor-pointer overflow-hidden rounded-lg mt-1"
                                        onClick={() => onImageClick(msg.file_url || msg.content)}
                                    >
                                        <div className="max-w-[300px] md:max-w-[400px]">
                                            <img
                                                src={msg.file_url || msg.content}
                                                alt="Content"
                                                className="w-full h-auto object-contain rounded-lg transition-transform duration-300 group-hover/image:scale-105"
                                                loading="lazy"
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
                                        onClick={(e) => e.stopPropagation()}
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
                                    <div className="whitespace-pre-wrap leading-relaxed min-w-[20px]">
                                        <Linkify text={msg.content} />
                                        {msg.is_edited && <span className="text-[10px] opacity-70 ml-1">(edited)</span>}
                                        {isOptimistic && <span className="text-[10px] opacity-70 ml-1 italic">(sending...)</span>}
                                    </div>
                                )}
                            </div>

                            {/* Action Bar - Only show if not optimistic */}
                            {!isOptimistic && (
                                <div className={`opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex items-center gap-1 bg-stone-900/80 rounded-lg p-1 border border-white/5 backdrop-blur-sm`}>
                                    <button
                                        onClick={() => onReply(msg)}
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

                                    {onPin && (
                                        <button
                                            onClick={() => onPin(msg.id)}
                                            className="p-1.5 text-stone-400 hover:text-orange-500 hover:bg-orange-500/10 rounded transition-colors"
                                            title="Pin Message"
                                        >
                                            <Pin className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {msg.type === 'text' && isMe && (
                                        <button
                                            onClick={() => onEdit(msg)}
                                            className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {isMe && (
                                        <button
                                            onClick={() => onDelete(msg.id)}
                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}, (prev, next) => {
    return prev.index === next.index &&
        prev.style === next.style &&
        prev.data.messages === next.data.messages &&
        prev.data.currentUserId === next.data.currentUserId
})
MessageRow.displayName = 'MessageRow'


export function MessageList({
    roomId,
    currentUserId,
    onReply,
    onEdit,
    onDelete,
    onImageClick,
    onPin
}: {
    roomId: string,
    currentUserId: string | null,
    onReply: (msg: RoomMessage) => void,
    onEdit: (msg: RoomMessage) => void,
    onDelete: (msgId: string) => void,
    onImageClick: (url: string) => void,
    onPin?: (msgId: string) => void
}) {
    const { messages, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(roomId)
    const listRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new messages
    const lastMessageCount = useRef(messages.length)

    useEffect(() => {
        if (messages.length > lastMessageCount.current && listRef.current) {
            listRef.current.scrollTop = 0
        }
        lastMessageCount.current = messages.length
    }, [messages.length])

    // Infinite scroll
    useEffect(() => {
        const div = listRef.current
        if (!div) return

        const handleScroll = () => {
            const scrolledToTop = div.scrollHeight - Math.abs(div.scrollTop) - div.clientHeight < 100
            if (scrolledToTop && hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        }

        div.addEventListener('scroll', handleScroll)
        return () => div.removeEventListener('scroll', handleScroll)
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        )
    }

    return (
        <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden" ref={listRef}>
            <div className="flex flex-col-reverse">
                {messages.map((msg, index) => (
                    <MessageRow
                        key={msg.id}
                        index={messages.length - 1 - index}
                        style={{}}
                        data={{ messages, currentUserId, setSize: () => { }, onReply, onEdit, onDelete, onImageClick, onPin }}
                    />
                ))}
                {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                )}
            </div>
        </div>
    )
}

