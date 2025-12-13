'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

type ReadReceipt = {
    messageId: string
    userId: string
    readAt: string
}

export function useReadReceipts(roomId: string, currentUserId: string) {
    const [receipts, setReceipts] = useState<Map<string, ReadReceipt[]>>(new Map())

    useEffect(() => {
        if (!roomId) return

        // Fetch existing read receipts
        fetchReceipts()

        // Subscribe to new read receipts
        const channel = supabase
            .channel(`read_receipts:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'message_read_receipts',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    const receipt = payload.new as ReadReceipt
                    setReceipts(prev => {
                        const updated = new Map(prev)
                        const messageReceipts = updated.get(receipt.messageId) || []
                        updated.set(receipt.messageId, [...messageReceipts, receipt])
                        return updated
                    })
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [roomId])

    const fetchReceipts = async () => {
        try {
            const { data, error } = await supabase
                .from('message_read_receipts')
                .select('*')
                .eq('room_id', roomId)

            if (error) throw error

            const receiptMap = new Map<string, ReadReceipt[]>()
            data?.forEach(receipt => {
                const messageReceipts = receiptMap.get(receipt.message_id) || []
                receiptMap.set(receipt.message_id, [...messageReceipts, receipt])
            })

            setReceipts(receiptMap)
        } catch (error) {
            console.error('Error fetching read receipts:', error)
        }
    }

    const markAsRead = async (messageId: string) => {
        try {
            // Check if already read
            const existing = receipts.get(messageId)?.find(r => r.userId === currentUserId)
            if (existing) return

            const { error } = await supabase
                .from('message_read_receipts')
                .insert({
                    message_id: messageId,
                    user_id: currentUserId,
                    room_id: roomId,
                    read_at: new Date().toISOString()
                })

            if (error) throw error
        } catch (error) {
            console.error('Error marking message as read:', error)
        }
    }

    const getReadCount = (messageId: string): number => {
        return receipts.get(messageId)?.length || 0
    }

    const isReadBy = (messageId: string, userId: string): boolean => {
        return receipts.get(messageId)?.some(r => r.userId === userId) || false
    }

    return {
        receipts,
        markAsRead,
        getReadCount,
        isReadBy
    }
}

// Read Receipt Indicator Component
export function ReadReceiptBadge({ count }: { count: number }) {
    if (count === 0) return null

    return (
        <div className="flex items-center gap-1 text-xs text-blue-400" >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" >
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
            {count > 1 && <span>{count} </span>}
        </div>
    )
}
