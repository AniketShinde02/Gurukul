'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DmSidebar } from '@/components/sangha/DmSidebar'
import { FriendsView } from '@/components/sangha/FriendsView'
import { ChatArea } from '@/components/sangha/ChatArea'
import { useDm } from '@/hooks/useDm'

// Component that uses searchParams must be wrapped in Suspense
function SanghaContent() {
    const dmState = useDm()
    const searchParams = useSearchParams()

    // Sync activeConversationId with view state
    useEffect(() => {
        // Check for conversation ID in URL on mount
        const conversationId = searchParams.get('conversation')
        if (conversationId && !dmState.activeConversationId) {
            dmState.setActiveConversationId(conversationId)
        }
    }, [searchParams, dmState.activeConversationId])

    return (
        <div className="flex-1 flex overflow-hidden h-full relative">
            {/* Secondary Sidebar: DMs */}
            <div className={`w-full md:w-80 flex-col border-r border-white/5 bg-black/20 ${dmState.activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                <DmSidebar dmState={dmState} />
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex overflow-hidden h-full bg-black/20 flex`}>
                {!dmState.activeConversationId ? (
                    <FriendsView
                        onStartDm={async (buddyId) => {
                            const conversationId = await dmState.startDm(buddyId)
                            if (conversationId) {
                                dmState.setActiveConversationId(conversationId)
                            }
                        }}
                        onBack={() => dmState.setActiveConversationId(null)}
                    />
                ) : (
                    <ChatArea
                        conversationId={dmState.activeConversationId}
                        onClose={() => dmState.setActiveConversationId(null)}
                    />
                )}
            </div>
        </div>
    )
}

export default function SanghaHome() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center h-full bg-black/20">
                <div className="text-white/60">Loading...</div>
            </div>
        }>
            <SanghaContent />
        </Suspense>
    )
}
