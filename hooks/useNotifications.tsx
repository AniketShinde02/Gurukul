'use client'

import { create } from 'zustand'
import { toast } from 'react-hot-toast'

// Sound effect URLs (use free sounds or CDN)
const SOUNDS = {
    messageReceived: '/sounds/message-received.mp3',
    messageSent: '/sounds/message-sent.mp3',
    incomingCall: '/sounds/incoming-call.mp3',
    callConnected: '/sounds/call-connected.mp3',
    callEnded: '/sounds/call-ended.mp3',
    notification: '/sounds/notification.mp3',
}

type NotificationType = 'message' | 'dm' | 'call' | 'system'

interface Notification {
    id: string
    type: NotificationType
    title: string
    message: string
    avatarUrl?: string
    channelName?: string
    roomName?: string
    timestamp: Date
    read: boolean
}

interface NotificationState {
    notifications: Notification[]
    soundEnabled: boolean
    notificationsEnabled: boolean

    // Actions
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearAll: () => void
    toggleSound: () => void
    toggleNotifications: () => void

    // Sound
    playSound: (sound: keyof typeof SOUNDS) => void
}

// Preload audio elements for instant playback
const audioCache: Record<string, HTMLAudioElement> = {}

const preloadSounds = () => {
    if (typeof window === 'undefined') return

    Object.entries(SOUNDS).forEach(([key, url]) => {
        const audio = new Audio(url)
        audio.preload = 'auto'
        audio.volume = 0.5
        audioCache[key] = audio
    })
}

// Initialize sounds on first import (client-side only)
if (typeof window !== 'undefined') {
    preloadSounds()
}

export const useNotifications = create<NotificationState>((set, get) => ({
    notifications: [],
    soundEnabled: true,
    notificationsEnabled: true,

    addNotification: (notification) => {
        const { soundEnabled, notificationsEnabled } = get()

        if (!notificationsEnabled) return

        const newNotification: Notification = {
            ...notification,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            read: false,
        }

        set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep max 50
        }))

        // Show toast notification
        toast.custom((t) => (
            <div
                className={`${t.visible ? 'animate-in slide-in-from-top-2 fade-in' : 'animate-out slide-out-to-top fade-out'
                    } max-w-md w-full bg-stone-900 border border-white/10 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
            >
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        {notification.avatarUrl ? (
                            <div className="flex-shrink-0">
                                <img className="h-10 w-10 rounded-full" src={notification.avatarUrl} alt="" />
                            </div>
                        ) : (
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold">
                                {notification.title[0]?.toUpperCase()}
                            </div>
                        )}
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-white">
                                {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-stone-400 line-clamp-2">
                                {notification.message}
                            </p>
                            {notification.channelName && (
                                <p className="mt-1 text-xs text-stone-500">
                                    #{notification.channelName} • {notification.roomName}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-white/10">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-orange-500 hover:text-orange-400 focus:outline-none"
                    >
                        Close
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-right',
        })

        // Play sound
        if (soundEnabled) {
            const soundKey = notification.type === 'call' ? 'incomingCall' :
                notification.type === 'dm' ? 'messageReceived' :
                    'notification'
            get().playSound(soundKey)
        }
    },

    markAsRead: (id) => {
        set((state) => ({
            notifications: state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            )
        }))
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true }))
        }))
    },

    clearAll: () => {
        set({ notifications: [] })
    },

    toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }))
    },

    toggleNotifications: () => {
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled }))
    },

    playSound: (sound) => {
        const { soundEnabled } = get()
        if (!soundEnabled) return

        try {
            const audio = audioCache[sound]
            if (audio) {
                audio.currentTime = 0
                audio.play().catch(() => {
                    // Autoplay blocked - user hasn't interacted yet
                    console.log('Sound blocked - user interaction required')
                })
            }
        } catch (error) {
            console.error('Error playing sound:', error)
        }
    },
}))

// Helper function to show message notification
export function showMessageNotification(
    senderName: string,
    message: string,
    avatarUrl?: string,
    channelName?: string,
    roomName?: string,
    isDm = false
) {
    useNotifications.getState().addNotification({
        type: isDm ? 'dm' : 'message',
        title: senderName,
        message: message.length > 100 ? message.substring(0, 100) + '...' : message,
        avatarUrl,
        channelName,
        roomName,
    })
}

// Helper function to show call notification
export function showCallNotification(callerName: string, avatarUrl?: string) {
    useNotifications.getState().addNotification({
        type: 'call',
        title: 'Incoming Call',
        message: `${callerName} is calling you`,
        avatarUrl,
    })
}

// Helper function to play sounds manually
export function playSound(sound: keyof typeof SOUNDS) {
    useNotifications.getState().playSound(sound)
}
