'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

type TypingUser = {
    userId: string
    username: string
    timestamp: number
}

export function useTypingIndicator(roomId: string, currentUserId: string) {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!roomId) return

        // Subscribe to typing events via Realtime
        const channel = supabase
            .channel(`typing:${roomId}`)
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.userId === currentUserId) return // Ignore own typing

                setTypingUsers(prev => {
                    const existing = prev.find(u => u.userId === payload.userId)
                    if (existing) {
                        // Update timestamp
                        return prev.map(u =>
                            u.userId === payload.userId
                                ? { ...u, timestamp: Date.now() }
                                : u
                        )
                    } else {
                        // Add new typing user
                        return [...prev, {
                            userId: payload.userId,
                            username: payload.username,
                            timestamp: Date.now()
                        }]
                    }
                })
            })
            .subscribe()

        // Clean up stale typing indicators every 3 seconds
        const cleanupInterval = setInterval(() => {
            setTypingUsers(prev =>
                prev.filter(u => Date.now() - u.timestamp < 5000) // Remove after 5s
            )
        }, 3000)

        return () => {
            channel.unsubscribe()
            clearInterval(cleanupInterval)
        }
    }, [roomId, currentUserId])

    const startTyping = useCallback((username: string) => {
        // Clear existing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout)
        }

        // Broadcast typing event
        const channel = supabase.channel(`typing:${roomId}`)
        channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUserId, username }
        })

        // Auto-stop typing after 3 seconds
        const timeout = setTimeout(() => {
            stopTyping()
        }, 3000)
        setTypingTimeout(timeout)
    }, [roomId, currentUserId, typingTimeout])

    const stopTyping = useCallback(() => {
        if (typingTimeout) {
            clearTimeout(typingTimeout)
            setTypingTimeout(null)
        }
    }, [typingTimeout])

    return {
        typingUsers,
        startTyping,
        stopTyping
    }
}

// Typing Indicator Component
export function TypingIndicator({ typingUsers }: { typingUsers: TypingUser[] }) {
    if (typingUsers.length === 0) return null

    const names = typingUsers.map(u => u.username).slice(0, 3)
    const displayText =
        names.length === 1
            ? `${names[0]} is typing...`
            : names.length === 2
                ? `${names[0]} and ${names[1]} are typing...`
                : `${names[0]}, ${names[1]} and ${typingUsers.length - 2} others are typing...`

    return (
        <div className= "flex items-center gap-2 px-4 py-2 text-sm text-stone-500" >
        <div className="flex gap-1" >
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style = {{ animationDelay: '0ms' }
} />
    < span className = "w-2 h-2 bg-orange-500 rounded-full animate-bounce" style = {{ animationDelay: '150ms' }} />
        < span className = "w-2 h-2 bg-orange-500 rounded-full animate-bounce" style = {{ animationDelay: '300ms' }} />
            </div>
            < span > { displayText } </span>
            </div>
    )
}
