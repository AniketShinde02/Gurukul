'use client';

import { useCallback, useRef, useEffect } from 'react';

// Map of sound IDs to their file paths in /public
export const SOUNDS = {
    // Chat
    MESSAGE_SEND: '/sounds/message_send.mp3',
    MESSAGE_RECEIV: '/sounds/message_receive.mp3',
    MESSAGE_ROOM: '/sounds/message_rooms.mp3', // Fixed: was message_room.mp3

    // Call / Video
    CALL_INCOMING: '/sounds/call_in_ring.mp3', // Needs loop
    CALL_CONNECT: '/sounds/call_connect.mp3',
    CALL_DISCONNECT: '/sounds/call_disconnect.mp3',
    USER_JOIN: '/sounds/user_join.mp3',
    USER_LEAVE: '/sounds/user_leave.mp3',

    // App / Gamification
    MATCH_FOUND: '/sounds/match_found.mp3',
    XP_GAIN: '/sounds/xp_gain_chime.mp3',
    POMODORO_ALARM: '/sounds/singing_bowl.mp3',

    // UI Interactions
    CLICK_SOFT: '/sounds/notification.mp3', // Using notification.mp3 as soft click
    ERROR: '/sounds/error_thud.mp3',
    SUCCESS: '/sounds/success_chime.mp3',
} as const;

export type SoundKey = keyof typeof SOUNDS;

// Simple cache to avoid re-fetching
const audioCache: Record<string, HTMLAudioElement> = {};

export function useSound() {
    // TODO: In the future, hook this up to a global useSettings() store
    const isSoundEnabled = true;
    const volume = 0.7; // Default volume 70%

    // Preload function
    const preload = useCallback((key: SoundKey) => {
        const path = SOUNDS[key];
        if (!audioCache[path]) {
            const audio = new Audio(path);
            audioCache[path] = audio;
        }
    }, []);

    // Play function
    const play = useCallback((key: SoundKey, options?: { loop?: boolean, volumeOverride?: number }) => {
        if (!isSoundEnabled) return;

        const path = SOUNDS[key];

        // Create a new instance for overlapping sounds (like rapid typing/messages)
        // OR use cached for larger consistency. For UI pops, new instance is usually better for rapidity.
        // For ringtones, we want single instance.

        const audio = new Audio(path);
        audio.volume = options?.volumeOverride ?? volume;
        audio.loop = options?.loop ?? false;

        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                // Auto-play was prevented
                console.warn('Audio playback failed:', error);
            });
        }

        return audio; // Return instance in case we need to .pause() it (like a ringtone)
    }, [isSoundEnabled, volume]);

    return { play, preload, SOUNDS };
}
