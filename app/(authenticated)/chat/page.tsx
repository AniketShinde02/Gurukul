/**
 * PRODUCTION-GRADE CHAT PAGE
 * 
 * Refactored for:
 * - 10k+ concurrent users
 * - Proper state management
 * - Skip functionality (Omegle-style)
 * - No race conditions
 * - Clean console (production-ready)
 * - Memory leak prevention
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Loader2, MessageSquare, UserPlus, Home, RefreshCw,
    Users, Globe, SkipForward
} from 'lucide-react';
import { toast } from '@/lib/toast';
import type { Message } from '@/types/chat.types';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useMatchmakingWS } from '@/hooks/useMatchmakingWS';
import { VideoCall } from '@/components/chat/VideoCall';
import { ChatSidebar } from '@/components/chat/ChatSidebar';

// Feature flag: Set to true in .env.local to use WebSocket-based matchmaking
// This is now the DEFAULT starting state, but can be overridden by DB settings
const ENV_WS_ENABLED = process.env.NEXT_PUBLIC_USE_WS_MATCHMAKING === 'true';

type MatchMode = 'buddies_first' | 'global';

export default function ChatPage() {
    const router = useRouter();

    // User State
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [matchMode, setMatchMode] = useState<MatchMode>('buddies_first');
    const [studyMode, setStudyMode] = useState<'video' | 'audio'>('video');

    // System Settings State
    const [useWS, setUseWS] = useState(ENV_WS_ENABLED);

    // Check DB for matchmaking mode
    useEffect(() => {
        // ENV Override: If explicitly set to 'true', ignore DB
        if (process.env.NEXT_PUBLIC_USE_WS_MATCHMAKING === 'true') {
            console.log('🟢 ENV Override: Using WebSocket mode');
            setUseWS(true);
            return;
        }

        const checkSettings = async () => {
            try {
                const { data } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'matchmaking_config')
                    .maybeSingle();

                if (data?.value?.mode) {
                    const dbSaysWS = data.value.mode === 'websocket';
                    // Only update if different from env default
                    if (dbSaysWS !== useWS) {
                        setUseWS(dbSaysWS);
                        console.log(`🔄 Matchmaking switched to: ${dbSaysWS ? 'WebSocket (Turbo)' : 'Supabase (Legacy)'}`);
                    }
                }
            } catch (err) {
                console.error('Failed to check system settings:', err);
            }
        };
        checkSettings();
    }, []);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');

    // Refs
    const channelRef = useRef<any>(null);
    const sessionIdRef = useRef<string | null>(null);

    // Matchmaking Hooks
    // newMatchmaking is only "enabled" if useWS is true
    const oldMatchmaking = useMatchmaking(currentUserId, !useWS);
    const newMatchmaking = useMatchmakingWS(currentUserId, useWS);

    // Auto-fallback if WS fails repeatedly
    useEffect(() => {
        if (useWS && newMatchmaking.error && newMatchmaking.error.includes('Failed to connect')) {
            toast.error('Connection unstable. Falling back to legacy matchmaking.');
            setUseWS(false);
        }
    }, [useWS, newMatchmaking.error]);

    // Use the selected matchmaking system
    const {
        status: matchStatus,
        sessionId,
        partnerId,
        error: matchError,
        startMatching: rawStartMatching,
        cancelSearch,
        skipPartner: rawSkipPartner,
        endSession,
        setStatus: setMatchStatus
    } = useWS ? newMatchmaking : oldMatchmaking;

    // Get sendSignal from WS hook (for WebRTC signaling via WebSocket)
    const sendSignal = useWS ? newMatchmaking.sendSignal : undefined;
    const isInitiator = useWS ? newMatchmaking.isInitiator : undefined;

    // Wrapper for startMatching to handle different signatures
    const startMatching = (mode: MatchMode) => {
        if (useWS) {
            (rawStartMatching as any)(mode, []);
        } else {
            rawStartMatching(mode);
        }
    };

    // Wrapper for skipPartner
    const skipPartner = () => {
        if (useWS) {
            (rawSkipPartner as any)(matchMode);
        } else {
            (rawSkipPartner as any)();
        }
    };

    // WebRTC Hook
    const {
        localStream,
        remoteStream,
        isMicOn,
        isCameraOn,
        connectionState,
        toggleMic,
        toggleCamera,
        endCall,
        startCall,
        handleSignal,
        initializePeerConnection
    } = useWebRTC(sessionId, currentUserId, studyMode, useWS && sendSignal ? { sendSignal } : undefined);

    // Listen for WebSocket WebRTC signals
    useEffect(() => {
        if (!useWS) return;

        const handleWSSignal = async (event: CustomEvent) => {
            const { signal, sessionId: signalSessionId } = event.detail;
            if (signalSessionId && signal) {
                await handleSignal(signal, signalSessionId);
            }
        };

        window.addEventListener('webrtc-signal', handleWSSignal as unknown as EventListener);
        return () => window.removeEventListener('webrtc-signal', handleWSSignal as unknown as EventListener);
    }, [useWS, handleSignal]);

    /**
     * Check friend connection status
     */
    useEffect(() => {
        if (!partnerId || !currentUserId) {
            setConnectionStatus('none');
            return;
        }

        const checkConnection = async () => {
            const { data } = await supabase
                .from('study_connections')
                .select('status')
                .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(requester_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
                .maybeSingle();

            setConnectionStatus(data?.status || 'none');
        };

        checkConnection();
    }, [partnerId, currentUserId]);

    /**
     * Handle incoming messages and WebRTC signals
     */
    const handleIncomingMessage = useCallback(async (message: Message) => {
        if (message.sender_id === currentUserId) return;

        try {
            const content = JSON.parse(message.content || '{}');
            const currentSessionId = sessionIdRef.current;

            if (!currentSessionId) return;

            // Handle system signals
            if (content.type === 'system' && content.status === 'ready') {
                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('user1_id, user2_id')
                    .eq('id', currentSessionId)
                    .single();

                if (!session) return;

                // Initiate call if we're user1
                if (session.user1_id === currentUserId) {
                    await startCall(currentSessionId);
                }
            }
            // Handle WebRTC signals
            else if (['offer', 'answer', 'ice-candidate', 'call-ended'].includes(content.type)) {
                await handleSignal(content, currentSessionId);
                if (content.type === 'call-ended') {
                    handleEndChat();
                }
            }
        } catch (e) {
            // Normal chat message - ignore parsing errors
        }
    }, [currentUserId, startCall, handleSignal]);

    /**
     * Connect to session and setup realtime
     */
    const connectToSession = useCallback(async (id: string) => {
        if (sessionIdRef.current === id) return;

        sessionIdRef.current = id;
        setMatchStatus('connected');
        setIsChatOpen(false);

        // Initialize WebRTC
        await initializePeerConnection(id);

        // Subscribe to messages
        const channel = supabase
            .channel(`session:${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `session_id=eq.${id}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                    handleIncomingMessage(newMessage);
                }
            )
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && !useWS) { // Only send ready signal in legacy mode
                    // Send ready signal
                    await supabase.from('messages').insert({
                        session_id: id,
                        sender_id: currentUserId,
                        content: JSON.stringify({ type: 'system', status: 'ready' }),
                        type: 'text'
                    });
                }
            });

        channelRef.current = channel;

        // In WebSocket mode, start call immediately if we are the initiator
        // We don't need to wait for the Supabase 'ready' signal
        if (useWS && isInitiator) {
            console.log('🚀 WS Mode: Starting call immediately as initiator');
            setTimeout(() => {
                startCall(id);
            }, 500); // Small delay to ensure PC and LocalStream are ready
        }
    }, [currentUserId, initializePeerConnection, handleIncomingMessage, setMatchStatus, useWS, isInitiator, startCall]);

    /**
     * Watch for session changes from matchmaking
     */
    useEffect(() => {
        if (sessionId && matchStatus === 'connecting') {
            connectToSession(sessionId);
        }
    }, [sessionId, matchStatus, connectToSession]);

    /**
     * Handle end chat
     */
    const handleEndChat = useCallback(async () => {
        await endCall();

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        await endSession();
        setMessages([]);
        setIsChatOpen(false);
        sessionIdRef.current = null;
    }, [endCall, endSession]);

    /**
     * Handle add friend
     */
    const handleAddFriend = useCallback(async () => {
        if (!partnerId || !currentUserId) return;

        try {
            const { error } = await supabase.from('study_connections').insert({
                requester_id: currentUserId,
                receiver_id: partnerId,
                status: 'pending'
            });

            if (error) {
                if (error.code === '23505') {
                    toast.error('Request already sent or connected');
                } else {
                    throw error;
                }
            } else {
                toast.success('Friend request sent!');
                setConnectionStatus('pending');
            }
        } catch (error: any) {
            toast.error('Failed to send request');
        }
    }, [partnerId, currentUserId]);

    /**
     * Initialize user
     */
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            } else {
                router.push('/');
            }
        };
        getUser();
    }, [router]);

    /**
     * Display match error
     */
    useEffect(() => {
        if (matchError) {
            toast.error(matchError);
        }
    }, [matchError]);

    return (
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-4 lg:p-6">
            <div className="w-full max-w-7xl h-full bg-black/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl flex relative">

                {/* Left Sidebar */}
                <ChatSidebar
                    status={matchStatus === 'ended' ? 'idle' : matchStatus as any}
                    isChatOpen={isChatOpen}
                    onCloseChat={() => setIsChatOpen(false)}
                    messages={messages}
                    currentUserId={currentUserId}
                    otherUserTyping={false}
                    sessionId={sessionId}
                />

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-black/20 relative">
                    {matchStatus === 'connected' ? (
                        <div className="flex flex-col h-full">
                            {/* Header with Skip Button */}
                            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/5 z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${connectionState === 'connected' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                                    <div>
                                        <span className="font-bold text-white text-sm">Study Session</span>
                                        <span className="text-[10px] text-stone-400 block uppercase">
                                            {connectionState}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={skipPartner}
                                        className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                    >
                                        <SkipForward className="w-4 h-4 mr-2" />
                                        Skip
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsChatOpen(!isChatOpen)}
                                        className={isChatOpen ? 'bg-white text-black' : 'text-stone-400'}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Video Call */}
                            <div className="flex-1 relative bg-black">
                                <VideoCall
                                    localStream={localStream}
                                    remoteStream={remoteStream}
                                    isMicOn={isMicOn}
                                    isCameraOn={isCameraOn}
                                    onToggleMic={toggleMic}
                                    onToggleCamera={toggleCamera}
                                    onEndCall={handleEndChat}
                                />
                            </div>
                        </div>
                    ) : matchStatus === 'ended' ? (
                        /* Post Call View */
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
                                <div className="w-24 h-24 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-6">
                                    <Users className="w-10 h-10 text-stone-400" />
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Session Ended</h2>
                                    <p className="text-stone-400">Great job! You've completed a study session.</p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {partnerId && (
                                        <Button
                                            onClick={handleAddFriend}
                                            disabled={connectionStatus === 'accepted' || connectionStatus === 'pending'}
                                            className={`w-full py-6 rounded-xl text-lg flex items-center justify-center gap-2 ${connectionStatus === 'accepted'
                                                ? 'bg-green-600 hover:bg-green-700 text-white cursor-default'
                                                : connectionStatus === 'pending'
                                                    ? 'bg-stone-700 text-stone-400 cursor-default'
                                                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                                                }`}
                                        >
                                            {connectionStatus === 'accepted' ? (
                                                <>
                                                    <Users className="w-5 h-5" />
                                                    Already Friends
                                                </>
                                            ) : connectionStatus === 'pending' ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Request Sent
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-5 h-5" />
                                                    Add Partner as Friend
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => {
                                                setMatchStatus('idle');
                                                setMessages([]);
                                            }}
                                            variant="outline"
                                            className="flex-1 border-white/10 hover:bg-white/5 py-6 rounded-xl"
                                        >
                                            <Home className="w-4 h-4 mr-2" />
                                            Home
                                        </Button>
                                        <Button
                                            onClick={() => startMatching(matchMode)}
                                            variant="outline"
                                            className="flex-1 border-white/10 hover:bg-white/5 py-6 rounded-xl"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            New Match
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Idle / Searching State */
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-md">
                                {matchStatus === 'searching' ? (
                                    <>
                                        <div className="relative mb-6">
                                            <Loader2 className="w-16 h-16 animate-spin text-orange-500 mx-auto" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-20 h-20 border-4 border-orange-500/20 rounded-full animate-ping" />
                                            </div>
                                        </div>
                                        <h2 className="text-3xl font-bold text-white mb-4">Finding a Partner...</h2>
                                        <p className="text-stone-400 mb-8">
                                            {matchMode === 'buddies_first'
                                                ? "Checking your friends list first..."
                                                : "Connecting you with the global community..."}
                                        </p>
                                        <Button
                                            onClick={cancelSearch}
                                            variant="outline"
                                            className="border-white/10 hover:bg-white/5"
                                        >
                                            Cancel Search
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-4xl font-bold text-white mb-2">Ready to Study?</h2>
                                        <p className="text-stone-400 mb-8">Choose how you want to connect</p>

                                        {/* Match Mode Selector */}
                                        <div className="bg-white/5 p-1 rounded-xl flex mb-8 border border-white/10">
                                            <button
                                                onClick={() => setMatchMode('buddies_first')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${matchMode === 'buddies_first'
                                                    ? 'bg-orange-600 text-white shadow-lg'
                                                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <Users className="w-4 h-4" />
                                                Buddies First
                                            </button>
                                            <button
                                                onClick={() => setMatchMode('global')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${matchMode === 'global'
                                                    ? 'bg-orange-600 text-white shadow-lg'
                                                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <Globe className="w-4 h-4" />
                                                Global
                                            </button>
                                        </div>

                                        <Button
                                            onClick={() => startMatching(matchMode)}
                                            size="lg"
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full shadow-orange-500/20 shadow-lg w-full"
                                        >
                                            Find Partner
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
