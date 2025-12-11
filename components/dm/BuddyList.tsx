'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare, UserPlus, MoreHorizontal, Check, X } from 'lucide-react'
import { useDm } from '@/hooks/useDm'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Buddy = {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    is_online: boolean
}

type Request = {
    id: string // connection id
    requester: Buddy
}

export function BuddyList() {
    const router = useRouter()
    const [buddies, setBuddies] = useState<Buddy[]>([])
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'buddies' | 'requests'>('buddies')
    const { startDm } = useDm()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch Buddies (Accepted)
            const { data: connections, error } = await supabase
                .from('study_connections')
                .select(`
          requester:profiles!requester_id(id, username, full_name, avatar_url, is_online),
          receiver:profiles!receiver_id(id, username, full_name, avatar_url, is_online)
        `)
                .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .eq('status', 'accepted')

            if (error) throw error

            const formattedBuddies = connections.map((conn: any) => {
                const isRequester = conn.requester.id === user.id
                return isRequester ? conn.receiver : conn.requester
            })

            // Deduplicate buddies
            const uniqueBuddies = Object.values(
                formattedBuddies.reduce((acc: any, buddy: any) => {
                    acc[buddy.id] = buddy
                    return acc
                }, {})
            ) as Buddy[]

            setBuddies(uniqueBuddies)

            // 2. Fetch Pending Requests (Where I am receiver)
            const { data: pending, error: pendingError } = await supabase
                .from('study_connections')
                .select(`
          id,
          requester:profiles!requester_id(id, username, full_name, avatar_url, is_online)
        `)
                .eq('receiver_id', user.id)
                .eq('status', 'pending')

            if (pendingError) throw pendingError

            setRequests(pending.map((p: any) => ({
                id: p.id,
                requester: p.requester
            })))

        } catch (error) {
            console.error('Error fetching buddies:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMessage = async (buddyId: string) => {
        const conversationId = await startDm(buddyId)
        if (conversationId) {
            // Redirect to Sangha page with conversation ID
            // Since SanghaHome doesn't read URL params yet (we will fix this next), 
            // the user will land on the friends list. Ideally we fix SanghaHome too.
            // But for now, getting them to the chat page is better than staying here.
            router.push(`/sangha?conversation=${conversationId}`)
        }
    }

    const handleResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('study_connections')
                .update({ status })
                .eq('id', connectionId)

            if (error) throw error

            toast.success(status === 'accepted' ? 'Friend request accepted!' : 'Request rejected')
            fetchData() // Refresh list
        } catch (error) {
            console.error('Error responding to request:', error)
            toast.error('Failed to update request')
        }
    }

    if (loading) return <div className="text-stone-500 text-sm">Loading buddies...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">My Sangha</h3>
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('buddies')}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'buddies' ? 'bg-orange-500 text-white' : 'text-stone-400 hover:text-white'
                            }`}
                    >
                        Buddies ({buddies.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'requests' ? 'bg-orange-500 text-white' : 'text-stone-400 hover:text-white'
                            }`}
                    >
                        Requests ({requests.length})
                    </button>
                </div>
            </div>

            <div className="space-y-2 h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {activeTab === 'buddies' ? (
                    buddies.length === 0 ? (
                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5">
                            <UserPlus className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                            <p className="text-stone-400 text-sm">No buddies yet.</p>
                            <p className="text-stone-600 text-xs mt-1">Match with people to add them!</p>
                        </div>
                    ) : (
                        buddies.map(buddy => (
                            <div key={buddy.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-orange-500/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="w-10 h-10 border border-white/10">
                                            <AvatarImage src={buddy.avatar_url || undefined} />
                                            <AvatarFallback className="bg-stone-800 text-stone-400">
                                                {buddy.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {buddy.is_online && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white text-sm">{buddy.full_name || buddy.username}</h4>
                                        <p className="text-xs text-stone-500">
                                            {buddy.is_online ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-orange-500 hover:text-white text-stone-400"
                                        onClick={() => handleMessage(buddy.id)}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    requests.length === 0 ? (
                        <div className="text-center py-8 text-stone-500 text-sm">
                            No pending requests.
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarImage src={req.requester.avatar_url || undefined} />
                                        <AvatarFallback className="bg-stone-800 text-stone-400">
                                            {req.requester.username[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-medium text-white text-sm">{req.requester.full_name || req.requester.username}</h4>
                                        <p className="text-xs text-stone-500">Wants to be buddies</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white"
                                        onClick={() => handleResponse(req.id, 'accepted')}
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                                        onClick={() => handleResponse(req.id, 'rejected')}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    )
}
