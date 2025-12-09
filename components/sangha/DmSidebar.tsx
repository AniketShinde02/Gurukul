'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, UserPlus, Settings, MoreVertical, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'

type DmSidebarProps = {
    dmState: ReturnType<typeof import('@/hooks/useDm').useDm>
}

export function DmSidebar({ dmState }: DmSidebarProps) {
    const { conversations, activeConversationId, setActiveConversationId, deleteConversation } = dmState
    const [search, setSearch] = useState('')

    const filtered = conversations.filter(c =>
        c.otherUser.username.toLowerCase().includes(search.toLowerCase()) ||
        c.otherUser.full_name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="w-full h-full bg-[#1C1917]/80 backdrop-blur-xl flex flex-col border-r border-orange-900/20 select-none">
            {/* Search Header */}
            <div className="p-3 shadow-sm z-10">
                <button className="w-full text-left text-stone-400 text-xs px-2 py-1 mb-2 hover:text-stone-200 transition-colors font-medium">
                    Find or start a conversation
                </button>
                <div className="relative">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search"
                        className="bg-[#0C0A09]/60 border-orange-900/20 text-stone-200 placeholder:text-stone-500 h-8 text-sm focus:border-orange-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Friends Button */}
            <div className="px-2 pb-2">
                <button
                    onClick={() => setActiveConversationId(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${!activeConversationId
                        ? 'bg-orange-600/20 text-orange-400 shadow-md border border-orange-500/30'
                        : 'text-stone-400 hover:bg-orange-500/10 hover:text-orange-400'
                        }`}
                >
                    <div className="w-6 h-6 flex items-center justify-center">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Friends</span>
                </button>
            </div>

            {/* DM List */}
            <div className="flex-1 overflow-hidden">
                <div className="px-4 pt-2 pb-1 text-xs font-bold text-stone-500 uppercase hover:text-stone-400 cursor-default tracking-wider">
                    Direct Messages
                </div>
                <ScrollArea className="h-full px-2">
                    <div className="space-y-[2px] pb-4">
                        {filtered.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setActiveConversationId(conv.id)}
                                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg group transition-all cursor-pointer relative ${activeConversationId === conv.id
                                    ? 'bg-orange-600/20 text-white shadow-md border border-orange-500/30'
                                    : 'text-stone-400 hover:bg-orange-500/10 hover:text-stone-200'
                                    }`}
                            >
                                <div className="relative">
                                    <Avatar className="w-8 h-8 border border-white/5">
                                        <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                                        <AvatarFallback className="bg-stone-800 text-stone-400 text-xs">
                                            {conv.otherUser.username[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Status Dot */}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-stone-900 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    </div>
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <span className={`font-medium truncate text-sm ${activeConversationId === conv.id ? 'text-white' : 'text-stone-300 group-hover:text-stone-200'}`}>
                                            {conv.otherUser.full_name || conv.otherUser.username}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-stone-500 truncate group-hover:text-stone-400 max-w-[140px]">
                                        {conv.lastMessagePreview ? (
                                            conv.lastMessagePreview.length > 30
                                                ? `${conv.lastMessagePreview.substring(0, 30)}...`
                                                : conv.lastMessagePreview
                                        ) : 'Start chatting'}
                                    </p>
                                </div>

                                {/* Conversation Actions */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white hover:bg-black/50 rounded-full">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-stone-900 border-white/10 text-stone-200">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteConversation(conv.id)
                                                }}
                                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Chat
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* User Profile (Bottom) */}
            <div className="h-[52px] bg-[#0C0A09]/60 flex items-center px-2 gap-2 border-t border-orange-900/20">
                <div className="flex-1 flex items-center gap-2 hover:bg-white/5 p-1 rounded-lg cursor-pointer transition-colors">
                    <Avatar className="w-8 h-8 border border-white/10">
                        <AvatarFallback className="bg-orange-600 text-white text-xs">ME</AvatarFallback>
                    </Avatar>
                    <div className="text-xs">
                        <div className="font-bold text-white">You</div>
                        <div className="text-stone-400">Online</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <Link href="/settings">
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
