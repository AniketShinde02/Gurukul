'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Loader2, Users } from 'lucide-react'
import "@excalidraw/excalidraw/index.css"

// Excalidraw must be loaded dynamically as it uses window
const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    { ssr: false }
)

interface WhiteboardProps {
    roomId: string
    currentUser?: any
}

export function Whiteboard({ roomId, currentUser }: WhiteboardProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [activeUsers, setActiveUsers] = useState<number>(1)
    const excalidrawAPI = useRef<any>(null)
    const lastUpdateTime = useRef<number>(0)
    const isSyncing = useRef(false)

    // Load initial whiteboard data
    useEffect(() => {
        loadWhiteboardData()
    }, [roomId])

    // Subscribe to real-time changes using BROADCAST (free tier compatible)
    useEffect(() => {
        const channel = supabase
            .channel(`whiteboard-${roomId}`)
            .on('broadcast', { event: 'whiteboard-update' }, (payload) => {
                handleRemoteUpdate(payload.payload)
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                setActiveUsers(Object.keys(state).length)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: currentUser?.id,
                        username: currentUser?.username,
                        online_at: new Date().toISOString()
                    })
                }
            })

        return () => {
            channel.unsubscribe()
        }
    }, [roomId, currentUser])

    const loadWhiteboardData = async () => {
        try {
            setIsLoading(true)

            const { data, error } = await supabase
                .from('whiteboard_data')
                .select('*')
                .eq('room_id', roomId)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data && excalidrawAPI.current) {
                excalidrawAPI.current.updateScene({
                    elements: data.elements || [],
                    appState: data.app_state || {}
                })
                lastUpdateTime.current = new Date(data.updated_at).getTime()
            } else if (!data) {
                await supabase
                    .from('whiteboard_data')
                    .insert({
                        room_id: roomId,
                        elements: [],
                        app_state: { viewBackgroundColor: "#0c0a09" },
                        updated_by: currentUser?.id
                    })
            }
        } catch (error: any) {
            console.error('Error loading whiteboard:', error)
            toast.error('Failed to load whiteboard')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoteUpdate = (data: any) => {
        if (isSyncing.current) return

        const remoteTime = data.timestamp || 0
        if (remoteTime <= lastUpdateTime.current) return

        if (excalidrawAPI.current && data.elements) {
            excalidrawAPI.current.updateScene({
                elements: data.elements,
                appState: data.app_state || {}
            })
            lastUpdateTime.current = remoteTime
        }
    }

    const handleChange = useCallback(
        async (elements: readonly any[], appState: any) => {
            const now = Date.now()
            if (now - lastUpdateTime.current < 200) return

            try {
                isSyncing.current = true
                lastUpdateTime.current = now

                // Save to database
                const { error: dbError } = await supabase
                    .from('whiteboard_data')
                    .update({
                        elements: elements as any,
                        app_state: {
                            viewBackgroundColor: appState.viewBackgroundColor || "#0c0a09",
                            zoom: appState.zoom,
                            scrollX: appState.scrollX,
                            scrollY: appState.scrollY
                        },
                        updated_by: currentUser?.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('room_id', roomId)

                if (dbError) throw dbError

                // Broadcast to other users
                const channel = supabase.channel(`whiteboard-${roomId}`)
                await channel.send({
                    type: 'broadcast',
                    event: 'whiteboard-update',
                    payload: {
                        elements: elements,
                        app_state: {
                            viewBackgroundColor: appState.viewBackgroundColor || "#0c0a09",
                            zoom: appState.zoom,
                            scrollX: appState.scrollX,
                            scrollY: appState.scrollY
                        },
                        timestamp: now,
                        user_id: currentUser?.id
                    }
                })
            } catch (error: any) {
                console.error('Sync error:', error)
            } finally {
                setTimeout(() => {
                    isSyncing.current = false
                }, 100)
            }
        },
        [roomId, currentUser]
    )

    return (
        <div className="w-full h-full relative bg-stone-950">
            {/* Active Users Indicator */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-stone-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-white font-medium">{activeUsers}</span>
                <span className="text-xs text-stone-400">active</span>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        <p className="text-sm text-stone-400">Loading whiteboard...</p>
                    </div>
                </div>
            )}

            {/* Excalidraw Canvas */}
            <Excalidraw
                excalidrawAPI={(api) => {
                    excalidrawAPI.current = api
                }}
                theme="dark"
                initialData={{
                    appState: {
                        viewBackgroundColor: "#0c0a09",
                        currentItemFontFamily: 1
                    }
                }}
                onChange={handleChange}
                UIOptions={{
                    canvasActions: {
                        loadScene: false,
                    }
                }}
            />
        </div>
    )
}
