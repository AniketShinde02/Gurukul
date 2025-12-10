'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, LogOut, Copy, User as UserIcon, Mic, MicOff, Video, VideoOff, Upload, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { useCall } from './GlobalCallManager'

interface UserProfilePopupProps {
    user: any
    isOpen: boolean
    onClose: () => void
    anchorRef: React.RefObject<HTMLDivElement | null>
}

export function UserProfilePopup({ user, isOpen, onClose, anchorRef }: UserProfilePopupProps) {
    const router = useRouter()
    const popupRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [position, setPosition] = useState({ top: 0, left: 0 })

    // Real user data from backend
    const [userData, setUserData] = useState({
        username: user?.username || '',
        full_name: user?.full_name || '',
        bio: user?.bio || '',
        avatar_url: user?.avatar_url || '',
        xp: user?.xp || 0,
        level: user?.level || 1
    })

    // Edit states
    const [isEditingName, setIsEditingName] = useState(false)
    const [isEditingBio, setIsEditingBio] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Temp edit values
    const [tempName, setTempName] = useState(userData.full_name)
    const [tempBio, setTempBio] = useState(userData.bio)

    // Voice controls
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)

    // Get call state for session safety
    const { state: callState } = useCall()
    const isInActiveCall = callState === 'connected'

    // Fetch fresh user data from backend
    useEffect(() => {
        if (isOpen && user?.id) {
            fetchUserData()
        }
    }, [isOpen, user?.id])

    const fetchUserData = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, full_name, bio, avatar_url, xp, level')
                .eq('id', user.id)
                .single()

            if (data && !error) {
                setUserData(data)
                setTempName(data.full_name || '')
                setTempBio(data.bio || '')
            }
        } catch (error) {
            console.error('Error fetching user data:', error)
        }
    }

    // Position popup above anchor, centered
    useEffect(() => {
        if (isOpen && anchorRef.current && popupRef.current) {
            const updatePosition = () => {
                const anchorRect = anchorRef.current!.getBoundingClientRect()
                const popupRect = popupRef.current!.getBoundingClientRect()

                // Position above anchor, centered horizontally
                const left = anchorRect.left + (anchorRect.width / 2) - (popupRect.width / 2)
                const top = anchorRect.top - popupRect.height - 12

                // Ensure popup stays within viewport
                const maxLeft = window.innerWidth - popupRect.width - 10
                const maxTop = window.innerHeight - popupRect.height - 10

                setPosition({
                    left: Math.max(10, Math.min(left, maxLeft)),
                    top: Math.max(10, Math.min(top, maxTop))
                })
            }

            updatePosition()
            window.addEventListener('resize', updatePosition)
            return () => window.removeEventListener('resize', updatePosition)
        }
    }, [isOpen, anchorRef])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
                anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose, anchorRef])

    // Handle avatar upload
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Session safety check
        if (isInActiveCall) {
            toast.error('Cannot change avatar during an active call')
            return
        }

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB')
            return
        }

        setIsUploading(true)

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath)

            // Update user profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            setUserData(prev => ({ ...prev, avatar_url: publicUrl }))
            toast.success('Avatar updated successfully!')

            // Trigger a refresh in parent components
            window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { avatar_url: publicUrl } }))
        } catch (error: any) {
            console.error('Avatar upload error:', error)
            toast.error(error.message || 'Failed to upload avatar')
        } finally {
            setIsUploading(false)
        }
    }

    // Save name
    const handleSaveName = async () => {
        if (!tempName.trim()) {
            toast.error('Name cannot be empty')
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: tempName.trim() })
                .eq('id', user.id)

            if (error) throw error

            setUserData(prev => ({ ...prev, full_name: tempName.trim() }))
            setIsEditingName(false)
            toast.success('Name updated!')

            window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { full_name: tempName.trim() } }))
        } catch (error: any) {
            toast.error(error.message || 'Failed to update name')
        } finally {
            setIsSaving(false)
        }
    }

    // Save bio
    const handleSaveBio = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ bio: tempBio.trim() })
                .eq('id', user.id)

            if (error) throw error

            setUserData(prev => ({ ...prev, bio: tempBio.trim() }))
            setIsEditingBio(false)
            toast.success('Bio updated!')

            window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { bio: tempBio.trim() } }))
        } catch (error: any) {
            toast.error(error.message || 'Failed to update bio')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCopyUserId = () => {
        navigator.clipboard.writeText(user?.id || 'unknown')
        toast.success('User ID copied!')
    }

    const handleLogout = async () => {
        if (isInActiveCall) {
            toast.error('Please leave the call before logging out')
            return
        }

        await supabase.auth.signOut()
        toast.success('Logged out successfully')
        window.location.href = '/'
    }

    if (!isOpen) return null
    if (typeof document === 'undefined') return null

    return createPortal(
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
            />

            <div
                ref={popupRef}
                className="fixed z-[9999] w-[340px] bg-stone-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
                style={{ top: `${position.top}px`, left: `${position.left}px` }}
            >
                {/* Compact Header */}
                <div className="relative h-16 bg-gradient-to-br from-orange-600 to-orange-800">
                    <div className="absolute -bottom-8 left-3">
                        <div className="relative group">
                            <Avatar className="w-16 h-16 border-4 border-stone-900 ring-2 ring-orange-500/20">
                                <AvatarImage src={userData.avatar_url || undefined} />
                                <AvatarFallback className="bg-orange-600 text-white text-xl font-bold">
                                    {userData.username?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                {isUploading ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5 text-white" />
                                )}
                            </button>
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-stone-900" />
                        </div>
                    </div>
                </div>

                {/* Level Progress */}
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="text-[10px] font-bold text-orange-400">LVL {userData.level}</div>
                    <div className="w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                            style={{ width: `${Math.min(100, (userData.xp / (userData.level * 1000)) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* User Info */}
                <div className="pt-10 px-3 pb-3">
                    {/* Name - Editable */}
                    <div className="mb-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="h-8 text-sm bg-stone-950 border-orange-500/50"
                                    placeholder="Your name"
                                    autoFocus
                                />
                                <Button
                                    size="sm"
                                    onClick={handleSaveName}
                                    disabled={isSaving}
                                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setIsEditingName(false)
                                        setTempName(userData.full_name)
                                    }}
                                    className="h-8 w-8 p-0 bg-stone-700 hover:bg-stone-600"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingName(true)}
                                className="group cursor-pointer hover:bg-stone-800/50 rounded px-2 py-1 transition-colors"
                            >
                                <h3 className="text-base font-bold text-white">
                                    {userData.full_name || 'Set your name'}
                                </h3>
                                <p className="text-xs text-stone-400">@{userData.username}</p>
                            </div>
                        )}
                    </div>

                    {/* Bio - Editable */}
                    <div className="mb-3">
                        {isEditingBio ? (
                            <div className="space-y-2">
                                <textarea
                                    value={tempBio}
                                    onChange={(e) => setTempBio(e.target.value)}
                                    className="w-full h-16 text-xs bg-stone-950 border border-orange-500/50 rounded-lg p-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    placeholder="Tell us about yourself..."
                                    maxLength={150}
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveBio}
                                        disabled={isSaving}
                                        className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                                    >
                                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setIsEditingBio(false)
                                            setTempBio(userData.bio)
                                        }}
                                        className="flex-1 h-7 text-xs bg-stone-700 hover:bg-stone-600"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingBio(true)}
                                className="bg-stone-950 rounded-lg p-2 cursor-pointer hover:bg-stone-800 transition-colors min-h-[40px]"
                            >
                                <p className="text-xs text-stone-400 italic">
                                    {userData.bio || 'Click to add a bio...'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions - Compact */}
                    <div className="space-y-1 mb-2">
                        <button
                            onClick={() => {
                                onClose()
                                router.push('/settings')
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-800 transition-colors text-left group text-sm"
                        >
                            <Settings className="w-3.5 h-3.5 text-stone-400 group-hover:text-white" />
                            <span className="text-white">Full Settings</span>
                        </button>

                        <button
                            onClick={handleCopyUserId}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-800 transition-colors text-left group text-sm"
                        >
                            <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-white" />
                            <span className="text-white">Copy User ID</span>
                        </button>
                    </div>

                    {/* Voice Controls - Compact */}
                    {isInActiveCall && (
                        <div className="flex gap-1.5 mb-2">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-xs ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-800 hover:bg-stone-700'
                                    }`}
                            >
                                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                <span className="font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
                            </button>

                            <button
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-xs ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-800 hover:bg-stone-700'
                                    }`}
                            >
                                {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                                <span className="font-medium">{isVideoOff ? 'Cam Off' : 'Cam On'}</span>
                            </button>
                        </div>
                    )}

                    {/* Logout - Compact */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-left group border-t border-white/5 pt-2 text-sm"
                    >
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-red-400 font-medium">Log Out</span>
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}
