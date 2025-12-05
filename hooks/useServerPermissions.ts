import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export type Permissions = {
    admin: boolean
    manage_server: boolean
    manage_roles: boolean
    manage_channels: boolean
    kick_members: boolean
    ban_members: boolean
    send_messages: boolean
    manage_messages: boolean
    connect: boolean
    speak: boolean
    stream: boolean
}

const DEFAULT_PERMISSIONS: Permissions = {
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

export function useServerPermissions(roomId: string, userId?: string) {
    const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS)
    const [loading, setLoading] = useState(true)
    const [roleName, setRoleName] = useState<string>('Member')

    useEffect(() => {
        if (!roomId || !userId) {
            setLoading(false)
            return
        }

        const fetchPermissions = async () => {
            try {
                // Get participant info including role_id
                const { data: participant } = await supabase
                    .from('room_participants')
                    .select('*')
                    .eq('room_id', roomId)
                    .eq('user_id', userId)
                    .single()

                if (!participant) {
                    setPermissions(DEFAULT_PERMISSIONS)
                    return
                }

                // Check if user is the owner
                const { data: room } = await supabase
                    .from('study_rooms')
                    .select('owner_id, created_by')
                    .eq('id', roomId)
                    .single()

                if (room && (room.owner_id === userId || room.created_by === userId)) {
                    setPermissions({ ...DEFAULT_PERMISSIONS, admin: true, manage_server: true, manage_channels: true, manage_roles: true, kick_members: true, ban_members: true, manage_messages: true })
                    setRoleName('Owner')
                    return
                }

                // Legacy fallback: if role is 'host', give admin permissions
                if (participant.role === 'host') {
                    setPermissions({ ...DEFAULT_PERMISSIONS, admin: true, manage_server: true, manage_channels: true, manage_roles: true, kick_members: true, ban_members: true, manage_messages: true })
                    setRoleName('Admin')
                    return
                }

                if (participant.role_id) {
                    const { data: role } = await supabase
                        .from('room_roles')
                        .select('name, permissions')
                        .eq('id', participant.role_id)
                        .single()

                    if (role) {
                        setPermissions({ ...DEFAULT_PERMISSIONS, ...role.permissions })
                        setRoleName(role.name)
                    }
                } else {
                    // Fallback for legacy 'moderator'
                    if (participant.role === 'moderator') {
                        setPermissions({ ...DEFAULT_PERMISSIONS, manage_messages: true, kick_members: true })
                        setRoleName('Moderator')
                    }
                }
            } catch (error) {
                console.error('Error fetching permissions:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPermissions()

        // Real-time subscriptions
        const participantsChannel = supabase
            .channel(`participants:${roomId}:${userId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'room_participants',
                filter: `room_id=eq.${roomId}&user_id=eq.${userId}`
            }, () => {
                fetchPermissions()
            })
            .subscribe()

        const rolesChannel = supabase
            .channel(`roles:${roomId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'room_roles',
                filter: `room_id=eq.${roomId}`
            }, () => {
                fetchPermissions()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(participantsChannel)
            supabase.removeChannel(rolesChannel)
        }
    }, [roomId, userId])

    const can = (permission: keyof Permissions) => {
        if (permissions.admin) return true
        return permissions[permission]
    }

    return { permissions, loading, roleName, can }
}
