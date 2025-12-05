'use client'

import { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import type { Message } from '@/types/chat.types'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  otherUserTyping: boolean
}

export function MessageList({ messages, currentUserId, otherUserTyping }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_id === currentUserId
    const isFile = message.type === 'image' || message.type === 'file'

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-6 group animate-in fade-in slide-in-from-bottom-2 duration-300`}
      >
        <div className={`flex max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-3 items-end`}>
          {!isOwn && (
            <Avatar className="w-8 h-8 border border-white/10 shadow-lg">
              <AvatarFallback className="bg-stone-800 text-stone-400 text-xs">
                {message.sender_id.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            <div
              className={`relative rounded-2xl px-5 py-3 shadow-sm backdrop-blur-sm border ${isOwn
                ? 'bg-orange-600/90 text-white border-orange-500/50 rounded-br-none'
                : 'bg-[#2C2927]/80 text-stone-200 border-white/5 rounded-bl-none'
                }`}
            >
              {isFile ? (
                <div className="space-y-2">
                  {message.type === 'image' && message.file_url && (
                    <img
                      src={message.file_url}
                      alt={message.file_name || 'Image'}
                      className="max-w-xs rounded-xl border border-white/10"
                      loading="lazy"
                    />
                  )}
                  {message.file_name && (
                    <div className="text-sm flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg">
                      <span className="text-lg">📎</span>
                      <a
                        href={message.file_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline truncate max-w-[150px]"
                      >
                        {message.file_name}
                      </a>
                    </div>
                  )}
                  {message.content && (
                    <p className="text-sm mt-1">{message.content}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
              {message.is_flagged && (
                <Badge variant="destructive" className="mt-2 text-[10px] uppercase tracking-wider">
                  Flagged
                </Badge>
              )}
            </div>
            <span className={`text-[10px] text-stone-500 mt-1.5 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-2xl">🙏</span>
          </div>
          <div className="text-stone-400">
            <p className="text-lg font-bold text-stone-300">Namaste!</p>
            <p className="text-sm">Start the conversation with a greeting.</p>
          </div>
        </div>
      ) : (
        messages.map(renderMessage)
      )}

      {otherUserTyping && (
        <div className="flex justify-start animate-in fade-in duration-300">
          <div className="flex items-center gap-2 bg-[#2C2927]/50 border border-white/5 rounded-full px-4 py-2.5 ml-11">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
            </div>
            <span className="text-xs text-stone-500 font-medium">typing...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

