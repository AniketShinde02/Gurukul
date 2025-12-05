'use client'

import { useState, useEffect } from 'react'
import { Disc, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATIONS = [
    { name: 'Lofi Girl - Study', id: 'jfKfPfyJRdk' },
    { name: 'Lofi Girl - Sleep', id: 'rUxyKA_-grg' },
    { name: 'Synthwave', id: '4xDzrJKXOOY' },
    { name: 'Jazz Vibes', id: 'Dx5qFachd3A' }
]

export function LoFiPlayer() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentStation, setCurrentStation] = useState(STATIONS[0])
    const [volume, setVolume] = useState(50)
    const [lastVolume, setLastVolume] = useState(50)
    const [player, setPlayer] = useState<any>(null)

    // Update volume when it changes
    useEffect(() => {
        if (player && player.setVolume) {
            player.setVolume(volume)
        }
    }, [volume, player])

    const handleVolumeClick = () => {
        if (volume > 0) {
            setLastVolume(volume)
            setVolume(0)
        } else {
            setVolume(lastVolume || 50)
        }
    }

    // Initialize YouTube Player
    useEffect(() => {
        // Load YouTube IFrame API if not loaded
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const initPlayer = () => {
            if (!document.getElementById('youtube-player-hidden')) return;

            // If player already exists, just load the new video
            if (player && typeof player.loadVideoById === 'function') {
                player.loadVideoById(currentStation.id);
                if (isPlaying) {
                    player.playVideo();
                } else {
                    player.pauseVideo();
                }
                return;
            }

            // Create new player
            const newPlayer = new (window as any).YT.Player(`youtube-player-hidden`, {
                height: '0',
                width: '0',
                videoId: currentStation.id,
                playerVars: {
                    'autoplay': isPlaying ? 1 : 0,
                    'controls': 0,
                    'enablejsapi': 1,
                },
                events: {
                    'onReady': (event: any) => {
                        setPlayer(event.target)
                        event.target.setVolume(volume)
                        if (isPlaying) event.target.playVideo()
                    }
                }
            });
        }

        if ((window as any).YT && (window as any).YT.Player) {
            initPlayer();
        } else {
            (window as any).onYouTubeIframeAPIReady = initPlayer;
        }

    }, [currentStation.id])

    // Handle Play/Pause State
    useEffect(() => {
        if (player && typeof player.playVideo === 'function') {
            if (isPlaying) {
                player.playVideo()
            } else {
                player.pauseVideo()
            }
        }
    }, [isPlaying, player])


    return (
        <div className="bg-stone-900/50 border border-white/10 rounded-xl p-3 flex flex-col gap-3 shadow-sm relative group/player">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn("w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center shrink-0", isPlaying && "animate-spin-slow")}>
                        <Disc className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Lo-Fi Radio</span>
                        <select
                            value={currentStation.id}
                            onChange={(e) => {
                                const station = STATIONS.find(s => s.id === e.target.value)
                                if (station) {
                                    setCurrentStation(station)
                                    setIsPlaying(true)
                                }
                            }}
                            className="bg-transparent text-xs font-bold text-white border-none p-0 focus:ring-0 cursor-pointer truncate w-full"
                        >
                            {STATIONS.map(s => (
                                <option key={s.id} value={s.id} className="bg-stone-900 text-stone-300">{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white transition-colors border border-white/5 shrink-0"
                >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>
            </div>

            {/* Volume Control Bar - Bottom */}
            <div className="flex items-center gap-2 px-0.5">
                <div onClick={handleVolumeClick} className="cursor-pointer shrink-0" onDoubleClick={handleVolumeClick}>
                    {volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-stone-500 hover:text-stone-300 transition-colors" />
                    ) : (
                        <Volume2 className="w-3.5 h-3.5 text-stone-500 hover:text-stone-300 transition-colors" />
                    )}
                </div>

                <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1 bg-stone-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-400 hover:[&::-webkit-slider-thumb]:bg-white transition-all"
                />
            </div>

            {/* Hidden Container for YouTube API */}
            <div id="youtube-player-hidden" className="hidden"></div>
        </div>
    )
}
