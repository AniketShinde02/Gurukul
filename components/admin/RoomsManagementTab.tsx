'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Server, Users, Trash2, Edit2, Eye, Search, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'react-hot-toast'

export function RoomsManagementTab() {
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('study_rooms')
                .select(`
                    *,
                    owner:profiles!owner_id(username, avatar_url),
                    members:room_participants(count)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setRooms(data || [])
        } catch (error) {
            console.error('Error fetching rooms:', error)
            toast.error('Failed to load rooms')
        } finally {
            setLoading(false)
        }
    }

    const deleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) return

        try {
            const { error } = await supabase
                .from('study_rooms')
                .delete()
                .eq('id', roomId)

            if (error) throw error
            toast.success('Room deleted successfully')
            fetchRooms()
        } catch (error) {
            console.error('Error deleting room:', error)
            toast.error('Failed to delete room')
        }
    }

    const filteredRooms = rooms.filter(room =>
        room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <Card className="bg-stone-900/50 border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search rooms..."
                                className="pl-10 bg-stone-950 border-white/10"
                            />
                        </div>
                        <Button onClick={() => fetchRooms()}>Refresh</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                    <Card key={room.id} className="bg-stone-900/50 border-white/10 hover:border-white/20 transition-all group">
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={room.icon_url} />
                                    <AvatarFallback>{room.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-base">{room.name}</CardTitle>
                                    <p className="text-xs text-stone-500">
                                        by @{room.owner?.username}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-stone-400 mb-4 line-clamp-2">
                                {room.description || 'No description'}
                            </p>
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant="outline" className="text-xs">
                                    <Users className="w-3 h-3 mr-1" />
                                    {room.members?.[0]?.count || 0} members
                                </Badge>
                                <Badge variant={room.is_active ? 'default' : 'secondary'} className="text-xs">
                                    {room.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="outline" className="flex-1">
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteRoom(room.id)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
