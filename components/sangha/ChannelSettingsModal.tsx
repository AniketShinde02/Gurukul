'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Loader2, Trash2, Hash, Volume2, Lock, Globe } from 'lucide-react'

type Channel = {
    id: string
    name: string
    type: string
    permission_overrides: Record<string, { view_channel?: boolean | null }>
}

type Role = {
    id: string
    name: string
    color: string
}

export function ChannelSettingsModal({ roomId, channelId, isOpen, onClose }: { roomId: string, channelId: string | null, isOpen: boolean, onClose: () => void }) {
    const [channel, setChannel] = useState<Channel | null>(null)
    const [name, setName] = useState('')
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const { data: channelData } = await supabase
                    .from('room_channels')
                    .select('*')
                    .eq('id', channelId)
                    .single()

                if (channelData) {
                    setChannel(channelData)
                    setName(channelData.name)
                }

                const { data: rolesData } = await supabase
                    .from('room_roles')
                    .select('id, name, color')
                    .eq('room_id', roomId)
                    .order('position')

                if (rolesData) setRoles(rolesData)

            } catch (error) {
                console.error('Error fetching channel settings:', error)
            } finally {
                setLoading(false)
            }
        }

        if (isOpen && channelId) {
            fetchData()
        }
    }, [isOpen, channelId, roomId])

    const handleSave = async () => {
        if (!channel) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('room_channels')
                .update({ name, permission_overrides: channel.permission_overrides })
                .eq('id', channel.id)

            if (error) throw error
            toast.success('Channel settings updated')
            onClose()
        } catch (error) {
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!channel) return

        const { error } = await supabase
            .from('room_channels')
            .delete()
            .eq('id', channel.id)

        if (error) {
            console.error('Channel deletion error:', error)
            toast.error('Failed to delete channel')
        } else {
            toast.success('Channel deleted')
            setShowDeleteConfirm(false)
            onClose()
        }
    }

    const updatePermission = (roleId: string, allowed: boolean | null) => {
        if (!channel) return
        const currentOverrides = channel.permission_overrides || {}
        const roleOverrides = currentOverrides[roleId] || {}

        const newOverrides = {
            ...currentOverrides,
            [roleId]: {
                ...roleOverrides,
                view_channel: allowed
            }
        }

        setChannel({ ...channel, permission_overrides: newOverrides })
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-stone-900 border-white/10 text-white p-0 overflow-hidden flex h-[600px]">
                <DialogTitle className="sr-only">Channel Settings</DialogTitle>
                {/* Sidebar */}
                <div className="w-48 bg-stone-950/50 p-4 border-r border-white/5 flex flex-col gap-1">
                    <h2 className="text-xs font-bold text-stone-500 uppercase px-2 mb-2">Channel Settings</h2>
                    <Button
                        variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                        className="justify-start"
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </Button>
                    <Button
                        variant={activeTab === 'permissions' ? 'secondary' : 'ghost'}
                        className="justify-start"
                        onClick={() => setActiveTab('permissions')}
                    >
                        Permissions
                    </Button>
                    <div className="flex-1" />
                    <Button variant="ghost" className="justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setShowDeleteConfirm(true)}>
                        Delete Channel
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                {channel?.type === 'voice' ? <Volume2 className="w-6 h-6 text-stone-400" /> : <Hash className="w-6 h-6 text-stone-400" />}
                                {name}
                            </h1>

                            {activeTab === 'overview' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Channel Name</Label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            className="bg-stone-800 border-white/10"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'permissions' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-stone-300">Role Permissions</h3>
                                        <p className="text-xs text-stone-500">Who can view this channel?</p>
                                    </div>

                                    <div className="space-y-2">
                                        {roles.map(role => {
                                            const override = channel?.permission_overrides?.[role.id]?.view_channel

                                            return (
                                                <div key={role.id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                                                        <span className="font-medium">{role.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1 bg-stone-950 rounded p-1">
                                                            <button
                                                                onClick={() => updatePermission(role.id, false)}
                                                                className={`p-1 rounded ${override === false ? 'bg-red-500 text-white' : 'text-stone-500 hover:text-stone-300'}`}
                                                                title="Deny"
                                                            >
                                                                <Lock className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => updatePermission(role.id, null)}
                                                                className={`p-1 rounded ${override === undefined || override === null ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}
                                                                title="Inherit"
                                                            >
                                                                <span className="text-xs font-bold px-1">/</span>
                                                            </button>
                                                            <button
                                                                onClick={() => updatePermission(role.id, true)}
                                                                className={`p-1 rounded ${override === true ? 'bg-green-500 text-white' : 'text-stone-500 hover:text-stone-300'}`}
                                                                title="Allow"
                                                            >
                                                                <Globe className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/10 flex justify-end">
                                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-red-400">Delete Channel</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-stone-300">
                            Are you sure you want to delete <span className="font-bold text-white">#{channel?.name}</span>?
                        </p>
                        <p className="text-xs text-stone-400 mt-2">
                            Type: {channel?.type}
                        </p>
                        <p className="text-xs text-red-400 mt-3">⚠️ This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Channel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    )
}
