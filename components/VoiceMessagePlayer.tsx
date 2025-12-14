import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'

interface VoiceMessagePlayerProps {
    audioUrl: string
    duration: number
    waveform?: number[]
    isMe?: boolean
}

export function VoiceMessagePlayer({
    audioUrl,
    duration,
    waveform = [],
    isMe = false
}: VoiceMessagePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [actualDuration, setActualDuration] = useState(duration)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Get signed URL for private storage
    useEffect(() => {
        const getSignedUrl = async () => {
            try {
                // Extract path from public URL
                const urlParts = audioUrl.split('/voice-messages/')
                if (urlParts.length < 2) {
                    setSignedUrl(audioUrl) // Use as-is if not from storage
                    return
                }

                const filepath = urlParts[1]

                // Get signed URL (valid for 1 hour)
                const { data, error } = await supabase.storage
                    .from('voice-messages')
                    .createSignedUrl(filepath, 3600)

                if (error) throw error
                setSignedUrl(data.signedUrl)
            } catch (error) {
                console.error('Failed to get signed URL:', error)
                setSignedUrl(audioUrl) // Fallback to original URL
            }
        }

        getSignedUrl()
    }, [audioUrl])

    useEffect(() => {
        if (!signedUrl) return

        const audio = new Audio(signedUrl)
        audioRef.current = audio

        audio.addEventListener('loadstart', () => setIsLoading(true))
        audio.addEventListener('canplay', () => setIsLoading(false))
        audio.addEventListener('loadedmetadata', () => {
            // Get actual duration from audio file
            if (audio.duration && !isNaN(audio.duration)) {
                setActualDuration(audio.duration)
            }
        })
        audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
        audio.addEventListener('ended', () => {
            setIsPlaying(false)
            setCurrentTime(0)
        })
        audio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e)
            setIsLoading(false)
            setIsPlaying(false)
        })

        return () => {
            audio.pause()
            audio.src = ''
        }
    }, [signedUrl])

    function togglePlayPause() {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            audio.play()
            setIsPlaying(true)
        }
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const progress = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0

    return (
        <div className={`flex items-center gap-3 p-3 rounded-2xl ${isMe
            ? 'bg-orange-600/20 border border-orange-500/30'
            : 'bg-stone-800/50 border border-white/5'
            }`}>
            {/* Play/Pause Button */}
            <button
                onClick={togglePlayPause}
                disabled={isLoading}
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMe
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-stone-700 hover:bg-stone-600'
                    }`}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                )}
            </button>

            {/* Waveform or Progress Bar */}
            <div className="flex-1 min-w-0">
                {waveform.length > 0 ? (
                    <div className="flex items-center gap-0.5 h-8">
                        {waveform.map((amplitude, i) => {
                            const isPast = (i / waveform.length) * 100 <= progress
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-colors ${isPast
                                        ? isMe ? 'bg-orange-400' : 'bg-blue-400'
                                        : 'bg-stone-600'
                                        }`}
                                    style={{
                                        height: `${Math.max(amplitude * 100, 10)}%`,
                                        minHeight: '2px'
                                    }}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="h-1 bg-stone-700 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${isMe ? 'bg-orange-400' : 'bg-blue-400'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                )}
            </div>

            {/* Time Display */}
            <div className="shrink-0 text-xs font-mono text-stone-400 min-w-[2.5rem] text-right">
                {isPlaying ? formatTime(currentTime) : formatTime(actualDuration)}
            </div>
        </div>
    )
}
