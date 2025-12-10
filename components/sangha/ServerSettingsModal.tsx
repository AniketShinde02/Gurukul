'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Loader2, Upload, Plus, Shield, Users, Ban, Settings, LogOut, ChevronDown, Trash2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Role = {
    id: string
    name: string
    color: string
    position: number
    permissions: Record<string, boolean>
}

type RoomDetails = {
    name: string
    description: string
    icon_url: string
    banner_url: string
}

type Member = {
    user_id: string
    role_id: string | null
    profile: {
        username: string
        avatar_url: string | null
    }
    role?: Role
}

const PERMISSION_PRESETS = {
    Administrator: {
        admin: true,
        manage_server: true,
        manage_roles: true,
        manage_channels: true,
        kick_members: true,
        ban_members: true,
        send_messages: true,
        manage_messages: true,
        connect: true,
        speak: true,
        stream: true
    },
    Moderator: {
        admin: false,
        manage_server: false,
        manage_roles: false,
        manage_channels: false,
        kick_members: true,
        ban_members: true,
        send_messages: true,
        manage_messages: true,
        connect: true,
        speak: true,
        stream: true
    },
    Member: {
        admin: false,
        manage_server: false,
        manage_roles: false,
        manage_channels: false,
        kick_members: false,
        ban_members: false,
        send_messages: true,
        manage_messages: false,
        connect: true,
        speak: true,
        stream: true
    }
}

