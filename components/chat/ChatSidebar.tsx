import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { Button } from '@/components/ui/button'
import { MessageSquare, X, Clock } from 'lucide-react'
import type { Message } from '@/types/chat.types'
import { cn } from '@/lib/utils'

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
    // Only show when connected AND chat is open
    if (status !== 'connected' || !isChatOpen) return null

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
        <div className={cn(
            "absolute lg:relative inset-0 lg:inset-auto z-50 lg:z-auto",
            "flex flex-col w-full lg:w-80 border-r border-white/5 bg-stone-950/95 lg:bg-white/5 h-full",
            "animate-in slide-in-from-left-full lg:slide-in-from-left-0 duration-300"
        )}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                        Chat
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onCloseChat} className="hover:bg-white/10">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {visibleMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10">
                            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                                <span className="text-3xl">🙏</span>
                            </div>
                            <h4 className="text-white font-medium mb-1">Namaste!</h4>
                            <p className="text-stone-500 text-sm">Start the conversation with a greeting.</p>
                        </div>
                    ) : (
                        <MessageList
                            messages={visibleMessages}
                            currentUserId={currentUserId}
                            otherUserTyping={otherUserTyping}
                        />
                    )}
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-white/5 bg-black/20">
                    {sessionId && (
                        <MessageInput
                            sessionId={sessionId}
                            onTypingChange={() => { }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
