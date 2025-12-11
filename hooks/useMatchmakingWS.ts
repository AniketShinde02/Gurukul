/**
 * WEBSOCKET-BASED MATCHMAKING HOOK
 * 
 * This replaces the old useMatchmaking hook that used:
 * ❌ Supabase Realtime (200 connection limit)
 * ❌ PostgreSQL polling (high DB load)
 * ❌ Advisory locks (bottleneck)
 * 
 * With:
 * ✅ Dedicated WebSocket server (10K+ connections)
 * ✅ In-memory queue (instant matches)
 * ✅ Zero database load for matching
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/lib/supabase/client';

type MatchStatus = 'idle' | 'searching' | 'connecting' | 'connected' | 'ended';

interface MatchResult {
    sessionId: string;
    partnerId: string;
    isInitiator: boolean;
}

// WebSocket server URL - update this after deploying
const WS_SERVER_URL = process.env.NEXT_PUBLIC_MATCHMAKING_WS_URL || 'ws://localhost:8080';

export function useMatchmakingWS(userId: string, enabled: boolean = true) {
    const [status, setStatus] = useState<MatchStatus>('idle');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [isInitiator, setIsInitiator] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const searchingSoundRef = useRef<HTMLAudioElement | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { play } = useSound();

    /**
     * Send message to WebSocket server
     */
    const sendMessage = useCallback((type: string, data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, data }));
        }
    }, []);

    /**
     * Handle incoming WebSocket messages
     */
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const { type, payload } = JSON.parse(event.data);

            switch (type) {
                case 'queued':
                    setQueuePosition(payload.position);
                    console.log('📋 Queued at position:', payload.position);
                    break;

                case 'match_found':
                    // Stop searching sound
                    if (searchingSoundRef.current) {
                        searchingSoundRef.current.pause();
                        searchingSoundRef.current = null;
                    }

                    play('MATCH_FOUND');

                    setSessionId(payload.sessionId);
                    setPartnerId(payload.partnerId);
                    setIsInitiator(payload.isInitiator);
                    setStatus('connecting');
                    setQueuePosition(null);

                    console.log('✅ Match found!', payload);

                    // Create session in Supabase DB (so messages can be inserted)
                    // Only initiator creates it to avoid duplicate inserts
                    if (payload.isInitiator && userId && payload.partnerId) {
                        supabase.from('chat_sessions').insert({
                            id: payload.sessionId,
                            user1_id: userId,
                            user2_id: payload.partnerId,
                            status: 'active'
                        }).then(({ error }) => {
                            if (error && error.code !== '23505') { // Ignore duplicate key error
                                console.error('Failed to create session in DB:', error);
                            }
                        });
                    }
                    break;

                case 'signal':
                    // Handle WebRTC signaling - dispatch custom event
                    window.dispatchEvent(new CustomEvent('webrtc-signal', {
                        detail: payload
                    }));
                    break;

                case 'partner_left':
                    play('CALL_DISCONNECT');
                    setStatus('ended');
                    console.log('👋 Partner left');
                    break;

                case 'session_ended':
                    setStatus('ended');
                    console.log('🔴 Session ended:', payload.reason);
                    break;

                case 'queue_timeout':
                    setStatus('idle');
                    setError('Search timed out. Please try again.');
                    if (searchingSoundRef.current) {
                        searchingSoundRef.current.pause();
                        searchingSoundRef.current = null;
                    }
                    break;

                case 'left_queue':
                    setStatus('idle');
                    setQueuePosition(null);
                    break;

                case 'error':
                    setError(payload.message);
                    break;

                case 'pong':
                    // Heartbeat response
                    break;

                default:
                    console.log('Unknown message:', type, payload);
            }
        } catch (err) {
            console.error('Message parse error:', err);
        }
    }, [play]);

    /**
     * Connect to WebSocket server
     */
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        if (!enabled) return;

        try {
            const ws = new WebSocket(WS_SERVER_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('🔗 Connected to matchmaking server');
                reconnectAttempts.current = 0;
            };

            ws.onmessage = handleMessage;

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('Connection error. Retrying...');
            };

            ws.onclose = () => {
                console.log('❌ Disconnected from matchmaking server');

                // Auto-reconnect with exponential backoff
                if (status === 'searching') {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    reconnectAttempts.current++;

                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('🔄 Reconnecting...');
                        connect();
                    }, delay);
                }
            };
        } catch (err) {
            console.error('WebSocket connection error:', err);
            setError('Failed to connect to matchmaking server');
        }
    }, [handleMessage, status]);

    /**
     * Start matchmaking
     */
    const startMatching = useCallback((matchMode: 'buddies_first' | 'global' = 'global', buddyIds: string[] = []) => {
        if (status === 'searching') return;

        setStatus('searching');
        setError(null);

        // Play searching sound
        const audio = play('CALL_INCOMING', { loop: true, volumeOverride: 0.3 });
        if (audio) searchingSoundRef.current = audio;

        // Connect if not connected
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            connect();
            // Wait for connection then join queue
            const checkConnection = setInterval(() => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    clearInterval(checkConnection);
                    sendMessage('join_queue', { userId, matchMode, buddyIds });
                }
            }, 100);
        } else {
            sendMessage('join_queue', { userId, matchMode, buddyIds });
        }
    }, [userId, status, play, connect, sendMessage]);

    /**
     * Cancel search
     */
    const cancelSearch = useCallback(() => {
        // Stop searching sound
        if (searchingSoundRef.current) {
            searchingSoundRef.current.pause();
            searchingSoundRef.current = null;
        }

        sendMessage('leave_queue', { userId });
        setStatus('idle');
        setQueuePosition(null);
        setError(null);
    }, [userId, sendMessage]);

    /**
     * Skip current partner
     */
    const skipPartner = useCallback((matchMode: 'buddies_first' | 'global' = 'global') => {
        if (!sessionId) return;

        play('CALL_DISCONNECT');
        sendMessage('skip', { sessionId, userId, matchMode });

        // Reset state for new search
        setSessionId(null);
        setPartnerId(null);
        setStatus('searching');

        // Play searching sound
        const audio = play('CALL_INCOMING', { loop: true, volumeOverride: 0.3 });
        if (audio) searchingSoundRef.current = audio;
    }, [sessionId, userId, play, sendMessage]);

    /**
     * End session
     */
    const endSession = useCallback(() => {
        if (sessionId) {
            sendMessage('end_session', { sessionId, userId });
        }

        // Stop searching sound if any
        if (searchingSoundRef.current) {
            searchingSoundRef.current.pause();
            searchingSoundRef.current = null;
        }

        setStatus('ended');
        setSessionId(null);
        setPartnerId(null);
    }, [sessionId, userId, sendMessage]);

    /**
     * Send WebRTC signal to partner
     */
    const sendSignal = useCallback((signal: any) => {
        if (!partnerId || !sessionId) return;

        sendMessage('signal', {
            sessionId,
            targetUserId: partnerId,
            signal
        });
    }, [partnerId, sessionId, sendMessage]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (searchingSoundRef.current) {
                searchingSoundRef.current.pause();
            }
        };
    }, []);

    return {
        status,
        sessionId,
        partnerId,
        isInitiator,
        error,
        queuePosition,
        startMatching,
        cancelSearch,
        skipPartner,
        endSession,
        sendSignal,
        setStatus // For manual state updates
    };
}
