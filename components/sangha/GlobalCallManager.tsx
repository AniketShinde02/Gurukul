'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    StartAudio,
    useTracks,
    GridLayout,
    ParticipantTile,
    useLocalParticipant,
    useIsSpeaking,
    useConnectionQualityIndicator,
    useRoomContext,
    VideoTrack,
    useParticipantInfo
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { TrackReferenceOrPlaceholder, TrackReference } from '@livekit/components-core';
import { Loader2, Minimize2, Maximize2, X, Mic, MicOff, Video, VideoOff, Settings, Volume2, Monitor, MonitorOff, PhoneOff, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticipantGrid } from './ParticipantGrid';
import { awardXP, XP_RATES } from '@/lib/xp';
import { supabase } from '@/lib/supabase/client';

interface CallContextType {
    joinRoom: (room: string) => void;
    leaveRoom: () => void;
    minimize: () => void;
    maximize: () => void;
    state: 'idle' | 'connecting' | 'connected';
    roomName: string | null;
    isMinimized: boolean;
    setVideoContainer: (element: HTMLElement | null) => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within a GlobalCallManager');
    return context;
};

export function GlobalCallManager({ children, username }: { children: ReactNode, username: string }) {
    const [roomName, setRoomName] = useState<string | null>(null);
    const [token, setToken] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [videoContainer, setVideoContainer] = useState<HTMLElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const intentionalDisconnect = useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Award XP for voice chat
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (connectionState === 'connected') {
            interval = setInterval(async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    awardXP(user.id, XP_RATES.VOICE_MINUTE, 'Voice chat activity')
                }
            }, 60000)
        }
        return () => clearInterval(interval)
    }, [connectionState])

    const leaveRoom = useCallback(() => {
        intentionalDisconnect.current = true;
        setRoomName(null);
        setToken('');
        setConnectionState('idle');
        setIsMinimized(false);
    }, []);

    const joinRoom = useCallback(async (room: string) => {
        if (roomName === room && connectionState !== 'idle') {
            setIsMinimized(false);
            return;
        }
        intentionalDisconnect.current = false;
        setRoomName(room);
        setConnectionState('connecting');
        setIsMinimized(false);

        try {
            const resp = await fetch(`/api/livekit/token?room=${room}&username=${username}`);
            if (!resp.ok) {
                setConnectionState('idle');
                return;
            }
            const data = await resp.json();
            setToken(data.token);
        } catch (e) {
            setConnectionState('idle');
        }
    }, [roomName, connectionState, username]);

    const handleDisconnected = useCallback(() => {
        if (intentionalDisconnect.current) {
            leaveRoom();
        }
    }, [leaveRoom]);

    return (
        <CallContext.Provider value={{ joinRoom, leaveRoom, minimize: () => setIsMinimized(true), maximize: () => setIsMinimized(false), state: connectionState, roomName, isMinimized, setVideoContainer }}>
            {children}

            {mounted && token && (
                createPortal(
                    <div className={videoContainer && !isMinimized
                        ? "w-full h-full"
                        : isMinimized
                            ? "fixed bottom-4 right-4 w-80 h-48 z-[100] rounded-xl overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-bottom-10 bg-stone-900"
                            : "fixed inset-0 z-[100] bg-black animate-in fade-in duration-300"
                    }>
                        <LiveKitRoom
                            video={{ resolution: { width: 1280, height: 720, frameRate: 30 } }}
                            audio={true}
                            token={token}
                            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                            connectOptions={{
                                autoSubscribe: true,
                            }}
                            options={{
                                adaptiveStream: true,
                                dynacast: true,
                                publishDefaults: {
                                    videoCodec: 'vp8',
                                },
                                audioCaptureDefaults: {
                                    echoCancellation: true,
                                    noiseSuppression: true,
                                    autoGainControl: true,
                                }
                            }}
                            style={{ height: '100%' }}
                            onConnected={() => setConnectionState('connected')}
                            onDisconnected={handleDisconnected}
                        >
                            {connectionState === 'connecting' && !isMinimized && !videoContainer && (
                                <div className="absolute inset-0 flex items-center justify-center bg-stone-950 z-50">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                    <p className="text-stone-400 mt-4 ml-2">Connecting to {roomName}...</p>
                                </div>
                            )}

                            {isMinimized ? (
                                <MiniPlayer onMaximize={() => setIsMinimized(false)} onLeave={leaveRoom} />
                            ) : (
                                <FullVideoUI onMinimize={() => setIsMinimized(true)} onLeave={leaveRoom} roomName={roomName || ''} />
                            )}

                            <RoomAudioRenderer />
                            <StartAudio label="Click to allow audio playback" />
                        </LiveKitRoom>
                    </div>,
                    (videoContainer && !isMinimized) ? videoContainer : document.body
                )
            )}
        </CallContext.Provider>
    );
}

