'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, Coffee, Briefcase, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface PomodoroTimerProps {
    roomId: string
    currentUser: any
}

type TimerStatus = 'running' | 'paused' | 'stopped'
type TimerType = 'work' | 'short_break' | 'long_break' | 'custom'

export function PomodoroTimer({ roomId, currentUser }: PomodoroTimerProps) {
    const [timeLeft, setTimeLeft] = useState(1500) // 25 mins default
    const [duration, setDuration] = useState(1500)
    const [status, setStatus] = useState<TimerStatus>('stopped')
    const [type, setType] = useState<TimerType>('work')
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const startTimeRef = useRef<number | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    useEffect(() => {
        if (status === 'running') {
            startTimeRef.current = Date.now()
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleComplete()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [status])

    const handleComplete = async () => {
        setStatus('stopped')
        if (intervalRef.current) clearInterval(intervalRef.current)

        // Only log if duration was > 5 minutes to prevent spamming tiny sessions
        if (duration < 300) {
            toast('Session complete! (Too short for XP)', { icon: '⏱️' })
            setTimeLeft(duration)
            return
        }

        try {
            // Call the secure RPC function to award XP
            const minutes = Math.floor(duration / 60)
            const { data, error } = await supabase.rpc('award_study_xp', {
                minutes_studied: minutes,
                study_category: type === 'work' ? 'Deep Work' : 'Study Session'
            })

            if (error) throw error

            // Show Gamification Feedback
            const result = data as any
            if (result) {
                if (result.leveled_up) {
                    toast.success(`LEVEL UP! You reached Level ${result.new_level}! (+${result.xp_gained} XP)`, {
                        duration: 5000,
                        icon: '🎉'
                    })
                    // Trigger confetti or sound here in future
                } else {
                    toast.success(`Session logged! +${result.xp_gained} XP`, { icon: '🔥' })
                }
            } else {
                toast.success('Session recorded successfully!')
            }

        } catch (error) {
            console.error('Error logging session:', error)
            toast.error('Could not save progress')
        }

        // Reset
        setTimeLeft(duration)
    }

    const handleStart = () => {
        setStatus('running')
    }

    const handlePause = () => {
        setStatus('paused')
    }

    const handleReset = () => {
        setStatus('stopped')
        setTimeLeft(duration)
    }

    const setPreset = (newType: TimerType, minutes: number) => {
        const newDuration = minutes * 60
        setType(newType)
        setDuration(newDuration)
        setTimeLeft(newDuration)
        setStatus('stopped')
    }

    const handleCustomDuration = () => {
        const input = window.prompt('Enter duration in minutes:', '30')
        if (input) {
            const minutes = parseInt(input)
            if (!isNaN(minutes) && minutes > 0) {
                setPreset('custom', minutes)
            } else {
                toast.error('Invalid duration')
            }
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-stone-900/50 border border-white/10 rounded-xl p-3 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Timer</span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setPreset('work', 25)}
                        className={cn("px-2 py-1 text-[10px] font-bold rounded transition-colors", type === 'work' && duration === 1500 ? "bg-orange-500/20 text-orange-500" : "text-stone-500 hover:bg-white/5")}
                        title="25 min"
                    >
                        25m
                    </button>
                    <button
                        onClick={() => setPreset('work', 45)}
                        className={cn("px-2 py-1 text-[10px] font-bold rounded transition-colors", type === 'work' && duration === 2700 ? "bg-orange-500/20 text-orange-500" : "text-stone-500 hover:bg-white/5")}
                        title="45 min"
                    >
                        45m
                    </button>
                    <button
                        onClick={() => setPreset('work', 60)}
                        className={cn("px-2 py-1 text-[10px] font-bold rounded transition-colors", type === 'work' && duration === 3600 ? "bg-orange-500/20 text-orange-500" : "text-stone-500 hover:bg-white/5")}
                        title="60 min"
                    >
                        60m
                    </button>
                    <button
                        onClick={handleCustomDuration}
                        className={cn("px-2 py-1 text-[10px] font-bold rounded transition-colors", type === 'custom' ? "bg-blue-500/20 text-blue-500" : "text-stone-500 hover:bg-white/5")}
                        title="Custom"
                    >
                        Custom
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className={cn(
                    "text-3xl font-mono font-bold tracking-wider tabular-nums",
                    status === 'running' ? "text-white" : "text-stone-500"
                )}>
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-1">
                    {status === 'running' ? (
                        <Button size="icon" variant="secondary" onClick={handlePause} className="h-8 w-8 rounded-lg bg-stone-800 hover:bg-stone-700 border border-white/5">
                            <Pause className="w-3.5 h-3.5" />
                        </Button>
                    ) : (
                        <Button size="icon" className="h-8 w-8 rounded-lg bg-orange-600 hover:bg-orange-700 text-white border border-orange-500/20" onClick={handleStart}>
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                        </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={handleReset} className="h-8 w-8 rounded-lg hover:bg-white/5 text-stone-500 hover:text-white">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
