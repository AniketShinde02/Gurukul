'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { GlobalCallManager } from '@/components/sangha/GlobalCallManager'
import { ServerRail } from '@/components/sangha/ServerRail'

export default function SanghaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [username, setUsername] = useState('Guest')

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single()
                if (profile) setUsername(profile.username)
            }
        }
        fetchUser()
    }, [])

    return (
        <GlobalCallManager username={username}>
            <div className="flex h-screen bg-[var(--bg-root)] bg-vedic-pattern text-stone-200 font-sans selection:bg-orange-500/30">
                {/* 1. Server Rail */}
                <ServerRail />

                {/* 2. Main Content Area */}
                <div className="flex-1 flex overflow-hidden bg-transparent">
                    {children}
                </div>
            </div>
        </GlobalCallManager>
    )
}
