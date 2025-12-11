'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, MoreVertical, Check, X, Search, Trash2, ArrowLeft } from 'lucide-react'
import { useDm } from '@/hooks/useDm'
import { toast } from 'react-hot-toast'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

type Tab = 'online' | 'all' | 'pending' | 'blocked' | 'add_friend'

export function FriendsView({ onStartDm, onBack }: { onStartDm: (id: string) => void | Promise<void>, onBack?: () => void }) {
    const [activeTab, setActiveTab] = useState<Tab>('online')
    const [buddies, setBuddies] = useState<any[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [friendUsername, setFriendUsername] = useState('')
    const [sendingRequest, setSendingRequest] = useState(false)
    const [unfriendingBuddy, setUnfriendingBuddy] = useState<{ id: string, username: string } | null>(null)
    const { startDm } = useDm()

    // Pagination State
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const PAGE_SIZE = 20

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        await Promise.all([
            fetchBuddies(0, true),
            fetchRequests()
        ])
        setLoading(false)
    }

    const fetchBuddies = async (pageIndex: number, replace: boolean = false) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const from = pageIndex * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            const { data: connections, error } = await supabase
                .from('study_connections')
                .select(`
                  id,
                  created_at,
                  requester:profiles!requester_id(id, username, full_name, avatar_url, is_online),
                  receiver:profiles!receiver_id(id, username, full_name, avatar_url, is_online)
                `)
                .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) throw error

            const formattedBuddies = connections.map((conn: any) => {
                const isRequester = conn.requester.id === user.id
                return {
                    ...(isRequester ? conn.receiver : conn.requester),
                    connectionId: conn.id
                }
            })

            if (formattedBuddies.length < PAGE_SIZE) {
                setHasMore(false)
            } else {
                setHasMore(true)
            }

            if (replace) {
                setBuddies(formattedBuddies)
            } else {
                // ✅ Strict deduplication: Use a Map to ensure unique IDs
                setBuddies(prev => {
                    const combined = [...prev, ...formattedBuddies]
                    const uniqueMap = new Map()
                    combined.forEach(buddy => {
                        if (!uniqueMap.has(buddy.id)) {
                            uniqueMap.set(buddy.id, buddy)
                        }
                    })
                    return Array.from(uniqueMap.values())
                })
            }

            setPage(pageIndex)

        } catch (error) {
            console.error('Error fetching friends:', error)
            toast.error('Failed to load friends')
        }
    }

    const fetchRequests = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

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
            console.error('Error fetching requests:', error)
        }
    }

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchBuddies(page + 1)
        }
    }

    const handleResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('study_connections')
                .update({ status })
                .eq('id', connectionId)

            if (error) throw error
            toast.success(status === 'accepted' ? 'Request accepted' : 'Request rejected')
            fetchInitialData()
        } catch (error) {
            toast.error('Failed to update request')
        }
    }

    const executeUnfriend = async (connectionId: string) => {

        try {
            const { error } = await supabase
                .from('study_connections')
                .delete()
                .eq('id', connectionId)

            if (error) throw error
            toast.success('Friend removed')
            setUnfriendingBuddy(null)
            fetchInitialData()
        } catch (error) {
            toast.error('Failed to remove friend')
        }
    }

    const handleMessage = async (buddyId: string) => {
        // Pass buddyId to parent, which will handle startDm
        // The parent (SanghaHome) handles the navigation/view switch
        await onStartDm(buddyId)
    }

    const sendFriendRequest = async () => {
        if (!friendUsername.trim()) {
            toast.error('Please enter a username')
            return
        }

        setSendingRequest(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('You must be logged in')
                return
            }

            // Find user by username
            const { data: targetUser, error: userError } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('username', friendUsername.trim())
                .single()

            if (userError || !targetUser) {
                toast.error('User not found')
                return
            }

            if (targetUser.id === user.id) {
                toast.error('You cannot add yourself as a friend')
                return
            }

            // Check if connection already exists
            const { data: existing } = await supabase
                .from('study_connections')
                .select('id, status')
                .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},receiver_id.eq.${user.id})`)
                .maybeSingle()

            if (existing) {
                if (existing.status === 'accepted') {
                    toast.error('You are already friends with this user')
                } else if (existing.status === 'pending') {
                    toast.error('Friend request already sent')
                } else {
                    toast.error('Connection already exists')
                }
                return
            }

            // Send friend request
            const { error: insertError } = await supabase
                .from('study_connections')
                .insert({
                    requester_id: user.id,
                    receiver_id: targetUser.id,
                    status: 'pending'
                })

            if (insertError) throw insertError

            toast.success(`Friend request sent to ${targetUser.username}!`)
            setFriendUsername('')

        } catch (error) {
            console.error('Error sending friend request:', error)
            toast.error('Failed to send friend request')
        } finally {
            setSendingRequest(false)
        }
    }

    const filteredBuddies = buddies.filter(b => {
        if (activeTab === 'online') return b.is_online
        if (activeTab === 'all') return true
        return false
    })

    return (
        <div className="flex-1 flex flex-col bg-transparent min-w-0">
            {/* Header */}
            <div className="h-12 border-b border-orange-900/20 flex items-center px-6 gap-4 shadow-sm bg-[#1C1917]/80 backdrop-blur-xl">
                {/* Mobile Back Button */}
                {onBack && (
                    <button onClick={onBack} className="md:hidden mr-2 text-stone-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="flex items-center gap-2 text-stone-400 font-bold mr-4">
                    <div className="w-6 h-6"><UsersIcon /></div>
                    <span className="text-white">Friends</span>
                </div>
                <div className="h-6 w-[1px] bg-white/10" />

                <TabButton active={activeTab === 'online'} onClick={() => setActiveTab('online')}>Online</TabButton>
                <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>All</TabButton>
                <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>Pending</TabButton>
                <TabButton active={activeTab === 'blocked'} onClick={() => setActiveTab('blocked')}>Blocked</TabButton>
                <button
                    onClick={() => setActiveTab('add_friend')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === 'add_friend' ? 'text-green-400 bg-transparent' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/20'}`}
                >
                    Add Friend
                </button>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'add_friend' ? (
                        <div className="max-w-2xl">
                            <h2 className="text-white font-bold text-lg mb-2 font-serif">ADD FRIEND</h2>
                            <p className="text-stone-400 text-xs mb-4">You can add friends with their username.</p>
                            <div className="relative">
                                <Input
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !sendingRequest) {
                                            sendFriendRequest()
                                        }
                                    }}
                                    placeholder="Enter username (e.g., ai.captioncraft)"
                                    className="bg-stone-900/50 border-white/10 h-12 text-stone-200 placeholder:text-stone-500 focus:border-orange-500 transition-all rounded-xl pr-44"
                                    disabled={sendingRequest}
                                />
                                <Button
                                    onClick={sendFriendRequest}
                                    disabled={sendingRequest || !friendUsername.trim()}
                                    className="absolute right-1 top-1 h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingRequest ? 'Sending...' : 'Send Friend Request'}
                                </Button>
                            </div>

                            <div className="mt-8 flex flex-col items-center justify-center py-10">
                                <div className="w-40 h-40 bg-white/5 rounded-full mb-4 flex items-center justify-center border border-white/5">
                                    <img src="/empty-friends.svg" alt="" className="w-24 opacity-50 grayscale" />
                                </div>
                                <p className="text-stone-400">Waiting for friends...</p>
                            </div>
                        </div>
                    ) : activeTab === 'pending' ? (
                        <div>
                            <h2 className="text-stone-400 font-bold text-xs mb-4 uppercase tracking-wider">Pending — {requests.length}</h2>
                            <div className="space-y-2">
                                {requests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl group border border-white/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-white/10">
                                                <AvatarImage src={req.requester.avatar_url || undefined} />
                                                <AvatarFallback className="bg-stone-800 text-stone-300">
                                                    {req.requester.username[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    {req.requester.full_name || req.requester.username}
                                                </div>
                                                <div className="text-xs text-stone-400">Incoming Friend Request</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleResponse(req.id, 'accepted')} className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:text-green-500 hover:bg-stone-800 transition-colors border border-white/5">
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleResponse(req.id, 'rejected')} className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-stone-800 transition-colors border border-white/5">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {requests.length === 0 && (
                                    <div className="text-center py-10 text-stone-500">
                                        There are no pending friend requests.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-stone-400 font-bold text-xs mb-4 uppercase tracking-wider">
                                {activeTab === 'online' ? 'Online' : 'All Friends'} — {loading ? '...' : filteredBuddies.length}
                            </h2>
                            <div className="space-y-2">
                                {loading && filteredBuddies.length === 0 && (
                                    <>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="w-10 h-10 rounded-full" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-32" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {filteredBuddies.map(buddy => (
                                    <div key={buddy.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl group border border-white/5 cursor-pointer transition-all" onClick={() => handleMessage(buddy.id)}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className="w-10 h-10 border border-white/10">
                                                    <AvatarImage src={buddy.avatar_url || undefined} />
                                                    <AvatarFallback className="bg-stone-800 text-stone-300">
                                                        {buddy.username[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-stone-900 rounded-full ${buddy.is_online ? 'bg-green-500' : 'bg-stone-500'}`} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    {buddy.full_name || buddy.username}
                                                    <span className="hidden group-hover:inline text-xs text-stone-500">#{buddy.username.substring(0, 4)}</span>
                                                </div>
                                                <div className="text-xs text-stone-400">
                                                    {buddy.is_online ? 'Online' : 'Offline'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleMessage(buddy.id)
                                                }}
                                                className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 border border-white/5"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 border border-white/5">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-stone-900 border-white/10 text-stone-200">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setUnfriendingBuddy({ id: buddy.connectionId, username: buddy.username })
                                                        }}
                                                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Unfriend
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                                {filteredBuddies.length === 0 && !loading && (
                                    <div className="text-center py-10 text-stone-500">
                                        No friends found.
                                    </div>
                                )}
                                {hasMore && (activeTab === 'online' || activeTab === 'all' || activeTab === 'blocked') && (
                                    <div className="pt-4 flex justify-center">
                                        <Button
                                            variant="ghost"
                                            onClick={loadMore}
                                            disabled={loading}
                                            className="text-stone-400 hover:text-white"
                                        >
                                            {loading ? 'Loading...' : 'Load More'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (Active Now) */}
                <div className="w-[360px] border-l border-orange-900/20 hidden lg:flex flex-col p-6 bg-[#1C1917]/60 backdrop-blur-xl">
                    <h2 className="font-bold text-xl text-white mb-6 font-serif">Active Now</h2>
                    <div className="text-center py-10">
                        <p className="text-stone-400 font-bold mb-2">It's quiet for now...</p>
                        <p className="text-stone-500 text-sm">When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!</p>
                    </div>
                </div>
            </div>
            {/* Unfriend Confirmation */}
            <Dialog open={!!unfriendingBuddy} onOpenChange={(open) => !open && setUnfriendingBuddy(null)}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Remove Friend</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Are you sure you want to unfriend <span className="font-bold text-white">{unfriendingBuddy?.username}</span>?
                        </p>
                        <p className="text-xs text-stone-400 mt-2">
                            This will remove them from your friends list and delete your direct message history.
                        </p>
                        <p className="text-xs text-red-400 mt-2">⚠️ This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setUnfriendingBuddy(null)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={() => unfriendingBuddy && executeUnfriend(unfriendingBuddy.id)} className="bg-red-600 hover:bg-red-700 text-white">
                            Remove Friend
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}

function TabButton({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${active
                ? 'bg-orange-600/20 text-orange-400 shadow-sm border border-orange-500/30'
                : 'text-stone-400 hover:bg-orange-500/10 hover:text-orange-400'
                }`}
        >
            {children}
        </button>
    )
}

function UsersIcon() {
    return (
        <svg aria-hidden="true" role="img" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <g fill="none" fillRule="evenodd">
                <path fill="currentColor" d="M14 8.00598C14 10.211 12.206 12.006 10 12.006C7.795 12.006 6 10.211 6 8.00598C6 5.80098 7.794 4.00598 10 4.00598C12.206 4.00598 14 5.80098 14 8.00598ZM2 19.006C2 15.473 5.29 13.006 10 13.006C14.711 13.006 18 15.473 18 19.006V20.006H2V19.006Z"></path>
                <path fill="currentColor" d="M14 8.00598C14 10.211 12.206 12.006 10 12.006C7.795 12.006 6 10.211 6 8.00598C6 5.80098 7.794 4.00598 10 4.00598C12.206 4.00598 14 5.80098 14 8.00598ZM2 19.006C2 15.473 5.29 13.006 10 13.006C14.711 13.006 18 15.473 18 19.006V20.006H2V19.006Z" opacity=".3"></path>
                <path fill="currentColor" d="M20.0001 20.006H22.0001V19.006C22.0001 16.4433 20.2697 14.4415 17.5213 13.5352C19.0621 14.9127 20.0001 16.8059 20.0001 19.006V20.006Z"></path>
                <path fill="currentColor" d="M14.8834 11.9077C16.6657 11.5044 18.0001 9.9077 18.0001 8.00598C18.0001 5.96916 16.4693 4.28218 14.4971 4.0367C15.4322 5.09334 16.0001 6.48524 16.0001 8.00598C16.0001 9.44888 15.4889 10.7742 14.6378 11.8102C14.7203 11.8418 14.8022 11.8743 14.8834 11.9077Z"></path>
            </g>
        </svg>
    )
}
