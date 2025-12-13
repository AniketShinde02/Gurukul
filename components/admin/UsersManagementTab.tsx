'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Search, UserX, Shield, Ban, Check, X, Loader2, Mail, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'

export function UsersManagementTab() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [showBanDialog, setShowBanDialog] = useState(false)
    const [showMakeAdminDialog, setShowMakeAdminDialog] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleBanUser = async () => {
        if (!selectedUser) return

        try {
            // Add to banned_users table
            const { error } = await supabase
                .from('banned_users')
                .insert({
                    user_id: selectedUser.id,
                    reason: 'Banned by admin',
                    banned_by: (await supabase.auth.getUser()).data.user?.id
                })

            if (error) throw error

            // Update profile
            await supabase
                .from('profiles')
                .update({ is_banned: true })
                .eq('id', selectedUser.id)

            toast.success(`User @${selectedUser.username} banned successfully`)
            setShowBanDialog(false)
            fetchUsers()
        } catch (error) {
            console.error('Error banning user:', error)
            toast.error('Failed to ban user')
        }
    }

    const handleMakeAdmin = async () => {
        if (!selectedUser) return

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('id', selectedUser.id)

            if (error) throw error

            toast.success(`User @${selectedUser.username} is now an admin`)
            setShowMakeAdminDialog(false)
            fetchUsers()
        } catch (error) {
            console.error('Error making admin:', error)
            toast.error('Failed to make admin')
        }
    }

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by username, name, or email..."
                                className="pl-10 bg-stone-950 border-white/10"
                            />
                        </div>
                        <Button onClick={() => fetchUsers()} variant="outline">
                            <Loader2 className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <Card className="bg-stone-900/50 border-white/10">
                <CardHeader>
                    <CardTitle>
                        All Users ({filteredUsers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-4 p-4 bg-stone-950/50 rounded-lg border border-white/5 hover:border-white/10 transition-all group"
                            >
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-white">@{user.username}</p>
                                        {user.is_admin && (
                                            <Badge variant="default" className="bg-red-500/20 text-red-400 border-none">
                                                Admin
                                            </Badge>
                                        )}
                                        {user.is_student && (
                                            <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-none">
                                                Verified Student
                                            </Badge>
                                        )}
                                        {user.is_banned && (
                                            <Badge variant="destructive">
                                                Banned
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-stone-500">
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {user.email}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Joined {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                        <span>Level {user.level || 1} • {user.xp || 0} XP</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!user.is_admin && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setShowMakeAdminDialog(true)
                                            }}
                                        >
                                            <Shield className="w-4 h-4 mr-1" />
                                            Make Admin
                                        </Button>
                                    )}
                                    {!user.is_banned && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setShowBanDialog(true)
                                            }}
                                        >
                                            <Ban className="w-4 h-4 mr-1" />
                                            Ban
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Ban User Dialog */}
            <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
                <DialogContent className="bg-stone-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Ban User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to ban @{selectedUser?.username}? They will be immediately removed from all rooms and chat sessions.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowBanDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBanUser}>
                            <Ban className="w-4 h-4 mr-2" />
                            Ban User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Make Admin Dialog */}
            <Dialog open={showMakeAdminDialog} onOpenChange={setShowMakeAdminDialog}>
                <DialogContent className="bg-stone-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-orange-400">Make Admin</DialogTitle>
                        <DialogDescription>
                            Grant admin privileges to @{selectedUser?.username}? They will have full access to admin dashboard and moderation tools.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowMakeAdminDialog(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleMakeAdmin}>
                            <Shield className="w-4 h-4 mr-2" />
                            Grant Admin Access
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
