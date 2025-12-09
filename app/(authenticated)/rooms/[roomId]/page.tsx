'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function RoomRedirect() {
    const { roomId } = useParams()
    const router = useRouter()

    useEffect(() => {
        if (roomId) {
            router.replace(`/sangha/rooms/${roomId}`)
        }
    }, [roomId, router])

    return (
        <div className="h-screen flex items-center justify-center bg-[#181614] text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p>Redirecting to Sangha...</p>
            </div>
        </div>
    )
}
