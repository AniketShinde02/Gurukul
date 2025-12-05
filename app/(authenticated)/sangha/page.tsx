'use client'

import { useState } from 'react'
import { DmSidebar } from '@/components/sangha/DmSidebar'
import { FriendsView } from '@/components/sangha/FriendsView'
import { ChatArea } from '@/components/sangha/ChatArea'

export default function SanghaHome() {
    const [view, setView] = useState<string | null>(null)

    return (
        <div className="flex-1 flex overflow-hidden h-full relative">
            {/* Secondary Sidebar: DMs */}
            <div className={`w-full md:w-80 flex-col border-r border-white/5 bg-black/20 ${view ? 'hidden md:flex' : 'flex'}`}>
                <DmSidebar onSelect={(id) => setView(id)} />
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex overflow-hidden h-full bg-black/20 ${!view ? 'hidden md:flex' : 'flex'}`}>
                {view === 'friends' || view === null ? (
                    <FriendsView
                        onStartDm={(id) => setView(id)}
                        onBack={() => setView(null)}
                    />
                ) : (
                    <ChatArea conversationId={view} onClose={() => setView(null)} />
                )}
            </div>
        </div>
    )
}
