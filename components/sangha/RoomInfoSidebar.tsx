'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Phone, Video, Pin, UserPlus, ChevronDown, FileText, Image as ImageIcon, Link as LinkIcon, Trophy, Medal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { toast } from 'react-hot-toast'
import { useCall } from './GlobalCallManager'

import { Skeleton } from '@/components/ui/skeleton'

// ... existing imports

export function RoomInfoSidebar({ roomId }: { roomId: string }) {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ photos: 0, files: 0, links: 0 })
    const [recentPhotos, setRecentPhotos] = useState<string[]>([])
    const [recentFiles, setRecentFiles] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const { joinRoom } = useCall()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
        }
        getUser()

        const fetchMembers = async () => {
            try {
                const { data, error } = await supabase
                    .from('room_participants')
                    .select(`
                        user_id,
                        role,
                        profiles:user_id (
                            id,
                            username,
                            full_name,
                            avatar_url,
                            is_online,
                            xp,
                            level
                        )
                    `)
                    .eq('room_id', roomId)

                if (error) throw error

                if (data) {
                    const formatted = data.map((p: any) => ({
                        id: p.profiles.id,
                        name: p.profiles.full_name || p.profiles.username,
                        username: p.profiles.username,
                        avatar_url: p.profiles.avatar_url,
                        is_online: p.profiles.is_online,
                        role: p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1) : 'Member',
                        xp: p.profiles.xp || 0,
                        level: p.profiles.level || 1
                    }))
                    setMembers(formatted)
                }
            } catch (error) {
                console.error('Error fetching members:', error)
            } finally {
                setLoading(false)
            }
        }

        const fetchStats = async () => {
            // Count photos
            const { count: photos } = await supabase
                .from('room_messages')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', roomId)
                .in('type', ['image', 'gif'])

            // Count files
            const { count: files } = await supabase
                .from('room_messages')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', roomId)
                .eq('type', 'file')

            // Count links
            const { count: links } = await supabase
                .from('room_messages')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', roomId)
                .ilike('content', '%http%')

            setStats({ photos: photos || 0, files: files || 0, links: links || 0 })

            // Fetch recent photos
            const { data: photosData } = await supabase
                .from('room_messages')
                .select('content, file_url')
                .eq('room_id', roomId)
                .in('type', ['image', 'gif'])
                .order('created_at', { ascending: false })
                .limit(9)

            if (photosData) {
                setRecentPhotos(photosData.map(p => p.file_url || p.content))
            }

            // Fetch recent files
            const { data: filesData } = await supabase
                .from('room_messages')
                .select('content, file_url, created_at')
                .eq('room_id', roomId)
                .eq('type', 'file')
                .order('created_at', { ascending: false })
                .limit(5)

            if (filesData) {
                setRecentFiles(filesData)
            }
        }

        if (roomId) {
            fetchMembers()
            fetchStats()
        }
    }, [roomId])

    const copyInviteLink = () => {
        const link = `${window.location.origin}/sangha/rooms/${roomId}`
        navigator.clipboard.writeText(link)
        toast.success('Invite link copied to clipboard!')
    }

    return (
        <div className="w-80 bg-stone-950/40 backdrop-blur-md border-l border-white/5 flex flex-col p-6 gap-6 h-full">


            {/* Leaderboard Section */}
            <div className="bg-stone-900/30 rounded-3xl border border-white/5 overflow-hidden shrink-0">
                <div className="p-4 pb-2 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-bold text-white text-lg font-serif">Top Students</h3>
                </div>
                <div className="px-4 pb-4 space-y-3">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="w-6 h-4 bg-stone-800" />
                                <Skeleton className="w-8 h-8 rounded-full bg-stone-800" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-24 bg-stone-800" />
                                    <Skeleton className="h-3 w-16 bg-stone-800/60" />
                                </div>
                            </div>
                        ))
                    ) : (
                        [...members]
                            .sort((a, b) => b.xp - a.xp)
                            .slice(0, 3)
                            .map((member, i) => (
                                <div key={member.id} className="flex items-center gap-3">
                                    <div className="w-6 text-center font-bold text-stone-500 text-sm">#{i + 1}</div>
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarImage src={member.avatar_url || undefined} />
                                        <AvatarFallback className="bg-stone-800 text-stone-300 text-xs">
                                            {member.username[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-stone-200 truncate">{member.name}</div>
                                        <div className="text-[10px] text-stone-500">Lvl {member.level} • {member.xp} XP</div>
                                    </div>
                                    {i === 0 && <Medal className="w-4 h-4 text-yellow-500" />}
                                    {i === 1 && <Medal className="w-4 h-4 text-stone-400" />}
                                    {i === 2 && <Medal className="w-4 h-4 text-orange-700" />}
                                </div>
                            ))
                    )}
                    {members.length === 0 && !loading && (
                        <div className="text-center text-stone-500 text-xs py-2">No data</div>
                    )}
                </div>
            </div>

            {/* Members Section */}
            <div className="flex-1 min-h-0 flex flex-col bg-stone-900/30 rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-4 pb-2">
                    <h3 className="font-bold text-white text-lg font-serif">Members — {loading ? <Skeleton className="w-8 h-6 inline-block align-middle ml-2" /> : members.length}</h3>
                </div>
                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4 pb-4">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-2">
                                    <Skeleton className="w-10 h-10 rounded-full bg-stone-800" />
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-4 w-32 bg-stone-800" />
                                        <Skeleton className="h-3 w-20 bg-stone-800/60" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            members.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
                                    <div className="relative">
                                        <Avatar className="w-10 h-10 border border-white/10">
                                            <AvatarImage src={member.avatar_url || undefined} />
                                            <AvatarFallback className="bg-stone-800 text-stone-300">
                                                {member.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-stone-900 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-stone-600'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-stone-200 text-sm truncate">
                                                {member.name}
                                                {currentUser && member.id === currentUser.id && <span className="text-stone-500 ml-1">(You)</span>}
                                            </span>
                                            {member.role && <span className="text-[10px] text-stone-500 font-medium">{member.role}</span>}
                                        </div>
                                        <div className="text-xs text-stone-500 truncate">@{member.username}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        {members.length === 0 && !loading && (
                            <div className="text-center text-stone-500 py-4 text-sm">No members found</div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Files Section */}
            <div className="bg-stone-900/30 rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-4 pb-0">
                    <h3 className="font-bold text-white text-lg font-serif mb-2">Files</h3>
                </div>
                <Accordion type="single" collapsible className="w-full px-4 pb-4">
                    <AccordionItem value="photos" className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline hover:bg-white/5 rounded-lg px-2 text-stone-400 data-[state=open]:text-white">
                            <div className="flex items-center gap-3">
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-sm">{stats.photos} photos</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 px-2">
                            {recentPhotos.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {recentPhotos.map((url, i) => (
                                        <div key={i} className="aspect-square bg-stone-800 rounded-lg overflow-hidden">
                                            <img src={url} alt="" className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-stone-500 px-2">No photos yet</div>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="files" className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline hover:bg-white/5 rounded-lg px-2 text-stone-400 data-[state=open]:text-white">
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">{stats.files} files</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            {recentFiles.length > 0 ? (
                                <div className="space-y-2 pt-2">
                                    {recentFiles.map((file, i) => (
                                        <a key={i} href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-stone-800/50 hover:bg-stone-800 transition-colors group">
                                            <div className="w-8 h-8 rounded bg-stone-700 flex items-center justify-center text-stone-400 group-hover:text-white">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-stone-300 truncate group-hover:text-white">{file.content}</div>
                                                <div className="text-[10px] text-stone-500">{new Date(file.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-stone-500 px-2">No files yet</div>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="links" className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline hover:bg-white/5 rounded-lg px-2 text-stone-400 data-[state=open]:text-white">
                            <div className="flex items-center gap-3">
                                <LinkIcon className="w-4 h-4" />
                                <span className="text-sm">{stats.links} shared links</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="text-xs text-stone-500 px-2">No links yet</div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div >
    )
}
