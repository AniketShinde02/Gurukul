'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface UseVoiceRecorderOptions {
    maxDuration?: number // seconds
    onRecordingComplete?: (blob: Blob, duration: number, waveform: number[]) => void
    onError?: (error: Error) => void
}

interface VoiceRecorderState {
    isRecording: boolean
    isPaused: boolean
    duration: number
    waveform: number[]
    error: string | null
}

export function useVoiceRecorder({
    maxDuration = 120, // 2 minutes max
    onRecordingComplete,
    onError
}: UseVoiceRecorderOptions = {}) {
    const [state, setState] = useState<VoiceRecorderState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
        waveform: [],
        error: null
    })

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup function
    const cleanup = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }

        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        mediaRecorderRef.current = null
        analyserRef.current = null
    }, [])

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })

            streamRef.current = stream

            // Setup audio context for waveform
            const audioContext = new AudioContext()
            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)

            audioContextRef.current = audioContext
            analyserRef.current = analyser

            // Determine best audio format
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
                    ? 'audio/ogg;codecs=opus'
                    : 'audio/webm'

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 128000 // 128kbps for good quality
            })

            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
                const duration = state.duration
                const waveform = state.waveform

                cleanup()

                setState({
                    isRecording: false,
                    isPaused: false,
                    duration: 0,
                    waveform: [],
                    error: null
                })

                if (onRecordingComplete && duration > 0) {
                    onRecordingComplete(audioBlob, duration, waveform)
                }
            }

            mediaRecorder.onerror = (event: any) => {
                const error = new Error(event.error?.message || 'Recording failed')
                cleanup()
                setState(prev => ({ ...prev, error: error.message, isRecording: false }))
                if (onError) onError(error)
                toast.error('Recording failed')
            }

            mediaRecorderRef.current = mediaRecorder
            mediaRecorder.start(100) // Collect data every 100ms

            // Start duration timer
            timerRef.current = setInterval(() => {
                setState(prev => {
                    const newDuration = prev.duration + 1

                    // Auto-stop at max duration
                    if (newDuration >= maxDuration) {
                        stopRecording()
                        toast.success('Max duration reached')
                    }

                    return { ...prev, duration: newDuration }
                })
            }, 1000)

            // Start waveform capture
            waveformIntervalRef.current = setInterval(() => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
                    analyserRef.current.getByteFrequencyData(dataArray)

                    // Calculate average amplitude
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
                    const normalized = average / 255 // 0-1 range

                    setState(prev => ({
                        ...prev,
                        waveform: [...prev.waveform, normalized].slice(-60) // Keep last 60 samples
                    }))
                }
            }, 100)

            setState(prev => ({ ...prev, isRecording: true, error: null }))
            toast.success('Recording started')

        } catch (error: any) {
            const err = new Error(error.message || 'Failed to access microphone')
            setState(prev => ({ ...prev, error: err.message }))
            if (onError) onError(err)

            if (error.name === 'NotAllowedError') {
                toast.error('Microphone permission denied')
            } else if (error.name === 'NotFoundError') {
                toast.error('No microphone found')
            } else {
                toast.error('Failed to start recording')
            }
        }
    }, [maxDuration, onRecordingComplete, onError, cleanup, state.duration, state.waveform])

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            mediaRecorderRef.current.stop()
        }
    }, [state.isRecording])

    // Cancel recording
    const cancelRecording = useCallback(() => {
        cleanup()
        setState({
            isRecording: false,
            isPaused: false,
            duration: 0,
            waveform: [],
            error: null
        })
        toast.success('Recording cancelled')
    }, [cleanup])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup()
        }
    }, [cleanup])

    return {
        ...state,
        startRecording,
        stopRecording,
        cancelRecording,
        isSupported: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
    }
}