function MiniPlayer({ onMaximize, onLeave }: { onMaximize: () => void, onLeave: () => void }) {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: true }
    );

    return (
        <div className="relative w-full h-full bg-stone-900 group">
            {tracks.length > 0 ? (
                <ParticipantTile trackRef={tracks[0]} />
            ) : (
                <div className="flex items-center justify-center h-full text-stone-500 text-xs">
                    Call in progress...
                </div>
            )}

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" onClick={onMaximize} title="Maximize">
                    <Maximize2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={onLeave} title="Disconnect">
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}

function FullVideoUI({ onMinimize, onLeave, roomName }: { onMinimize: () => void, onLeave: () => void, roomName: string }) {
    const { localParticipant } = useLocalParticipant();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [inputVolume, setInputVolume] = useState(100);
    const [outputVolume, setOutputVolume] = useState(100);

    const toggleMute = () => {
        if (localParticipant) {
            const newState = !isMuted;
            localParticipant.setMicrophoneEnabled(!newState);
            setIsMuted(newState);
        }
    };

    const toggleVideo = () => {
        if (localParticipant) {
            const newState = !isVideoEnabled;
            localParticipant.setCameraEnabled(newState);
            setIsVideoEnabled(newState);
        }
    };

    const handleInputVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputVolume(parseInt(e.target.value));
    };

    const handleOutputVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const volume = parseInt(e.target.value);
        setOutputVolume(volume);
        document.querySelectorAll('audio').forEach((audio) => {
            audio.volume = volume / 100;
        });
    };

    const handleDisconnect = () => {
        if (localParticipant) {
            localParticipant.setMicrophoneEnabled(false);
            localParticipant.setCameraEnabled(false);
        }
        onLeave();
    };

    return (
        <div className="relative h-full flex flex-col bg-stone-950">
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <Button size="icon" variant="secondary" onClick={onMinimize} className="bg-black/50 hover:bg-black/70 text-white border border-white/10 rounded-full">
                    <Minimize2 className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                <ParticipantGrid roomName={roomName} />
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-stone-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-full shadow-2xl z-50">
                <Button size="icon" variant={isMuted ? "destructive" : "secondary"} className={`rounded-full w-12 h-12 ${!isMuted ? 'bg-stone-800 hover:bg-stone-700' : ''}`} onClick={toggleMute}>
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button size="icon" variant={!isVideoEnabled ? "destructive" : "secondary"} className={`rounded-full w-12 h-12 ${isVideoEnabled ? 'bg-stone-800 hover:bg-stone-700' : ''}`} onClick={toggleVideo}>
                    {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>

                <div className="relative">
                    <Button size="icon" variant="secondary" className="rounded-full w-12 h-12 bg-stone-800 hover:bg-stone-700" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="w-5 h-5" />
                    </Button>

                    {showSettings && (
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-72 bg-stone-900 border border-white/10 rounded-xl shadow-2xl p-4 z-50">
                            <h3 className="text-xs font-bold text-stone-400 uppercase mb-4">Audio Settings</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-white flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Mic className="w-3 h-3" /> Input Volume</span>
                                        <span className="text-orange-500 font-mono">{inputVolume}%</span>
                                    </label>
                                    <input type="range" min="0" max="100" value={inputVolume} onChange={handleInputVolumeChange} className="w-full h-1 bg-stone-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Volume2 className="w-3 h-3" /> Output Volume</span>
                                        <span className="text-orange-500 font-mono">{outputVolume}%</span>
                                    </label>
                                    <input type="range" min="0" max="100" value={outputVolume} onChange={handleOutputVolumeChange} className="w-full h-1 bg-stone-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Button size="icon" variant="destructive" className="rounded-full w-12 h-12 bg-red-500 hover:bg-red-600 text-white" onClick={handleDisconnect}>
                    <PhoneOff className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}

function CustomVideoTile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
    const { participant, source } = trackRef;
    const isCameraEnabled = trackRef.publication?.isMuted === false && trackRef.publication?.isSubscribed !== false;

    return (
        <div className="relative w-full h-full bg-stone-900 rounded-2xl overflow-hidden border border-white/5 shadow-lg group">
            {isCameraEnabled && trackRef.publication ? (
                <VideoTrack
                    trackRef={trackRef as TrackReference}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800/50">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                        {participant.identity?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <p className="mt-4 text-stone-400 text-sm font-medium">
                        {participant.identity} (Camera Off)
                    </p>
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 z-10">
                <div className={`w-2 h-2 rounded-full ${participant.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-stone-500'}`} />
                <span className="text-xs font-medium text-white">
                    {participant.identity} {participant.isLocal && '(You)'}
                </span>
                {trackRef.publication?.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Signal className="w-4 h-4 text-green-500" />
            </div>
        </div>
    )
}
