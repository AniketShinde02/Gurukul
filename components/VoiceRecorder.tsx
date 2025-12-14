'use client'

import { useState } from 'react'
import { Mic, Square, X, Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface VoiceRecorderProps {
    onSend: (audioUrl: string, duration: number, waveform: number[]) => void
    onCancel: () => void
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
    const [isUploading, setIsUploading] = useState(false)

    const {
        isRecording,
        duration,
        waveform,
        startRecording,
        stopRecording,
        cancelRecording,
        isSupported
    } = useVoiceRecorder({
        maxDuration: 120, // 2 minutes
        onRecordingComplete: handleRecordingComplete
    })

    async function handleRecordingComplete(blob: Blob, duration: number, waveform: number[]) {
        setIsUploading(true)

        try {
            // Generate unique filename
            const timestamp = Date.now()
            const extension = blob.type.includes('webm') ? 'webm' : 'ogg'
            const filename = `voice_${timestamp}.${extension}`
            const filepath = `${filename}`

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('voice-messages')
                .upload(filepath, blob, {
                    contentType: blob.type,
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('voice-messages')
                .getPublicUrl(filepath)

            onSend(publicUrl, duration, waveform)
            toast.success('Voice message sent!')

        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to send voice message')
        } finally {
            setIsUploading(false)
        }
    }

    function formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    function handleCancel() {
        cancelRecording()
        onCancel()
    }

    if (!isSupported) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">Voice recording is not supported in your browser</p>
            </div>
        )
    }

    if (isUploading) {
        return (
            <div className="flex items-center gap-3 p-4 bg-stone-800/50 rounded-lg">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                <span className="text-sm text-stone-300">Sending voice message...</span>
            </div>
        )
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg"
            >
                {/* Waveform Visualization */}
                <div className="flex-1 flex items-center gap-1 h-12 px-3 bg-stone-900/50 rounded-lg overflow-hidden">
                    {waveform.length > 0 ? (
                        waveform.map((amplitude, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${amplitude * 100}%` }}
                                className="flex-1 bg-orange-500 rounded-full min-h-[2px]"
                            />
                        ))
                    ) : (
                        <div className="flex items-center gap-2 text-stone-500">
                            <Mic className="w-4 h-4 animate-pulse" />
                            <span className="text-sm">Recording...</span>
                        </div>
                    )}
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-mono text-white min-w-[3rem]">
                        {formatDuration(duration)}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full transition-colors"
                            title="Start Recording"
                        >
                            <Mic className="w-5 h-5 text-white" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={stopRecording}
                                className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
                                title="Send"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                                title="Cancel"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
