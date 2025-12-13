import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export type DmConversation = {
    id: string
    otherUser: {
        id: string
        username: string
        avatar_url: string | null
        full_name: string | null
    }
    lastMessageAt: string | null
    lastMessagePreview: string | null
    updatedAt: string
    unreadCount?: number
}

export type DmMessage = {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    type: 'text' | 'image' | 'file' | 'system' | 'gif'
    is_read: boolean
    is_deleted?: boolean
    created_at: string
    file_url?: string | null
    file_name?: string | null
    file_size?: number | null
    file_type?: string | null
    dm_reactions?: { emoji: string, user_id: string }[]
}

export function useDm() {
    const [conversations, setConversations] = useState<DmConversation[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<DmMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isMoreLoading, setIsMoreLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // Fetch current user
    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser()
            if (data.user) setCurrentUserId(data.user.id)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user?.id || null)
        })

        return () => subscription.unsubscribe()
    }, [])


    // Fetch Conversations with deduplication using ref to avoid infinite loops
    const isFetchingConversationsRef = useRef(false)
    const fetchConversations = useCallback(async () => {
        // Prevent duplicate requests
        if (isFetchingConversationsRef.current) {
            return
        }

        isFetchingConversationsRef.current = true
        try {
            const res = await fetch('/api/dm/conversations', {
                credentials: 'include'
            })
            const data = await res.json()
            if (data.conversations) {
                setConversations(data.conversations)
            }
        } catch (error) {
            console.error('Error fetching conversations:', error)
        } finally {
            isFetchingConversationsRef.current = false
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    // Fetch Messages when active conversation changes
    useEffect(() => {
        if (!activeConversationId) return

        const fetchMessages = async () => {
            setIsLoading(true)
            setMessages([]) // Reset on new convo
            setHasMore(true)
            try {
                const res = await fetch(`/api/dm/conversations/${activeConversationId}/messages?limit=50`, {
                    credentials: 'include'
                })

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`)
                }

                const data = await res.json()
                if (data.messages) {
                    setMessages(data.messages)
                    setHasMore(data.messages.length === 50)
                    // Mark as read
                    await fetch(`/api/dm/conversations/${activeConversationId}/read`, {
                        method: 'POST',
                        credentials: 'include'
                    })
                }
            } catch (error) {
                console.error('Error fetching messages:', error)
                toast.error('Failed to load messages')
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()

        // Realtime Subscription for Messages
        const channel = supabase
            .channel(`dm:${activeConversationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for INSERT and UPDATE
                    schema: 'public',
                    table: 'dm_messages',
                    filter: `conversation_id=eq.${activeConversationId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMessage = payload.new as DmMessage

                        // Prevent duplicate messages from own actions (handled optimistically)
                        if (newMessage.sender_id === currentUserId) return

                        setMessages(prev => {
                            // Deduplicate just in case
                            if (prev.some(m => m.id === newMessage.id)) return prev
                            return [...prev, newMessage]
                        })

                        // If I'm viewing it, mark as read immediately (optimistic/lazy)
                        if (document.hasFocus()) {
                            fetch(`/api/dm/conversations/${activeConversationId}/read`, { method: 'POST' })
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMessage = payload.new as DmMessage
                        setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeConversationId, currentUserId])

    const loadMoreMessages = async () => {
        if (!activeConversationId || !hasMore || isMoreLoading || messages.length === 0) return

        setIsMoreLoading(true)
        const oldestMessage = messages[0] // Since messages are ordered chronologically [oldest, ..., newest] (?)
        // Wait, backend returns reversed: { messages: messages.reverse() }
        // So index 0 is the oldest message.

        try {
            const res = await fetch(`/api/dm/conversations/${activeConversationId}/messages?limit=50&before=${oldestMessage.created_at}`, {
                credentials: 'include'
            })

            if (!res.ok) throw new Error('Failed to load more')

            const data = await res.json()
            if (data.messages && data.messages.length > 0) {
                // Prepend older messages
                setMessages(prev => [...data.messages, ...prev])
                setHasMore(data.messages.length === 50)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error loading older messages:', error)
            toast.error('Could not load history')
        } finally {
            setIsMoreLoading(false)
        }
    }

    // Realtime Subscription for Conversation List (Updates & New Convos)
    useEffect(() => {
        if (!currentUserId) return

        // Debounce to prevent spam
        let debounceTimer: NodeJS.Timeout
        const debouncedFetch = () => {
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => fetchConversations(), 500)
        }

        const channel = supabase
            .channel(`dm_list:${currentUserId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT or UPDATE
                    schema: 'public',
                    table: 'dm_conversations',
                    filter: `user1_id=eq.${currentUserId}`
                },
                debouncedFetch
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dm_conversations',
                    filter: `user2_id=eq.${currentUserId}`
                },
                debouncedFetch
            )
            .subscribe()

        return () => {
            clearTimeout(debounceTimer)
            supabase.removeChannel(channel)
        }
    }, [currentUserId]) // Removed fetchConversations from deps

    const sendMessage = async (
        content: string,
        type: 'text' | 'image' | 'file' | 'gif' = 'text',
        metadata?: { fileName?: string, fileSize?: number, fileType?: string }
    ) => {
        if (!activeConversationId || !content.trim() || !currentUserId) return

        // Optimistic Update
        const tempId = Math.random().toString()
        const optimisticMessage: DmMessage = {
            id: tempId,
            conversation_id: activeConversationId,
            sender_id: currentUserId!,
            content,
            type,
            is_read: false,
            created_at: new Date().toISOString(),
            file_url: type === 'image' || type === 'file' ? content : undefined, // Assuming content is URL for files
            file_name: metadata?.fileName,
            file_size: metadata?.fileSize,
            file_type: metadata?.fileType
        }
        setMessages(prev => [...prev, optimisticMessage])

        try {
            const res = await fetch(`/api/dm/conversations/${activeConversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    type,
                    file_url: type === 'image' || type === 'file' ? content : undefined,
                    file_name: metadata?.fileName,
                    file_size: metadata?.fileSize,
                    file_type: metadata?.fileType
                })
            })

            if (!res.ok) throw new Error('Failed to send')

            const data = await res.json()
            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m.id === tempId ? data.message : m))

            // Update conversation list preview
            fetchConversations()

        } catch (error) {
            console.error('Send error:', error)
            toast.error('Failed to send message')
            setMessages(prev => prev.filter(m => m.id !== tempId))
        }
    }

    const uploadFile = async (file: File) => {
        if (!activeConversationId || !currentUserId) return

        // 1. Immediate Optimistic UI
        const tempId = `temp-upload-${Date.now()}`
        const blobUrl = URL.createObjectURL(file)
        const type = file.type.startsWith('image/') ? 'image' : 'file'

        const optimisticMessage: DmMessage = {
            id: tempId,
            conversation_id: activeConversationId,
            sender_id: currentUserId,
            content: blobUrl, // Show local blob immediately
            type,
            is_read: false,
            created_at: new Date().toISOString(),
            file_url: blobUrl,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type
        }

        setMessages(prev => [...prev, optimisticMessage])
        const toastId = toast.loading('Uploading...')

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${activeConversationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('dm_attachments')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('dm_attachments')
                .getPublicUrl(fileName)

            // 2. Remove temp message before sending real one to avoid duplication/flicker
            setMessages(prev => prev.filter(m => m.id !== tempId))
            URL.revokeObjectURL(blobUrl) // Cleanup memory

            // 3. Send real message (this will add its own optimistic update with the real URL)
            await sendMessage(publicUrl, type, {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            })

            toast.success('Sent!', { id: toastId })
        } catch (error) {
            console.error('Upload error:', error)
            toast.error((error as Error).message || 'Failed to upload', { id: toastId })
            setMessages(prev => prev.filter(m => m.id !== tempId))
        }
    }

    const deleteMessage = async (messageId: string) => {
        // Optimistic update
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true } : m))

        try {
            const res = await fetch(`/api/dm/messages/${messageId}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete message')
            // Revert optimistic update (requires fetching or storing previous state, but for now we just warn)
        }
    }

    const startDm = async (buddyId: string) => {
        try {
            const res = await fetch('/api/dm/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buddyId })
            })

            const data = await res.json()

            if (data.error) {
                toast.error(data.error)
                return null
            }

            // Force refresh conversations to ensure the new one exists in the list
            await fetchConversations()
            setActiveConversationId(data.conversationId)
            return data.conversationId
        } catch (error) {
            console.error('Start DM error:', error)
            toast.error('Failed to start conversation')
            return null
        }
    }

    const deleteConversation = async (conversationId: string) => {
        // Optimistic update
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (activeConversationId === conversationId) {
            setActiveConversationId(null)
            setMessages([])
        }

        try {
            const res = await fetch(`/api/dm/conversations/${conversationId}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete')
            toast.success('Conversation deleted')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete conversation')
            fetchConversations() // Revert
        }
    }

    const addReaction = async (messageId: string, emoji: string) => {
        if (!currentUserId) return

        // 1. Optimistic Update
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const existing = msg.dm_reactions || []
                if (existing.some(r => r.user_id === currentUserId && r.emoji === emoji)) return msg
                return {
                    ...msg,
                    dm_reactions: [...existing, { emoji, user_id: currentUserId }]
                }
            }
            return msg
        }))

        try {
            const { error } = await supabase
                .from('dm_reactions')
                .insert({
                    message_id: messageId,
                    user_id: currentUserId,
                    emoji
                })

            if (error) throw error
        } catch (error) {
            console.error('Reaction error:', error)
            toast.error('Failed to add reaction')
        }
    }

    return {
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        isLoading,
        isMoreLoading,
        hasMore,
        loadMoreMessages,
        sendMessage,
        uploadFile,
        deleteMessage,
        deleteConversation,
        archiveConversation: deleteConversation,
        startDm,
        addReaction,
        currentUserId
    }
}
