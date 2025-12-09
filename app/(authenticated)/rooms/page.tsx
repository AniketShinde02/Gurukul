'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Flame, Plus, Users, Search, Lock, Globe, Loader2, ArrowRight, Sparkles, Hash, X, Compass, MessageSquare, Crown } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Room = {
    id: string
    name: string
    topic: string
    description: string
    current_participants: number
    max_participants: number
    type: 'public' | 'private'
    tags: string[]
    created_at: string
    created_by: string
    icon_url?: string
    participant_count?: number
}

export default function RoomsPage() {
    const router = useRouter()
    const [rooms, setRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Create Room Form State
    const [newRoom, setNewRoom] = useState({
        name: '',
        topic: '',
        description: '',
        type: 'public',
        max_participants: 100,
        tags: ''
    })
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchRooms()

        // Realtime subscription
        const channel = supabase
            .channel('public_rooms')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'study_rooms',
                },
                () => {
                    fetchRooms()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchRooms = async () => {
        try {
            const { data, error } = await supabase
                .from('study_rooms')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            setRooms(data || [])
        } catch (error) {
            console.error('Error fetching rooms:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('You must be logged in')
                return
            }

            const tagsArray = newRoom.tags.split(',').map(t => t.trim()).filter(t => t)

            const { data, error } = await supabase
                .from('study_rooms')
                .insert({
                    name: newRoom.name,
                    topic: newRoom.topic,
                    description: newRoom.description,
                    type: newRoom.type,
                    max_participants: newRoom.max_participants,
                    tags: tagsArray,
                    created_by: user.id,
                    is_active: true
                })
                .select()
                .single()

            if (data) {
                // Create default 'General' channel
                await supabase.from('room_channels').insert({
                    room_id: data.id,
                    name: 'general',
                    type: 'text',
                    position: 0
                })

                // Add creator as owner participant
                await supabase.from('room_participants').insert({
                    room_id: data.id,
                    user_id: user.id,
                    role: 'owner'
                })
            }

            if (error) throw error

            toast.success('Server created successfully!')
            setIsCreateModalOpen(false)
            setNewRoom({ name: '', topic: '', description: '', type: 'public', max_participants: 100, tags: '' })

            // Navigate to the new room
            if (data) {
                router.push(`/sangha/rooms/${data.id}`)
            }
        } catch (error) {
            console.error('Error creating room:', error)
            toast.error('Failed to create server')
        } finally {
            setCreating(false)
        }
    }

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-8 pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-900/30 via-stone-900/50 to-stone-900/30 border border-white/5 p-8 md:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/30">
                                <Compass className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">Explore Servers</h1>
                                <p className="text-stone-400 text-sm">Discover and join learning communities</p>
                            </div>
                        </div>
                        <p className="text-stone-300 text-lg max-w-xl">
                            Find your tribe of learners. Join public servers, collaborate on topics, and grow together.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-900/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span>Create Server</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-indigo-500/5 rounded-2xl blur-xl group-focus-within:from-orange-500/10 group-focus-within:to-indigo-500/10 transition-colors" />
                <div className="relative flex items-center">
                    <Search className="absolute left-5 w-5 h-5 text-stone-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search servers by name, topic, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-stone-900/80 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-stone-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all backdrop-blur-md"
                    />
                </div>
            </div>

            {/* Rooms Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                </div>
            ) : filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRooms.map((room) => (
                        <div
                            key={room.id}
                            className="group relative bg-stone-900/60 border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-900/10 cursor-pointer"
                            onClick={() => router.push(`/sangha/rooms/${room.id}`)}
                        >
                            {/* Card Header with Icon */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-stone-800 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-orange-500/30 transition-colors">
                                            {room.icon_url ? (
                                                <img src={room.icon_url} alt={room.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Hash className="w-6 h-6 text-orange-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1">
                                                {room.name}
                                            </h3>
                                            <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">
                                                {room.topic || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                    {room.type === 'private' ? (
                                        <Lock className="w-4 h-4 text-stone-500" />
                                    ) : (
                                        <Globe className="w-4 h-4 text-green-500" />
                                    )}
                                </div>

                                <p className="text-stone-400 text-sm line-clamp-2 leading-relaxed min-h-[40px]">
                                    {room.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Tags */}
                            {room.tags && room.tags.length > 0 && (
                                <div className="px-6 pb-4 flex flex-wrap gap-2">
                                    {room.tags.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-[10px] text-stone-400 bg-stone-800/80 px-2.5 py-1 rounded-lg border border-white/5">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="px-6 py-4 bg-stone-900/50 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-stone-400 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{room.participant_count || room.current_participants || 0} members</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Active</span>
                                    </div>
                                </div>
                                <button className="text-orange-500 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    <span>Join</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-stone-900/30 rounded-3xl border border-white/5 border-dashed backdrop-blur-sm">
                    <div className="w-20 h-20 bg-stone-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-stone-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No servers found</h3>
                    <p className="text-stone-400 mb-8 max-w-sm mx-auto">Be the first to create a learning community and invite others to join.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-orange-500 font-bold hover:text-orange-400 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Create a Server
                    </button>
                </div>
            )}

            {/* Create Room Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    {/* Backdrop with blur */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal */}
                    <div
                        className="relative bg-stone-900 w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                                    <Flame className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Create Your Server</h2>
                                    <p className="text-xs text-stone-500">Build a community for your learners</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRoom} className="p-6 space-y-5">
                            {/* Server Name */}
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                    Server Name <span className="text-orange-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                    className="w-full bg-stone-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm placeholder:text-stone-600"
                                    placeholder="e.g. UPSC Warriors, JEE Study Group"
                                />
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                    Topic / Category <span className="text-orange-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newRoom.topic}
                                    onChange={(e) => setNewRoom({ ...newRoom, topic: e.target.value })}
                                    className="w-full bg-stone-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm placeholder:text-stone-600"
                                    placeholder="e.g. Science, History, Coding"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={newRoom.description}
                                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                    className="w-full bg-stone-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm resize-none placeholder:text-stone-600"
                                    placeholder="What is this server about? Who should join?"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                    Tags <span className="text-stone-600">(comma separated)</span>
                                </label>
                                <input
                                    type="text"
                                    value={newRoom.tags}
                                    onChange={(e) => setNewRoom({ ...newRoom, tags: e.target.value })}
                                    className="w-full bg-stone-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm placeholder:text-stone-600"
                                    placeholder="e.g. study, focus, pomodoro, late-night"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-stone-400 hover:bg-white/5 hover:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newRoom.name || !newRoom.topic}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 font-bold shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Crown className="w-4 h-4" />
                                            <span>Create Server</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
