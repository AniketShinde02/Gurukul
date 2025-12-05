import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { Button } from '@/components/ui/button'
import { MessageSquare, X, Clock } from 'lucide-react'
import type { Message } from '@/types/chat.types'

interface ChatSidebarProps {
    status: 'idle' | 'searching' | 'connected'
    isChatOpen: boolean
    onCloseChat: () => void
    messages: Message[]
    currentUserId: string
    otherUserTyping: boolean
    sessionId: string | null
}

export function ChatSidebar({
    status,
    isChatOpen,
    onCloseChat,
    messages,
    currentUserId,
    otherUserTyping,
    sessionId
}: ChatSidebarProps) {
    if (status !== 'connected' && !isChatOpen) return null

    // Filter out signaling messages for display
    const visibleMessages = messages.filter(m => {
        if (!m.content) return false
        try {
            const content = JSON.parse(m.content)
            return !['offer', 'answer', 'ice-candidate', 'call-ended', 'system'].includes(content.type)
        } catch {
            return true
        }
    })

    return (
        <div className="hidden lg:flex flex-col w-80 border-r border-white/5 bg-white/5 h-full">
            {status === 'connected' ? (
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-orange-500" />
                            Chat
                        </h3>
                        <Button variant="ghost" size="icon" onClick={onCloseChat}>
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <MessageList
                            messages={visibleMessages}
                            currentUserId={currentUserId}
                            otherUserTyping={otherUserTyping}
                        />
                    </div>
                    <div className="p-3 border-t border-white/5">
                        {sessionId && (
                            <MessageInput
                                sessionId={sessionId}
                                onTypingChange={() => { }}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="p-6 border-b border-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                            <Clock className="w-5 h-5 text-orange-500" />
                            Recent Matches
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="text-center text-stone-500 py-10 text-sm">No recent matches</div>
                    </div>
                </>
            )}
        </div>
    )
}
