import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import type { Message } from '@/types/chat.types'

const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
}

type WebRTCState = {
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    isCallActive: boolean
    isMicOn: boolean
    isCameraOn: boolean
    connectionState: RTCPeerConnectionState
}

export const useWebRTC = (
    sessionId: string | null,
    currentUserId: string,
    studyMode: 'video' | 'audio' = 'video',
    customSignaling?: {
        sendSignal: (signal: any) => void
    }
) => {
    const [state, setState] = useState<WebRTCState>({
        localStream: null,
        remoteStream: null,
        isCallActive: false,
        isMicOn: true,
        isCameraOn: studyMode === 'video',
        connectionState: 'new'
    })

    const peerConnection = useRef<RTCPeerConnection | null>(null)
    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([])
    const localStreamRef = useRef<MediaStream | null>(null)
    const sessionIdRef = useRef(sessionId)
    const initPromiseRef = useRef<Promise<RTCPeerConnection | null> | null>(null)

    // Keep ref in sync with prop
    useEffect(() => {
        sessionIdRef.current = sessionId
    }, [sessionId])

    // Helper to update state partially
    const updateState = (updates: Partial<WebRTCState>) => {
        setState(prev => ({ ...prev, ...updates }))
    }

    // Cleanup function
    const cleanup = useCallback(() => {
        console.log('🧹 Cleaning up WebRTC resources')

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop()
                console.log('Stopped track:', track.kind)
            })
            localStreamRef.current = null
        }

        if (peerConnection.current) {
            peerConnection.current.close()
            peerConnection.current = null
        }

        iceCandidatesQueue.current = []
        updateState({
            localStream: null,
            remoteStream: null,
            isCallActive: false,
            connectionState: 'closed'
        })
    }, [])

    // Send signaling message
    const sendSignal = useCallback(async (signal: any) => {
        const activeSessionId = sessionIdRef.current
        console.log('📤 sendSignal called:', signal.type, 'via', customSignaling ? 'WebSocket' : 'Supabase');

        if (!activeSessionId || !currentUserId) {
            console.error('❌ Missing session/user ID in sendSignal');
            return;
        }

        // Use Custom Signaling (WebSocket) if available
        if (customSignaling?.sendSignal) {
            customSignaling.sendSignal(signal);
            return;
        }

        // Fallback to Supabase
        try {
            await supabase.from('messages').insert({
                session_id: activeSessionId,
                sender_id: currentUserId,
                content: JSON.stringify(signal),
                type: 'text'
            })
        } catch (error) {
            console.error('Failed to send signal:', error)
        }
    }, [currentUserId, customSignaling])

    // Handle incoming signal
    // Initialize Peer Connection
    const initializePeerConnection = useCallback(async (overrideSessionId?: string) => {
        if (overrideSessionId) {
            sessionIdRef.current = overrideSessionId
        }

        if (peerConnection.current && peerConnection.current.connectionState !== 'closed') {
            return peerConnection.current
        }

        // Check if already initializing (Race condition fix)
        if (initPromiseRef.current) {
            console.log('⏳ Already initializing, waiting for existing promise...')
            return initPromiseRef.current
        }

        console.log('🚀 Initializing PeerConnection')

        initPromiseRef.current = (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: studyMode === 'video',
                    audio: true
                })

                localStreamRef.current = stream
                updateState({ localStream: stream })

                const pc = new RTCPeerConnection(RTC_CONFIG)

                // Add tracks
                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream)
                })

                // Handle remote tracks
                pc.ontrack = (event) => {
                    console.log('🎥 Received remote track:', event.track.kind)
                    const [remote] = event.streams
                    if (remote) {
                        updateState({ remoteStream: remote })
                    }
                }

                // Handle ICE candidates
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendSignal({ type: 'ice-candidate', candidate: event.candidate })
                    }
                }

                // Connection state changes
                pc.onconnectionstatechange = () => {
                    console.log('🔄 Connection state:', pc.connectionState)
                    updateState({ connectionState: pc.connectionState })

                    if (pc.connectionState === 'connected') {
                        updateState({ isCallActive: true })
                        toast.success('Connected!')
                    } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                        console.warn('Connection failed or disconnected')
                    }
                }

                peerConnection.current = pc
                return pc

            } catch (error: any) {
                console.error('Failed to initialize peer connection:', error);

                let friendlyMessage = 'Failed to access camera/microphone';

                if (error.name === 'NotReadableError' || error.message.includes('Device in use')) {
                    friendlyMessage = 'Camera is being used by another app or tab. Please close other video apps and try again.';
                } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    friendlyMessage = 'Camera/microphone access denied. Please allow permissions and refresh.';
                } else if (error.name === 'NotFoundError') {
                    friendlyMessage = 'No camera/microphone found. Please connect a device.';
                }

                toast.error(friendlyMessage);
                return null;
            } finally {
                initPromiseRef.current = null;
            }
        })();

        return initPromiseRef.current;
    }, [studyMode, sendSignal])

    // Handle incoming signals
    const handleSignal = useCallback(async (signal: any, overrideSessionId?: string) => {
        if (!peerConnection.current && signal.type !== 'offer') {
            // If we receive an answer or candidate but have no PC, we might need to init?
            // Usually offer triggers init.
            return
        }

        const pc = peerConnection.current || (signal.type === 'offer' ? await initializePeerConnection(overrideSessionId) : null)
        if (!pc) return

        try {
            switch (signal.type) {
                case 'offer':
                    console.log('📞 Handling Offer')
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.offer))
                    const answer = await pc.createAnswer()
                    await pc.setLocalDescription(answer)
                    await sendSignal({ type: 'answer', answer })

                    // Process queued candidates
                    while (iceCandidatesQueue.current.length > 0) {
                        const candidate = iceCandidatesQueue.current.shift()
                        if (candidate) await pc.addIceCandidate(candidate)
                    }
                    break

                case 'answer':
                    console.log('✅ Handling Answer')
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.answer))
                    while (iceCandidatesQueue.current.length > 0) {
                        const candidate = iceCandidatesQueue.current.shift()
                        if (candidate) await pc.addIceCandidate(candidate)
                    }
                    break

                case 'ice-candidate':
                    const candidate = new RTCIceCandidate(signal.candidate)
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(candidate)
                    } else {
                        iceCandidatesQueue.current.push(candidate)
                    }
                    break

                case 'call-ended':
                    console.log('❌ Partner ended call')
                    toast('Partner left the call')
                    cleanup()
                    break
            }
        } catch (error) {
            console.error('Error handling signal:', error)
        }
    }, [initializePeerConnection, sendSignal, cleanup])

    // Initiate Call
    const startCall = useCallback(async (overrideSessionId?: string) => {
        const pc = await initializePeerConnection(overrideSessionId)
        if (!pc) return

        try {
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: studyMode === 'video'
            })
            await pc.setLocalDescription(offer)
            await sendSignal({ type: 'offer', offer })
        } catch (error) {
            console.error('Error starting call:', error)
        }
    }, [initializePeerConnection, sendSignal, studyMode])

    // Toggle Media
    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                updateState({ isMicOn: audioTrack.enabled })
            }
        }
    }, [])

    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                updateState({ isCameraOn: videoTrack.enabled })
            }
        }
    }, [])

    const endCall = useCallback(async () => {
        await sendSignal({ type: 'call-ended' })
        cleanup()
    }, [sendSignal, cleanup])

    return {
        ...state,
        startCall,
        endCall,
        toggleMic,
        toggleCamera,
        handleSignal,
        initializePeerConnection // Exposed for manual init if needed
    }
}
