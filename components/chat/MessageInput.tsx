'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Paperclip, Send, Smile } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { FileUpload } from './FileUpload'

interface MessageInputProps {
  sessionId: string
  onTypingChange: (isTyping: boolean) => void
}

export function MessageInput({ sessionId, onTypingChange }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isUploading) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          content: message.trim(),
          type: 'text',
        })

      if (error) throw error

      setMessage('')
      onTypingChange(false)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (value.trim()) {
      onTypingChange(true)

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false)
      }, 2000)
    } else {
      onTypingChange(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-white/5 rounded-2xl blur-sm group-focus-within:bg-orange-500/10 transition-colors duration-500" />
          <div className="relative flex items-center bg-[#221F1D] border border-white/10 rounded-2xl focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all shadow-inner">
            <Input
              ref={inputRef}
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isUploading}
              className="flex-1 bg-transparent border-none text-white placeholder:text-stone-500 focus-visible:ring-0 focus-visible:ring-offset-0 py-4 pl-4 pr-24 min-h-[56px]"
              maxLength={1000}
            />
            <div className="absolute right-2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowFileUpload(!showFileUpload)}
                disabled={isUploading}
                className="text-stone-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors w-9 h-9"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isUploading}
                className="text-stone-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors w-9 h-9"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <Button
          type="submit"
          disabled={!message.trim() || isUploading}
          size="icon"
          className={`h-14 w-14 rounded-2xl shadow-lg transition-all duration-300 ${message.trim()
              ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20 hover:scale-105 hover:-translate-y-1'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'
            }`}
        >
          <Send className={`h-5 w-5 ${message.trim() ? 'ml-1' : ''}`} />
        </Button>
      </form>

      {showFileUpload && (
        <div className="mt-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-[#221F1D] border border-white/10 rounded-2xl p-4 shadow-xl">
            <FileUpload
              sessionId={sessionId}
              onUploadStart={() => setIsUploading(true)}
              onUploadEnd={() => setIsUploading(false)}
              onClose={() => setShowFileUpload(false)}
            />
          </div>
        </div>
      )}

      <div className="text-[10px] text-stone-600 text-right mt-2 px-2 font-medium">
        {message.length}/1000
      </div>
    </div>
  )
}

