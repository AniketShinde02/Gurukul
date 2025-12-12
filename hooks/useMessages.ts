import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export type RoomMessage = {
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

const ROWS_PER_PAGE = 50

export function useMessages(roomId: string) {
    const queryClient = useQueryClient()

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['messages', roomId],
        queryFn: async ({ pageParam = null }) => {
            let query = supabase
                .from('room_messages')
                .select(`
          *,
          sender:profiles!sender_id(username, full_name, avatar_url),
          reply_to:room_messages!parent_id(content, sender:profiles!sender_id(username))
        `)
                .eq('room_id', roomId)
                .order('created_at', { ascending: false }) // Fetch latest first for chat
                .limit(ROWS_PER_PAGE)

            if (pageParam) {
                query = query.lt('created_at', pageParam as string)
            }

            const { data, error } = await query

            if (error) throw error
            return data as RoomMessage[]
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage: RoomMessage[]) => {
            if (!lastPage || lastPage.length < ROWS_PER_PAGE) return undefined
            return lastPage[lastPage.length - 1].created_at
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_messages',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Need to fetch the full message with relations
                        const { data: newMessage } = await supabase
                            .from('room_messages')
                            .select(`
                *,
                sender:profiles!sender_id(username, full_name, avatar_url),
                reply_to:room_messages!parent_id(content, sender:profiles!sender_id(username))
              `)
                            .eq('id', payload.new.id)
                            .single()

                        if (newMessage) {
                            queryClient.setQueryData(['messages', roomId], (oldData: any) => {
                                if (!oldData) return oldData

                                // Add to the first page (which contains the newest messages)
                                const newPages = [...oldData.pages]
                                // Insert at the beginning of the first page because we fetched with order timestamp DESC
                                // So index 0 of page 0 is the NEWEST message.
                                newPages[0] = [newMessage, ...newPages[0]]

                                return {
                                    ...oldData,
                                    pages: newPages,
                                }
                            })
                        }
                    } else if (payload.eventType === 'DELETE') {
                        queryClient.setQueryData(['messages', roomId], (oldData: any) => {
                            if (!oldData) return oldData
                            const newPages = oldData.pages.map((page: RoomMessage[]) =>
                                page.filter(msg => msg.id !== payload.old.id)
                            )
                            return { ...oldData, pages: newPages }
                        })
                    } else if (payload.eventType === 'UPDATE') {
                        // Fetch updated data (lazy way to get relations if needed, or just patch fields)
                        // For simple content updates we can just patch
                        queryClient.setQueryData(['messages', roomId], (oldData: any) => {
                            if (!oldData) return oldData
                            const newPages = oldData.pages.map((page: RoomMessage[]) =>
                                page.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg)
                            )
                            return { ...oldData, pages: newPages }
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, queryClient])

    // Flatten messages for consumption
    // Data structure: [ [Newest, Older], [Older, Oldest] ]
    // We want to display them chronologically: Oldest -> Newest (top to bottom) or logic for virtual scroll
    // Virtual scroll usually expects a flat array.

    const messages = data?.pages.flatMap(page => page) || []

    // Since we fetched descending (Newest first), index 0 is newest.
    // messages = [Newest, Second Newest, ...]
    // We usually want to display this in a list that starts at bottom (index 0).

    return {
        messages,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading
    }
}
