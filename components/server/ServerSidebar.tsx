'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus, Home, Compass, LogOut, Copy, Bell, VolumeX, Shield, Settings, User } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'react-hot-toast'

type Server = {
    id: string
    name: string
    icon_url: string | null
}

export function ServerSidebar() {
    const params = useParams()
    const pathname = usePathname()
    const activeServerId = params?.serverId as string
    const [servers, setServers] = useState<Server[]>([])

    useEffect(() => {
        const fetchServers = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('server_members')
                .select('server:servers(id, name, icon_url)')
                .eq('user_id', user.id)

            if (data) {
                const mappedServers = data.map((item: any) => item.server)
                setServers(mappedServers)
            }
        }

        fetchServers()
    }, [])

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, serverId: string } | null>(null)

    const handleContextMenu = (e: React.MouseEvent, serverId: string) => {
        e.preventDefault()
        e.stopPropagation() // Stop propagation to be safe
        setContextMenu({ x: e.clientX, y: e.clientY, serverId })
    }

    useEffect(() => {
        const closeMenu = () => setContextMenu(null)
        window.addEventListener('click', closeMenu)
        return () => window.removeEventListener('click', closeMenu)
    }, [])

    const handleLeaveServer = async (serverId: string) => {
        if (!confirm('Are you sure you want to leave this server?')) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('server_members')
            .delete()
            .eq('server_id', serverId)
            .eq('user_id', user.id)

        if (error) {
            toast.error('Failed to leave server')
        } else {
            toast.success('Left server')
            setServers(prev => prev.filter(s => s.id !== serverId))
            // Redirect if active
            if (activeServerId === serverId) {
                window.location.href = '/sangha'
            }
        }
    }

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id)
        toast.success('Server ID copied')
    }

    return (
        <div className="w-[72px] bg-stone-950 flex flex-col items-center py-3 gap-2 border-r border-white/5 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {/* Home / DMs */}
            <ServerSidebarIcon
                name="Direct Messages"
                icon={<Home className="w-5 h-5" />}
                href="/sangha"
                isActive={pathname?.startsWith('/sangha') && !pathname?.includes('/rooms/')}
            />

            <div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />

            {/* Server List */}
            {servers.map((server) => (
                <ServerSidebarIcon
                    key={server.id}
                    name={server.name}
                    image={server.icon_url}
                    href={`/sangha/rooms/${server.id}`}
                    isActive={pathname?.includes(server.id) || false}
                    onContextMenu={(e) => handleContextMenu(e, server.id)}
                />
            ))}

            {/* Custom Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 w-56 rounded-md border border-white/10 bg-stone-900 p-1 text-stone-200 shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2">
                        <Bell className="w-4 h-4" /> Notification Settings
                    </div>
                    <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2">
                        <VolumeX className="w-4 h-4" /> Mute Server
                    </div>
                    <div className="h-px bg-white/10 my-1" />
                    <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2">
                        <Shield className="w-4 h-4" /> Privacy Settings
                    </div>
                    <div className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-stone-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2">
                        <User className="w-4 h-4" /> Edit Server Profile
                    </div>
                    <div className="h-px bg-white/10 my-1" />
                    <div
                        className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-red-500/10 hover:text-red-400 text-red-400 gap-2"
                        onClick={() => {
                            handleLeaveServer(contextMenu.serverId)
                            setContextMenu(null)
                        }}
                    >
                        <LogOut className="w-4 h-4" /> Leave Server
                    </div>
                    <div className="h-px bg-white/10 my-1" />
                    <div
                        className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-white/10 hover:text-stone-50 text-stone-500 gap-2"
                        onClick={() => {
                            handleCopyId(contextMenu.serverId)
                            setContextMenu(null)
                        }}
                    >
                        <Copy className="w-3 h-3" /> Copy Server ID
                    </div>
                </div>
            )}

            {/* Add Server */}
            <ServerSidebarIcon
                name="Add a Server"
                icon={<Plus className="w-5 h-5 text-green-500" />}
                href="/sangha/create"
                isActive={false}
                className="group-hover:bg-green-500 group-hover:text-white bg-stone-800"
            />

            {/* Explore */}
            <ServerSidebarIcon
                name="Explore Discoverable Servers"
                icon={<Compass className="w-5 h-5 text-green-500" />}
                href="/sangha/explore"
                isActive={false}
                className="group-hover:bg-green-500 group-hover:text-white bg-stone-800"
            />
        </div>
    )
}

function ServerSidebarIcon({
    name,
    image,
    icon,
    href,
    isActive,
    className,
    onContextMenu
}: {
    name: string
    image?: string | null
    icon?: React.ReactNode
    href: string
    isActive: boolean
    className?: string
    onContextMenu?: (e: React.MouseEvent) => void
}) {
    const router = useRouter()

    const handleClick = () => {
        router.push(href)
    }

    return (
        <div onContextMenu={onContextMenu}>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            onClick={handleClick}
                            className="group relative flex items-center justify-center w-[72px] h-[48px] cursor-pointer"
                        >
                            {/* Active Indicator */}
                            <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${isActive ? 'h-8' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} />

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden flex items-center justify-center ${isActive ? 'bg-orange-600 text-white rounded-[16px]' : 'bg-stone-800 text-stone-400 hover:bg-orange-600 hover:text-white'} ${className}`}>
                                {image ? (
                                    <img src={image} alt={name} className="w-full h-full object-cover" />
                                ) : icon ? (
                                    icon
                                ) : (
                                    <span className="font-bold text-sm">{name.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black text-white border-white/10 font-bold z-50">
                        {name}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
