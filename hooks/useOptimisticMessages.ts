import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { RoomMessage } from './useMessages'
import { toast } from 'react-hot-toast'

type SendMessageVariables = {
    content: string
    userId: string
    type?: 'text' | 'image' | 'gif' | 'file' | 'voice'
    fileUrl?: string
    parentId?: string
    senderProfile?: { // Optional profile to make optimistic UI look good
        username: string
        full_name: string | null
        avatar_url: string | null
    }
}

export function useOptimisticMessages(roomId: string) {
    const queryClient = useQueryClient()

    const { mutate: sendMessage, isPending: isSending } = useMutation({
        mutationFn: async ({ content, userId, type = 'text', fileUrl, parentId }: SendMessageVariables) => {
            const { data, error } = await supabase
                .from('room_messages')
                .insert({
                    room_id: roomId,
                    sender_id: userId,
                    content,
                    type,
                    file_url: fileUrl,
                    parent_id: parentId
                })
                .select(`
            *,
            sender:profiles!sender_id(username, full_name, avatar_url),
            reply_to:room_messages!parent_id(content, sender:profiles!sender_id(username))
        `)
                .single()

            if (error) throw error
            return data as RoomMessage
        },
        onMutate: async (newMsg) => {
            await queryClient.cancelQueries({ queryKey: ['messages', roomId] })

            const previousMessages = queryClient.getQueryData(['messages', roomId])

            const tempId = 'temp-' + Date.now()

            queryClient.setQueryData(['messages', roomId], (old: any) => {
                if (!old) return old

                const optimisticMessage: RoomMessage = {
                    id: tempId,
                    content: newMsg.content,
                    created_at: new Date().toISOString(),
                    sender_id: newMsg.userId,
                    type: newMsg.type || 'text',
                    file_url: newMsg.fileUrl,
                    parent_id: newMsg.parentId,
                    sender: newMsg.senderProfile || {
                        username: 'You',
                        full_name: null,
                        avatar_url: null
                    },
                    reply_to: newMsg.parentId ? {
                        sender: { username: '...' },
                        content: 'Replying...'
                    } : undefined
                }

                const newPages = [...old.pages]
                // Add to front of first page (Newest messages)
                newPages[0] = [optimisticMessage, ...newPages[0]]

                return {
                    ...old,
                    pages: newPages,
                }
            })

            return { previousMessages, tempId }
        },
        onError: (err, newMsg, context) => {
            queryClient.setQueryData(['messages', roomId], context?.previousMessages)
            toast.error('Failed to send message')
        },
        onSuccess: (data, variables, context) => {
            // Replace the optimistic message (tempId) with the real one (data)
            // This prevents the "duplicate" flash when realtime arrives, 
            // and ensures Realtime listener sees the ID already exists.

            queryClient.setQueryData(['messages', roomId], (old: any) => {
                if (!old) return old

                const newPages = old.pages.map((page: RoomMessage[]) =>
                    page.map(msg => msg.id === context.tempId ? data : msg)
                )

                return {
                    ...old,
                    pages: newPages
                }
            })
        }
    })

    return { sendMessage, isSending }
}
