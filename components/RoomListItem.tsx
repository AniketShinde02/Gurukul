'use client'

import React from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Room = {
    id: string
    name: string
    icon_url?: string
}

export function RoomListItem({ room, isActive, onContextMenu }: { room: Room, isActive: boolean, onContextMenu: (e: React.MouseEvent, id: string) => void }) {
    const queryClient = useQueryClient()

    const prefetchRoom = () => {
        // Prefetch messages
        queryClient.prefetchInfiniteQuery({
            queryKey: ['messages', room.id],
            queryFn: async ({ pageParam = 0 }) => {
                const { data } = await supabase
                    .from('room_messages')
                    .select('*, sender:profiles!sender_id(*)')
                    .eq('room_id', room.id)
                    .order('created_at', { ascending: false })
                    .range(0, 49) // Prefetch first 50
                return data || []
            },
            initialPageParam: 0
        })

        // Prefetch room details
        queryClient.prefetchQuery({
            queryKey: ['room', room.id],
            queryFn: async () => {
                const { data } = await supabase.from('study_rooms').select('*').eq('id', room.id).single()
                return data
            }
        })
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative group">
                        {isActive && (
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
                        )}
                        <Link
                            href={`/sangha/rooms/${room.id}`}
                            onContextMenu={(e) => onContextMenu(e, room.id)}
                            onMouseEnter={prefetchRoom} // Magic happens here
                        >
                            <div className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden ${isActive ? 'rounded-[16px] ring-2 ring-offset-2 ring-offset-stone-900 ring-indigo-500' : 'bg-stone-800 hover:bg-indigo-500'}`}>
                                {room.icon_url ? (
                                    <img
                                        src={room.icon_url}
                                        alt={room.name}
                                        className="w-full h-full object-cover select-none pointer-events-none"
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-400 group-hover:text-white font-bold text-sm">
                                        {room.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{room.name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
