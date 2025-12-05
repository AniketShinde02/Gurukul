'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Video, Plus, Users, Search, Lock, Globe, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

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
        max_participants: 10,
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
            // toast.error('Failed to load rooms') // Suppress error if table doesn't exist yet
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

            if (error) throw error

            toast.success('Room created successfully!')
            setIsCreateModalOpen(false)
            setNewRoom({ name: '', topic: '', description: '', type: 'public', max_participants: 10, tags: '' })

            // Navigate to the new room
            if (data) {
                router.push(`/rooms/${data.id}`)
            }
        } catch (error) {
            console.error('Error creating room:', error)
            toast.error('Failed to create room')
        } finally {
            setCreating(false)
        }
    }

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-white mb-2">Study Rooms</h1>
                    <p className="text-stone-400 text-lg">Join a virtual ashram or create your own space for learning.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-900/20 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Create Room</span>
                </button>
            </div>

            {/* Search & Filter */}
            <div className="relative group">
                <div className="absolute inset-0 bg-orange-500/5 rounded-2xl blur-xl group-hover:bg-orange-500/10 transition-colors" />
                <div className="relative">
                    <Search className="absolute left-5 top-4 w-5 h-5 text-stone-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, topic, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-stone-500 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all backdrop-blur-md"
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
                        <div key={room.id} className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all group flex flex-col backdrop-blur-md relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="p-6 flex-1 relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
                                        {room.topic}
                                    </span>
                                    {room.type === 'private' ? (
                                        <Lock className="w-4 h-4 text-stone-500" />
                                    ) : (
                                        <Globe className="w-4 h-4 text-stone-500" />
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">{room.name}</h3>
                                <p className="text-stone-400 text-sm mb-6 line-clamp-2 leading-relaxed">{room.description || 'No description provided.'}</p>

                                <div className="flex flex-wrap gap-2">
                                    {room.tags?.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-[10px] text-stone-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between relative z-10">
                                <div className="flex items-center space-x-2 text-stone-400 text-xs font-medium">
                                    <Users className="w-4 h-4" />
                                    <span>{room.current_participants} / {room.max_participants}</span>
                                </div>
                                <button
                                    onClick={() => router.push(`/rooms/${room.id}`)}
                                    className="text-white text-sm font-bold flex items-center space-x-1 hover:text-orange-500 transition-colors group/btn"
                                >
                                    <span>Join Room</span>
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-black/20 rounded-3xl border border-white/5 border-dashed backdrop-blur-sm">
                    <div className="w-20 h-20 bg-stone-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-stone-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No active rooms</h3>
                    <p className="text-stone-400 mb-8 max-w-sm mx-auto">Be the first to start a study session and invite others to join.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-orange-500 font-bold hover:text-orange-400 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Create a Room
                    </button>
                </div>
            )}

            {/* Create Room Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1C1917] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Video className="w-5 h-5 text-orange-500" />
                                Create New Room
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-stone-400 hover:text-white transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRoom} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Room Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm placeholder:text-stone-600"
                                    placeholder="e.g. UPSC Late Night Study"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Topic</label>
                                    <input
                                        type="text"
                                        required
                                        value={newRoom.topic}
                                        onChange={(e) => setNewRoom({ ...newRoom, topic: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm placeholder:text-stone-600"
                                        placeholder="e.g. History"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Max Participants</label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="50"
                                        value={newRoom.max_participants}
                                        onChange={(e) => setNewRoom({ ...newRoom, max_participants: parseInt(e.target.value) })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    value={newRoom.description}
                                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm resize-none placeholder:text-stone-600"
                                    placeholder="What will you be studying?"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={newRoom.tags}
                                    onChange={(e) => setNewRoom({ ...newRoom, tags: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all text-sm placeholder:text-stone-600"
                                    placeholder="e.g. silent, focus, pomodoro"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-stone-400 hover:bg-white/5 hover:text-white font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-bold shadow-lg shadow-orange-900/20 flex items-center justify-center space-x-2 transition-all hover:scale-105 active:scale-95"
                                >
                                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                                    <span>Create Room</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
