'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Loader2, Mic, Video, User, Shield, Key, Bell, LogOut } from 'lucide-react'
import { useMediaDeviceSelect } from '@livekit/components-react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function UserSettingsModal({ isOpen, onClose, currentUser }: { isOpen: boolean, onClose: () => void, currentUser?: any }) {
    const [activeTab, setActiveTab] = useState('account')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4" onClick={onClose}>
            <div className="bg-stone-900 w-full max-w-[900px] max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-200 border border-white/10" onClick={e => e.stopPropagation()}>

                {/* Sidebar */}
                <div className="w-60 bg-stone-950/80 backdrop-blur-md p-0 flex flex-col border-r border-white/5">
                    <div className="p-4 pt-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
                        <div className="text-xs font-bold text-stone-400 px-2 mb-2 uppercase tracking-wider">User Settings</div>
                        <div className="space-y-0.5">
                            <SidebarItem icon={User} label="My Account" active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
                            <SidebarItem icon={Shield} label="Privacy & Safety" active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} />
                        </div>

                        <div className="h-px bg-white/5 my-4 mx-2" />

                        <div className="text-xs font-bold text-stone-400 px-2 mb-2 uppercase tracking-wider">App Settings</div>
                        <div className="space-y-0.5">
                            <SidebarItem icon={Mic} label="Voice & Video" active={activeTab === 'voice'} onClick={() => setActiveTab('voice')} />
                            <SidebarItem icon={Bell} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                            <SidebarItem icon={Key} label="Keybinds" active={activeTab === 'keybinds'} onClick={() => setActiveTab('keybinds')} />
                        </div>

                        <div className="h-px bg-white/5 my-4 mx-2" />

                        <div className="space-y-0.5">
                            <SidebarItem icon={LogOut} label="Log Out" active={false} onClick={() => { }} className="text-red-400 hover:bg-red-500/10 hover:text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-stone-900 flex flex-col relative overflow-hidden">
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-center">
                        <button onClick={onClose} className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-stone-600 text-stone-400 hover:bg-stone-800 hover:text-white hover:border-stone-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="text-[11px] font-bold text-stone-500 text-center mt-1">ESC</div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent p-10">
                        {activeTab === 'voice' && <VoiceVideoSettings />}
                        {activeTab === 'account' && <MyAccountSettings user={currentUser} />}
                        {activeTab === 'privacy' && <PrivacySafetySettings />}
                        {activeTab === 'notifications' && <NotificationsSettings />}
                        {activeTab === 'keybinds' && <KeybindsSettings />}
                    </div>
                </div>
            </div>
        </div>
    )
}