export function ServerSettingsModal({ roomId, isOpen, onClose, onDelete }: { roomId: string, isOpen: boolean, onClose: () => void, onDelete?: () => void }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null)
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Overview State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [iconFile, setIconFile] = useState<File | null>(null)
    const [bannerFile, setBannerFile] = useState<File | null>(null)
    const [iconPreview, setIconPreview] = useState<string | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)
    const [showDeleteServerConfirm, setShowDeleteServerConfirm] = useState(false)

    useEffect(() => {
        if (isOpen && roomId) {
            fetchData()
        }
    }, [isOpen, roomId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: room } = await supabase.from('study_rooms').select('*').eq('id', roomId).single()
            if (room) {
                setRoomDetails(room)
                setName(room.name)
                setDescription(room.description || '')
                setIconPreview(room.icon_url)
                setBannerPreview(room.banner_url)
            }

            const { data: rolesData } = await supabase.from('room_roles').select('*').eq('room_id', roomId).order('position')
            if (rolesData) {
                setRoles(rolesData)
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveOverview = async () => {
        setSaving(true)
        try {
            let iconUrl = roomDetails?.icon_url
            let bannerUrl = roomDetails?.banner_url

            // Upload icon if changed
            if (iconFile) {
                const filePath = `server-assets/${roomId}/icon-${Date.now()}.${iconFile.name.split('.').pop()}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, iconFile, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) {
                    console.error('Icon upload error:', uploadError)
                    throw new Error(`Failed to upload icon: ${uploadError.message}`)
                }

                const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath)
                iconUrl = data.publicUrl
            }

            // Upload banner if changed
            if (bannerFile) {
                const filePath = `server-assets/${roomId}/banner-${Date.now()}.${bannerFile.name.split('.').pop()}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, bannerFile, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) {
                    console.error('Banner upload error:', uploadError)
                    throw new Error(`Failed to upload banner: ${uploadError.message}`)
                }

                const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath)
                bannerUrl = data.publicUrl
            }

            // Update database with new URLs
            const { error: updateError } = await supabase
                .from('study_rooms')
                .update({
                    name,
                    description,
                    icon_url: iconUrl,
                    banner_url: bannerUrl
                })
                .eq('id', roomId)

            if (updateError) {
                console.error('Database update error:', updateError)
                throw updateError
            }

            toast.success('Server settings updated successfully!')

            // Reset file states
            setIconFile(null)
            setBannerFile(null)

            // Refresh the data to show updated images
            await fetchData()

            // Force reload to ensure all components update
            setTimeout(() => {
                window.location.reload()
            }, 500)

        } catch (error: any) {
            console.error('Error saving settings:', error)
            toast.error(error.message || 'Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteServer = async () => {
        const { error } = await supabase
            .from('study_rooms')
            .delete()
            .eq('id', roomId)

        if (error) {
            console.error('Failed to delete server', error)
            toast.error('Failed to delete server')
        } else {
            toast.success('Server deleted')
            setShowDeleteServerConfirm(false)
            if (onDelete) {
                onDelete()
            } else {
                window.location.href = '/sangha'
            }
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[85vh] bg-stone-900 border-white/10 text-white p-0 overflow-hidden flex shadow-2xl">
                <DialogTitle className="sr-only">Server Settings</DialogTitle>
                {/* Sidebar */}
                <div className="w-64 bg-stone-950 p-4 border-r border-white/5 flex flex-col gap-1 shrink-0">
                    <h2 className="text-xs font-bold text-stone-500 uppercase px-3 mb-3 tracking-wider">Server Settings</h2>
                    <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Settings className="w-4 h-4" />}>Overview</NavButton>
                    <NavButton active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} icon={<Shield className="w-4 h-4" />}>Roles</NavButton>
                    <NavButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users className="w-4 h-4" />}>Members</NavButton>
                    <NavButton active={activeTab === 'bans'} onClick={() => setActiveTab('bans')} icon={<Ban className="w-4 h-4" />}>Bans</NavButton>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-stone-900">
                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && (
                                    <div className="space-y-8 max-w-3xl">
                                        <h1 className="text-2xl font-bold">Server Overview</h1>

                                        <div className="flex gap-8">
                                            <div className="flex flex-col items-center gap-3">
                                                <Label>Server Icon</Label>
                                                <div className="relative group cursor-pointer">
                                                    <Avatar className="w-32 h-32 border-4 border-stone-800 group-hover:border-stone-700 transition-colors shadow-xl">
                                                        <AvatarImage src={iconPreview || undefined} className="object-cover" />
                                                        <AvatarFallback className="bg-stone-800 text-stone-500 text-2xl">
                                                            {name?.[0]?.toUpperCase()}
                                                        </AvatarFallback>
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                                            <Upload className="w-8 h-8 text-white" />
                                                        </div>
                                                    </Avatar>
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                setIconFile(file)
                                                                setIconPreview(URL.createObjectURL(file))
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-6">
                                                <div className="space-y-2">
                                                    <Label>Server Name</Label>
                                                    <Input
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="bg-stone-800 border-white/10 h-10"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Description</Label>
                                                    <Textarea
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        className="bg-stone-800 border-white/10 resize-none"
                                                        rows={4}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Server Banner</Label>
                                            <div className="relative h-48 rounded-xl bg-stone-800 border-2 border-dashed border-stone-700 group cursor-pointer overflow-hidden hover:border-stone-600 transition-colors">
                                                {bannerPreview ? (
                                                    <img
                                                        src={bannerPreview}
                                                        alt="Banner"
                                                        className="w-full h-full object-cover"
                                                        onError={() => {
                                                            console.error('Failed to load banner image:', bannerPreview);
                                                            // toast.error('Failed to load banner image. Check bucket permissions.');
                                                            // setBannerPreview(null); // Optional: Revert to upload state
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-stone-500">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Upload className="w-8 h-8" />
                                                            <span>Upload Banner</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-medium">Change Banner</span>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                            setBannerFile(file)
                                                            setBannerPreview(URL.createObjectURL(file))
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/10">
                                            <div className="flex items-center gap-3">
                                                <Button onClick={handleSaveOverview} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]">
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    Save Changes
                                                </Button>

                                                <Button
                                                    onClick={() => setShowDeleteServerConfirm(true)}
                                                    variant="destructive"
                                                    className="ml-auto bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/20"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Server
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'roles' && (
                                    <RolesManager roomId={roomId} roles={roles} setRoles={setRoles} />
                                )}

                                {activeTab === 'members' && (
                                    <MembersManager roomId={roomId} roles={roles} />
                                )}

                                {activeTab === 'bans' && (
                                    <BansManager roomId={roomId} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>

            {/* Delete Server Confirmation */}
            <Dialog open={showDeleteServerConfirm} onOpenChange={setShowDeleteServerConfirm}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Delete Server</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Are you sure you want to <span className="font-bold text-red-400">DELETE</span> this server?
                        </p>
                        <p className="text-sm text-stone-300 mt-2">
                            Server: <span className="font-bold text-white">{name}</span>
                        </p>
                        <p className="text-xs text-red-400 mt-3">⚠️ This action cannot be undone. All channels, messages, and settings will be permanently deleted.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDeleteServerConfirm(false)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteServer} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Server
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    )
}

function NavButton({ active, onClick, children, icon }: any) {
    return (
        <Button
            variant={active ? 'secondary' : 'ghost'}
            className={`justify-start gap-2 h-9 ${active ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'}`}
            onClick={onClick}
        >
            {icon}
            {children}
        </Button>
    )
}

function RolesManager({ roomId, roles, setRoles }: { roomId: string, roles: Role[], setRoles: React.Dispatch<React.SetStateAction<Role[]>> }) {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [editedRole, setEditedRole] = useState<Role | null>(null)
    const [showDeleteRoleConfirm, setShowDeleteRoleConfirm] = useState(false)

    const handleCreateRole = async () => {
        const newRole = {
            name: 'New Role',
            color: '#99aab5',
            position: roles.length,
            permissions: { send_messages: true }
        }

        const tempId = `temp-${Date.now()}`
        setRoles([...roles, { ...newRole, id: tempId }])

        const { data, error } = await supabase.from('room_roles').insert({
            room_id: roomId,
            ...newRole
        }).select().single()

        if (data) {
            setRoles((prev: Role[]) => prev.map(r => r.id === tempId ? data : r))
            setSelectedRole(data)
            setEditedRole(data)
        }
    }

    const handleSaveRole = async () => {
        if (!editedRole) return

        const { error } = await supabase.from('room_roles').update({
            name: editedRole.name,
            color: editedRole.color,
            permissions: editedRole.permissions
        }).eq('id', editedRole.id)

        if (!error) {
            setRoles((prev: Role[]) => prev.map(r => r.id === editedRole.id ? editedRole : r))
            toast.success('Role updated')
        }
    }

    const handleDeleteRole = async () => {
        if (!editedRole) return

        const { error } = await supabase.from('room_roles').delete().eq('id', editedRole.id)

        if (!error) {
            setRoles((prev: Role[]) => prev.filter(r => r.id !== editedRole.id))
            setSelectedRole(null)
            setEditedRole(null)
            setShowDeleteRoleConfirm(false)
            toast.success('Role deleted')
        } else {
            toast.error('Failed to delete role')
        }
    }

    const applyPreset = (presetName: keyof typeof PERMISSION_PRESETS) => {
        if (!editedRole) return
        setEditedRole({
            ...editedRole,
            permissions: PERMISSION_PRESETS[presetName]
        })
    }

    return (
        <div className="flex h-full gap-6">
            {/* Roles List */}
            <div className="w-60 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="font-bold text-stone-400 uppercase text-xs tracking-wider">Roles</h3>
                    <Button size="icon" variant="ghost" className="h-5 w-5 hover:bg-stone-800 rounded" onClick={handleCreateRole}>
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                </div>
                <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                    {roles.map(role => (
                        <div
                            key={role.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedRole?.id === role.id ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'}`}
                            onClick={() => {
                                setSelectedRole(role)
                                setEditedRole(role)
                            }}
                        >
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                            <span className="text-sm font-medium truncate">{role.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Role Editor */}
            {editedRole ? (
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="space-y-6 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input
                                    value={editedRole.name}
                                    onChange={(e) => setEditedRole({ ...editedRole, name: e.target.value })}
                                    className="bg-stone-800 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role Color</Label>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                        <input
                                            type="color"
                                            value={editedRole.color}
                                            onChange={(e) => setEditedRole({ ...editedRole, color: e.target.value })}
                                            className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                        />
                                    </div>
                                    <Input
                                        value={editedRole.color}
                                        onChange={(e) => setEditedRole({ ...editedRole, color: e.target.value })}
                                        className="bg-stone-800 border-white/10 w-32 font-mono uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <h3 className="font-bold text-stone-400 uppercase text-xs tracking-wider">Permissions</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => applyPreset('Member')}>Member</Button>
                                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => applyPreset('Moderator')}>Mod</Button>
                                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => applyPreset('Administrator')}>Admin</Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { key: 'admin', label: 'Administrator', desc: 'Members with this permission have every permission and can bypass channel specific permissions.' },
                                    { key: 'manage_server', label: 'Manage Server', desc: 'Allows members to change this server\'s name, banner, and other settings.' },
                                    { key: 'manage_roles', label: 'Manage Roles', desc: 'Allows members to create new roles and edit or delete roles lower than their highest role.' },
                                    { key: 'manage_channels', label: 'Manage Channels', desc: 'Allows members to create, edit, or delete channels.' },
                                    { key: 'kick_members', label: 'Kick Members', desc: 'Allows members to remove other members from this server.' },
                                    { key: 'ban_members', label: 'Ban Members', desc: 'Allows members to permanently ban other members from this server.' },
                                    { key: 'send_messages', label: 'Send Messages', desc: 'Allows members to send messages in text channels.' },
                                    { key: 'manage_messages', label: 'Manage Messages', desc: 'Allows members to delete messages by other members or pin any message.' },
                                    { key: 'connect', label: 'Connect', desc: 'Allows members to join voice channels.' },
                                    { key: 'speak', label: 'Speak', desc: 'Allows members to speak in voice channels.' },
                                    { key: 'stream', label: 'Video', desc: 'Allows members to share video, screen share, or stream in this server.' },
                                ].map(perm => (
                                    <div key={perm.key} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium cursor-pointer" htmlFor={`perm-${perm.key}`}>{perm.label}</Label>
                                            <p className="text-xs text-stone-500">{perm.desc}</p>
                                        </div>
                                        <Switch
                                            id={`perm-${perm.key}`}
                                            checked={editedRole.permissions?.[perm.key] || false}
                                            onCheckedChange={(checked) => setEditedRole({
                                                ...editedRole,
                                                permissions: { ...editedRole.permissions, [perm.key]: checked }
                                            })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-white/10 mt-4">
                        <Button variant="destructive" onClick={() => setShowDeleteRoleConfirm(true)}>Delete Role</Button>
                        <Button onClick={handleSaveRole} className="bg-green-600 hover:bg-green-700 text-white">Save Changes</Button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-500 gap-2">
                    <Shield className="w-12 h-12 opacity-20" />
                    <p>Select a role to edit permissions</p>
                </div>
            )}

            {/* Delete Role Confirmation */}
            <Dialog open={showDeleteRoleConfirm} onOpenChange={setShowDeleteRoleConfirm}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Delete Role</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Are you sure you want to delete this role?
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editedRole?.color }} />
                            <span className="font-bold text-white">{editedRole?.name}</span>
                        </div>
                        <p className="text-xs text-red-400 mt-3">⚠️ This action cannot be undone. Members with this role will lose their permissions.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDeleteRoleConfirm(false)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteRole} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function MembersManager({ roomId, roles }: { roomId: string, roles: Role[] }) {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [kickingMember, setKickingMember] = useState<Member | null>(null)

    useEffect(() => {
        fetchMembers()
    }, [roomId])

    const fetchMembers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('room_participants')
            .select(`
                user_id,
                role_id,
                profile:profiles!user_id(username, avatar_url)
            `)
            .eq('room_id', roomId)

        if (data) {
            // Map role_id to actual role object
            const membersWithRoles = data.map((m: any) => ({
                ...m,
                role: roles.find(r => r.id === m.role_id)
            }))
            setMembers(membersWithRoles)
        }
        setLoading(false)
    }

    const handleUpdateRole = async (userId: string, roleId: string | null) => {
        const { error } = await supabase
            .from('room_participants')
            .update({ role_id: roleId })
            .eq('room_id', roomId)
            .eq('user_id', userId)

        if (!error) {
            setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role_id: roleId, role: roles.find(r => r.id === roleId) } : m))
            toast.success('Member role updated')
        } else {
            toast.error('Failed to update role')
        }
    }

    const handleKick = async (userId: string) => {
        const { error } = await supabase
            .from('room_participants')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', userId)

        if (!error) {
            setMembers(prev => prev.filter(m => m.user_id !== userId))
            setKickingMember(null)
            toast.success('Member kicked')
        } else {
            console.error('Kick member error:', error)
            toast.error('Failed to kick member')
        }
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h1 className="text-2xl font-bold">Members</h1>
                <p className="text-stone-400 text-sm">{members.length} Members</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
                ) : (
                    members.map(member => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-white/5 hover:bg-stone-800 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={member.profile.avatar_url || undefined} />
                                    <AvatarFallback>{member.profile.username[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-white flex items-center gap-2">
                                        {member.profile.username}
                                        {member.role && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: member.role.color + '33', color: member.role.color }}>
                                                {member.role.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Plus className="w-4 h-4 rotate-45" /> {/* Use a different icon or just settings */}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-stone-900 border-white/10 text-white">
                                        <DropdownMenuItem className="text-stone-400 text-xs uppercase font-bold pointer-events-none">
                                            Assign Role
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateRole(member.user_id, null)}>
                                            No Role
                                        </DropdownMenuItem>
                                        {roles.map(role => (
                                            <DropdownMenuItem key={role.id} onClick={() => handleUpdateRole(member.user_id, role.id)}>
                                                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: role.color }} />
                                                {role.name}
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuItem className="text-red-400 focus:text-red-400 border-t border-white/10 mt-1" onClick={() => setKickingMember(member)}>
                                            Kick Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Kick Member Confirmation */}
            <Dialog open={!!kickingMember} onOpenChange={(open) => !open && setKickingMember(null)}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Kick Member</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Are you sure you want to kick this member from the server?
                        </p>
                        {kickingMember && (
                            <div className="flex items-center gap-3 mt-3 p-2 bg-stone-800/50 rounded-lg">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={kickingMember.profile.avatar_url || undefined} />
                                    <AvatarFallback>{kickingMember.profile.username[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-white">{kickingMember.profile.username}</span>
                            </div>
                        )}
                        <p className="text-xs text-red-400 mt-3">⚠️ They can rejoin with a new invite link.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setKickingMember(null)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={() => kickingMember && handleKick(kickingMember.user_id)} className="bg-red-600 hover:bg-red-700 text-white">
                            Kick Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function BansManager({ roomId }: { roomId: string }) {
    const [bans, setBans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBans()
    }, [roomId])

    const fetchBans = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('room_bans')
            .select(`
                *,
                user:profiles!user_id(username, avatar_url)
            `)
            .eq('room_id', roomId)

        if (data) setBans(data)
        setLoading(false)
    }

    const handleRevokeBan = async (userId: string) => {
        const { error } = await supabase
            .from('room_bans')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', userId)

        if (error) {
            toast.error('Failed to revoke ban')
        } else {
            toast.success('Ban revoked')
            setBans(prev => prev.filter(b => b.user_id !== userId))
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Bans</h1>
            <p className="text-stone-400 text-sm">Banned users cannot join the server.</p>

            <div className="space-y-2">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
                ) : bans.length === 0 ? (
                    <div className="text-center p-8 text-stone-500 border border-dashed border-white/10 rounded-lg">
                        No bans found.
                    </div>
                ) : (
                    bans.map(ban => (
                        <div key={ban.id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={ban.user.avatar_url} />
                                    <AvatarFallback>{ban.user.username[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-white">{ban.user.username}</div>
                                    <div className="text-xs text-stone-500">Reason: {ban.reason || 'No reason provided'}</div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRevokeBan(ban.user_id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                Revoke Ban
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
