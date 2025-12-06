'use client'

import { useEffect } from 'react'
import { DmSidebar } from '@/components/sangha/DmSidebar'
import { FriendsView } from '@/components/sangha/FriendsView'
import { ChatArea } from '@/components/sangha/ChatArea'
import { useDm } from '@/hooks/useDm'

export default function SanghaHome() {
    const dmState = useDm()

    // Sync activeConversationId with view state
    useEffect(() => {
        // When conversation changes, update the view
        // This allows the DM sidebar to control what's shown
    }, [dmState.activeConversationId])

    return (
        <div className="flex-1 flex overflow-hidden h-full relative">
            {/* Secondary Sidebar: DMs */}
            <div className={`w-full md:w-80 flex-col border-r border-white/5 bg-black/20 ${dmState.activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                <DmSidebar dmState={dmState} />
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex overflow-hidden h-full bg-black/20 ${dmState.activeConversationId ? 'hidden md:flex' : 'flex'}`}>
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
