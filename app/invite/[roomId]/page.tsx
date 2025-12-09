'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function InvitePage() {
    const { roomId } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleInvite = async () => {
            try {
                // 1. Check Authentication
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    // Redirect to login with return URL
                    const returnUrl = encodeURIComponent(`/invite/${roomId}`)
                    router.push(`/auth/signin?next=${returnUrl}`)
                    return
                }

                // 2. Validate Room Exists & Get Details
                const { data: room, error: roomError } = await supabase
                    .from('study_rooms')
                    .select('id, name')
                    .eq('id', roomId)
                    .single()

                if (roomError || !room) {
                    setError('Invite invalid or expired.')
                    return
                }

                // 3. Join the User to the Room
                const { error: joinError } = await supabase
                    .from('room_participants')
                    .insert({
                        room_id: room.id,
                        user_id: user.id,
                        role: 'member'
                    })

                // Ignore "duplicate key" error (user already joined)
                if (joinError && !joinError.message.includes('duplicate key')) {
                    throw joinError
                }

                toast.success(`Welcome to ${room.name}!`)
                router.push(`/sangha/rooms/${room.id}`)

            } catch (err: any) {
                console.error('Invite error:', err)
                setError('Failed to join room.')
            } finally {
                setLoading(false)
            }
        }

        if (roomId) handleInvite()
    }, [roomId, router])

    if (error) {
        return (
            <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center p-4">
                <div className="bg-[#1C1917] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Invite Error</h1>
                    <p className="text-stone-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
                <p className="text-stone-400">Verifying invite...</p>
            </div>
        </div>
    )
}