function SidebarItem({ icon: Icon, label, active, onClick, className = '' }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-sm font-medium transition-colors ${active
                ? 'bg-orange-600/20 text-orange-500 border-l-2 border-orange-500'
                : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
                } ${className}`}
        >
            {label}
        </button>
    )
}

function VoiceVideoSettings() {
    const [inputVolume, setInputVolume] = useState(100);
    const [outputVolume, setOutputVolume] = useState(100);
    const [isTesting, setIsTesting] = useState(false);
    const [micLevel, setMicLevel] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleMicTest = async () => {
        if (isTesting) {
            setIsTesting(false);
            setMicLevel(0);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            microphone.connect(analyser);
            analyser.fftSize = 256;

            setIsTesting(true);

            const checkLevel = () => {
                if (!isTesting) {
                    stream.getTracks().forEach(track => track.stop());
                    audioContext.close();
                    return;
                }
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setMicLevel(Math.min(100, (average / 255) * 100 * 2));
                requestAnimationFrame(checkLevel);
            };
            checkLevel();
        } catch (error) {
            console.error('Mic test failed:', error);
            toast.error('Could not access microphone');
        }
    };

    const toggleCamera = async () => {
        if (showCamera) {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            setShowCamera(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setShowCamera(true);
                }
            } catch (error) {
                console.error('Camera failed:', error);
                toast.error('Could not access camera');
            }
        }
    };

    return (
        <div className="space-y-8 max-w-xl">
            <h2 className="text-xl font-bold text-white mb-6">Voice & Video Settings</h2>

            <div className="space-y-6">
                <DeviceSelect kind="audioinput" label="INPUT DEVICE" />
                <DeviceSelect kind="audiooutput" label="OUTPUT DEVICE" />

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Input Volume</label>
                        <span className="text-xs text-orange-500 font-mono">{inputVolume}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={inputVolume}
                        onChange={(e) => setInputVolume(Number(e.target.value))}
                        className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Output Volume</label>
                        <span className="text-xs text-orange-500 font-mono">{outputVolume}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={outputVolume}
                        onChange={(e) => setOutputVolume(Number(e.target.value))}
                        className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                </div>

                <div className="pt-4 border-t border-white/10">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Mic Test</label>
                    <div className="space-y-3">
                        <Button
                            variant="secondary"
                            className={`w-full ${isTesting ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
                            onClick={handleMicTest}
                        >
                            {isTesting ? 'Stop Testing' : "Let's Check"}
                        </Button>
                        {isTesting && (
                            <div className="space-y-2">
                                <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-100"
                                        style={{ width: `${micLevel}%` }}
                                    />
                                </div>
                                <p className="text-xs text-stone-400 text-center">Speak to test your microphone</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Camera Test</label>
                    <div className="space-y-3">
                        <Button
                            variant="secondary"
                            className={`w-full ${showCamera ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
                            onClick={toggleCamera}
                        >
                            <Video className="w-4 h-4 mr-2" />
                            {showCamera ? 'Stop Camera' : 'Test Camera'}
                        </Button>
                        {showCamera && (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                className="w-full rounded-lg bg-black transform scale-x-[-1]"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DeviceSelect({ kind, label }: { kind: MediaDeviceKind, label: string }) {
    const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{label}</label>
            <select
                value={activeDeviceId}
                onChange={(e) => setActiveMediaDevice(e.target.value)}
                className="w-full bg-stone-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
                {devices?.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

function MyAccountSettings({ user }: { user: any }) {
    const [isEditingName, setIsEditingName] = useState(false)
    const [isEditingUsername, setIsEditingUsername] = useState(false)
    const [tempName, setTempName] = useState(user?.full_name || '')
    const [tempUsername, setTempUsername] = useState(user?.username || '')
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveName = async () => {
        if (!tempName.trim()) {
            toast.error('Display name cannot be empty')
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: tempName.trim() })
                .eq('id', user.id)

            if (error) throw error

            setIsEditingName(false)
            toast.success('Display name updated!')
            window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { full_name: tempName.trim() } }))
        } catch (error: any) {
            toast.error(error.message || 'Failed to update name')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveUsername = async () => {
        if (!tempUsername.trim()) {
            toast.error('Username cannot be empty')
            return
        }

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
        if (!usernameRegex.test(tempUsername)) {
            toast.error('Username must be 3-20 characters (letters, numbers, underscore only)')
            return
        }

        setIsSaving(true)
        try {
            // Check if username is already taken
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', tempUsername.trim())
                .neq('id', user.id)
                .single()

            if (existing) {
                toast.error('Username already taken')
                setIsSaving(false)
                return
            }

            const { error } = await supabase
                .from('profiles')
                .update({ username: tempUsername.trim() })
                .eq('id', user.id)

            if (error) throw error

            setIsEditingUsername(false)
            toast.success('Username updated!')
            window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { username: tempUsername.trim() } }))
        } catch (error: any) {
            toast.error(error.message || 'Failed to update username')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">My Account</h2>
            <div className="bg-stone-950 border border-white/10 rounded-lg p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-orange-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                        {user?.username?.[0]?.toUpperCase() || 'ME'}
                    </div>
                    <div className="flex-1 min-w-0">
                        {/* Display Name */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-stone-400 text-xs font-bold uppercase">Display Name</span>
                                {!isEditingName && (
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="text-xs bg-stone-800 px-3 py-1 rounded text-white hover:bg-stone-700 transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="flex-1 bg-stone-900 border-orange-500/50"
                                        placeholder="Your display name"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleSaveName}
                                        disabled={isSaving}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setIsEditingName(false)
                                            setTempName(user?.full_name || '')
                                        }}
                                        variant="secondary"
                                        className="bg-stone-800 hover:bg-stone-700"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-white font-medium">{user?.full_name || 'Not set'}</div>
                            )}
                        </div>

                        {/* Username */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-stone-400 text-xs font-bold uppercase">Username</span>
                                {!isEditingUsername && (
                                    <button
                                        onClick={() => setIsEditingUsername(true)}
                                        className="text-xs bg-stone-800 px-3 py-1 rounded text-white hover:bg-stone-700 transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            {isEditingUsername ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={tempUsername}
                                            onChange={(e) => setTempUsername(e.target.value)}
                                            className="flex-1 bg-stone-900 border-orange-500/50"
                                            placeholder="username"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleSaveUsername}
                                            disabled={isSaving}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setIsEditingUsername(false)
                                                setTempUsername(user?.username || '')
                                            }}
                                            variant="secondary"
                                            className="bg-stone-800 hover:bg-stone-700"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    <p className="text-xs text-stone-500">3-20 characters, letters, numbers, and underscore only</p>
                                </div>
                            ) : (
                                <div className="text-white font-medium font-mono">@{user?.username || 'username'}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Email (Read-only) */}
                <div className="pt-4 border-t border-white/10">
                    <span className="text-stone-400 text-xs font-bold uppercase block mb-2">Email</span>
                    <div className="text-white font-medium">{user?.email || 'No email'}</div>
                    <p className="text-xs text-stone-500 mt-1">Email cannot be changed</p>
                </div>
            </div>
        </div>
    )
}

function PrivacySafetySettings() {
    const [allowDMs, setAllowDMs] = useState(true);
    const [showActivity, setShowActivity] = useState(true);
    const [allowFriendRequests, setAllowFriendRequests] = useState(true);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Privacy & Safety</h2>
            <div className="space-y-4">
                <ToggleSetting
                    label="Allow Direct Messages"
                    description="Allow other users to send you direct messages"
                    checked={allowDMs}
                    onChange={setAllowDMs}
                />
                <ToggleSetting
                    label="Show Activity Status"
                    description="Let others see when you're online"
                    checked={showActivity}
                    onChange={setShowActivity}
                />
                <ToggleSetting
                    label="Allow Friend Requests"
                    description="Allow others to send you friend requests"
                    checked={allowFriendRequests}
                    onChange={setAllowFriendRequests}
                />
            </div>
        </div>
    )
}

function NotificationsSettings() {
    const [messageNotifs, setMessageNotifs] = useState(true);
    const [mentionNotifs, setMentionNotifs] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Notifications</h2>
            <div className="space-y-4">
                <ToggleSetting
                    label="Message Notifications"
                    description="Get notified when you receive a message"
                    checked={messageNotifs}
                    onChange={setMessageNotifs}
                />
                <ToggleSetting
                    label="Mention Notifications"
                    description="Get notified when someone mentions you"
                    checked={mentionNotifs}
                    onChange={setMentionNotifs}
                />
                <ToggleSetting
                    label="Notification Sounds"
                    description="Play a sound when you receive a notification"
                    checked={soundEnabled}
                    onChange={setSoundEnabled}
                />
            </div>
        </div>
    )
}

function KeybindsSettings() {
    const keybinds = [
        { action: 'Toggle Mute', key: 'Ctrl + Shift + M' },
        { action: 'Toggle Deafen', key: 'Ctrl + Shift + D' },
        { action: 'Push to Talk', key: 'T' },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Keybinds</h2>
            <div className="space-y-2">
                {keybinds.map((kb) => (
                    <div key={kb.action} className="flex justify-between items-center p-3 bg-stone-950 border border-white/10 rounded-lg">
                        <span className="text-white text-sm">{kb.action}</span>
                        <kbd className="px-3 py-1 bg-stone-800 border border-white/10 rounded text-xs font-mono text-stone-300">{kb.key}</kbd>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ToggleSetting({ label, description, checked, onChange }: {
    label: string,
    description: string,
    checked: boolean,
    onChange: (val: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-stone-950 border border-white/10 rounded-lg">
            <div>
                <div className="text-white font-medium mb-1">{label}</div>
                <div className="text-xs text-stone-400">{description}</div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-orange-600' : 'bg-stone-700'}`}
            >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    )
}
