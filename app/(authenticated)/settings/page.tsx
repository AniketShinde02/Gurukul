'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Bell, Palette, Globe, LogOut, Moon, Shield, Camera,
    Loader2, Save, Mail, Key, Laptop, Smartphone,
    Sparkles, Zap, Fingerprint, Command, Check, GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import Tesseract from 'tesseract.js'

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState({
        username: '',
        full_name: '',
        bio: '',
        avatar_url: '',
        website: '',
        is_admin: false
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [activeTab, setActiveTab] = useState<'profile' | 'student'>('profile')
    const [verificationFile, setVerificationFile] = useState<File | null>(null)
    const [verificationPreview, setVerificationPreview] = useState<string | null>(null)
    const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified')
    const [scanning, setScanning] = useState(false)
    const [scanResult, setScanResult] = useState<{ confidence: number, text: string } | null>(null)

    useEffect(() => {
        fetchProfile()
        checkVerificationStatus()
    }, [])

    const checkVerificationStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('verification_requests')
            .select('status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (data) {
            setVerificationStatus(data.status)
        }
    }

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            if (data) {
                setProfile({
                    username: data.username || '',
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                    avatar_url: data.avatar_url || '',
                    website: data.website || '',
                    is_admin: data.is_admin || false
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async () => {
        setSaving(true)
        try {
            const updates = {
                id: user.id,
                email: user.email,
                username: profile.username || user.email?.split('@')[0],
                full_name: profile.full_name,
                bio: profile.bio,
                website: profile.website,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase
                .from('profiles')
                .upsert(updates)

            if (error) throw error
            toast.success('Profile updated successfully')
        } catch (error: any) {
            console.error('Error updating profile:', error)
            toast.error(`Failed to update: ${error.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
            toast.success('Avatar updated!')
        } catch (error) {
            console.error('Error uploading avatar:', error)
            toast.error('Error uploading avatar')
        } finally {
            setUploading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleVerificationUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return
        const file = event.target.files[0]
        setVerificationFile(file)
        setVerificationPreview(URL.createObjectURL(file))
        await scanDocument(file)
    }

    const scanDocument = async (file: File) => {
        setScanning(true)
        setScanResult(null)
        try {
            const { data: { text, confidence } } = await Tesseract.recognize(
                file,
                'eng',
                // { logger: m => console.log(m) } 
            )

            console.log('OCR Result:', text)

            // Simple keyword check
            const keywords = ['student', 'university', 'college', 'school', 'faculty', 'academic', 'semester', 'valid', 'expires']
            const foundKeywords = keywords.filter(k => text.toLowerCase().includes(k))

            setScanResult({
                confidence: confidence,
                text: foundKeywords.length > 0
                    ? `Detected: ${foundKeywords.join(', ').toUpperCase()}`
                    : "Low confidence. We'll manually review this."
            })

        } catch (err) {
            console.error('OCR Error:', err)
            toast.error('Could not scan document automatically. Manual review will be required.')
        } finally {
            setScanning(false)
        }
    }

    const submitVerification = async () => {
        if (!verificationFile || !user) return

        setUploading(true)
        try {
            const fileExt = verificationFile.name.split('.').pop()
            const filePath = `${user.id}/${Date.now()}.${fileExt}`

            // 1. Upload to secure bucket
            const { error: uploadError } = await supabase.storage
                .from('verification-docs')
                .upload(filePath, verificationFile)

            if (uploadError) throw uploadError

            // 2. Create Request Record
            const { error: dbError } = await supabase
                .from('verification_requests')
                .insert({
                    user_id: user.id,
                    method: 'document',
                    document_url: filePath,
                    status: 'pending'
                })

            if (dbError) throw dbError

            setVerificationStatus('pending')
            toast.success('Verification submitted successfully!')
        } catch (error: any) {
            console.error('Verification failed:', error)
            toast.error(error.message || 'Failed to submit verification')
        } finally {
            setUploading(false)
        }
    }

    const verifyEduEmail = async () => {
        setUploading(true)
        try {
            // Call the secure database function
            const { data, error } = await supabase.rpc('verify_edu_email')

            if (error) throw error

            if (data === true) {
                toast.success('🎉 Success! You are now a verified student.')
                setVerificationStatus('verified')
                setProfile(prev => ({ ...prev, is_student: true }))
                fetchProfile()
            } else {
                toast.error('Your email does not appear to be a valid .edu address.')
            }
        } catch (error: any) {
            console.error('Auto-verification failed:', error)
            toast.error(error.message || 'Verification failed')
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-stone-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                    <p className="text-sm font-medium text-stone-500 animate-pulse">Loading preferences...</p>
                </div>
            </div>
        )
    }

    // --- RENDER SECTION (Redesigned Layout) ---
    return (
        <div className="min-h-screen bg-transparent text-stone-200 p-4 lg:p-6 flex flex-col items-center justify-center font-sans selection:bg-orange-500/30 selection:text-orange-200">

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-7xl h-[calc(100vh-120px)] flex flex-col gap-4"
            >
                {/* Header Area */}
                <div className="flex items-center justify-between px-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Command className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Settings & Preferences</h1>
                            <p className="text-xs text-stone-500 font-medium">Manage your digital identity</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {profile.is_admin && (
                            <Button
                                variant="outline"
                                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                                onClick={() => router.push('/admin/verifications')}
                            >
                                <Shield className="w-4 h-4 mr-2" />
                                Admin Dashboard
                            </Button>
                        )}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-white/5 text-xs text-stone-500">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            System Operational
                        </div>
                    </div>
                </div>

                {/* Main Bento Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 min-h-0 overflow-y-auto lg:overflow-visible custom-scrollbar">

                    {/* COL 1: IDENTITY CARD (Span 3) */}
                    <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4">
                        <div className="flex-1 bg-stone-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-col items-center text-center relative overflow-hidden group">
                            {/* Decorative gradient */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-orange-500/10 to-transparent opacity-50" />

                            <div className="relative mt-4 mb-6">
                                <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <Avatar className="w-32 h-32 border-4 border-stone-800 shadow-2xl ring-4 ring-stone-900/50">
                                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-stone-800 text-3xl font-bold text-stone-400">
                                        {profile.username?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute bottom-0 right-0 p-2.5 bg-orange-600 text-white rounded-full hover:bg-orange-500 hover:scale-105 transition-all shadow-lg border-4 border-stone-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </div>

                            <div className="space-y-1 relative z-10">
                                <h2 className="text-xl font-bold text-white">@{profile.username || 'User'}</h2>
                                {verificationStatus === 'verified' ? (
                                    <p className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full inline-block border border-green-500/20">
                                        verified student
                                    </p>
                                ) : (
                                    <p className="text-xs font-mono text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full inline-block">
                                        Unverified
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Logout Button (Moved to bottom of column 1) */}
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="w-full h-14 rounded-[2rem] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 transition-all flex items-center justify-center gap-2 group"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Sign Out safely
                        </Button>
                    </div>

                    {/* COL 2: MAIN EDITOR (Span 6) */}
                    <div className="md:col-span-8 lg:col-span-6 bg-stone-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 flex flex-col relative overflow-hidden">

                        {/* TAB SWITCHER */}
                        <div className="flex items-center gap-2 p-1 bg-black/20 rounded-xl mb-6 self-start">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-orange-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('student')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'student' ? 'bg-orange-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
                            >
                                Student Pass
                            </button>
                        </div>

                        {activeTab === 'profile' ? (
                            <>
                                <div className="mb-0 relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-1">Profile Details</h3>
                                    <p className="text-sm text-stone-400">Update your public information.</p>
                                </div>

                                <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 relative z-10 mt-6">
                                    {/* (Existing Inputs) */}
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-stone-500 ml-1 uppercase tracking-wider">Display Name</label>
                                        <div className="relative group">
                                            <Input
                                                value={profile.full_name}
                                                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                                className="h-12 bg-black/20 border-white/10 focus:border-orange-500/50 rounded-xl pl-4 text-white placeholder:text-stone-600 transition-all"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-stone-500 ml-1 uppercase tracking-wider">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                                            <Input
                                                value={profile.website}
                                                onChange={e => setProfile({ ...profile, website: e.target.value })}
                                                className="h-12 bg-black/20 border-white/10 focus:border-orange-500/50 rounded-xl pl-10 text-white placeholder:text-stone-600"
                                                placeholder="https://your-portfolio.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-stone-500 ml-1 uppercase tracking-wider">Bio</label>
                                        <Textarea
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                            className="min-h-[160px] bg-black/20 border-white/10 focus:border-orange-500/50 rounded-xl p-4 text-white placeholder:text-stone-600 resize-none leading-relaxed"
                                            placeholder="Tell the world a bit about yourself..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-white/5 relative z-10">
                                    <Button
                                        onClick={handleUpdateProfile}
                                        disabled={saving}
                                        className="w-full h-12 bg-white text-black hover:bg-stone-200 rounded-xl font-bold transition-all transform active:scale-95"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        {saving ? 'Saving changes...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-0 relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-1">Student Verification</h3>
                                    <p className="text-sm text-stone-400">Unlock Pro features with your student ID.</p>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10 mt-6 flex flex-col items-center justify-center text-center">

                                    {verificationStatus === 'verified' ? (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 flex flex-col items-center gap-4 w-full">
                                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                                <Check className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-bold text-green-400">You are Verified!</h3>
                                            <p className="text-stone-400 text-sm">You have full access to all Student Pro features.</p>
                                        </div>
                                    ) : verificationStatus === 'pending' ? (
                                        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-8 flex flex-col items-center gap-4 w-full">
                                            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 animate-pulse">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                            </div>
                                            <h3 className="text-xl font-bold text-yellow-500">Verification Pending</h3>
                                            <p className="text-stone-400 text-sm">Our admins are reviewing your document. This usually takes 24 hours.</p>
                                        </div>
                                    ) : (
                                        <div className="w-full space-y-6">

                                            {/* OPTION 1: INSTANT .EDU VERIFICATION */}
                                            {user?.email?.endsWith('.edu') && (
                                                <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6 text-left relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                                        <GraduationCap className="w-24 h-24 text-orange-500" />
                                                    </div>
                                                    <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-2">
                                                        <Sparkles className="w-5 h-5 text-orange-500" />
                                                        Instant Student Access
                                                    </h4>
                                                    <p className="text-stone-400 text-sm mb-4 max-w-md">
                                                        We detected you are using an <strong>.edu</strong> email ({user.email}).
                                                        You qualify for instant verification!
                                                    </p>
                                                    <Button
                                                        onClick={verifyEduEmail}
                                                        disabled={uploading}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                                    >
                                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                                        Verify Me Instantly
                                                    </Button>
                                                </div>
                                            )}

                                            {/* OPTION 2: MANUAL UPLOAD */}
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-white/10" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-[#0c0c0c] px-2 text-stone-500">Or verify with ID Card</span>
                                                </div>
                                            </div>

                                            <div className="bg-stone-950/50 rounded-xl border border-dashed border-stone-700 p-8 hover:border-orange-500/50 transition-colors cursor-pointer relative group"
                                                onClick={() => !scanning && document.getElementById('id-upload')?.click()}>
                                                <input
                                                    id="id-upload"
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,application/pdf"
                                                    disabled={scanning}
                                                    onChange={handleVerificationUpload}
                                                />

                                                {verificationPreview ? (
                                                    <div className="relative">
                                                        <img src={verificationPreview} className="max-h-48 mx-auto rounded-lg shadow-lg mb-4" alt="Preview" />
                                                        {scanning && (
                                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                                                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                                                                <p className="text-white font-bold text-sm">Scanning ID...</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 group-hover:text-orange-500 transition-colors">
                                                            <Smartphone className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-stone-300 font-medium">Click to upload Student ID</p>
                                                        <p className="text-xs text-stone-500">Supports JPG, PNG, PDF (Max 5MB)</p>
                                                    </div>
                                                )}
                                            </div>

                                            {scanResult && !scanning && (
                                                <div className={`text-xs px-3 py-2 rounded-lg border mb-4 ${scanResult.text.includes('Detected')
                                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                                    }`}>
                                                    <div className="flex items-center gap-2 font-bold mb-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        AI Analysis
                                                    </div>
                                                    {scanResult.text}
                                                </div>
                                            )}

                                            {verificationFile && (
                                                <Button
                                                    onClick={submitVerification}
                                                    disabled={uploading}
                                                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold"
                                                >
                                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                                                    Submit for Review
                                                </Button>
                                            )}

                                            <p className="text-xs text-stone-500 text-left bg-stone-950/30 p-4 rounded-lg">
                                                <span className="font-bold text-orange-500 block mb-1">Why do I need this?</span>
                                                We require valid student identification to maintain a safe, student-only environment. Your ID is encrypted and deleted after verification.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    {/* ... (Keep COL 3) */}

                    {/* COL 3: SETTINGS & SECURITY (Span 3) */}
                    <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-4">

                        {/* Security Module */}
                        <div className="bg-stone-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 flex flex-col gap-4">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-stone-300">
                                <Shield className="w-4 h-4 text-green-500" />
                                Security
                            </h4>

                            <div className="space-y-3">
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-stone-400">Email</span>
                                        <Mail className="w-3 h-3 text-stone-600" />
                                    </div>
                                    <div className="text-sm font-mono text-white truncate w-full" title={user?.email}>
                                        {user?.email}
                                    </div>
                                </div>

                                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-stone-400">Password</span>
                                        <Key className="w-3 h-3 text-stone-600" />
                                    </div>
                                    <div className="flex items-center gap-1 text-stone-500">
                                        <span className="text-lg leading-none">••••••••</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preferences Module */}
                        <div className="flex-1 bg-stone-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 flex flex-col gap-4">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-stone-300">
                                <Palette className="w-4 h-4 text-purple-500" />
                                Preferences
                            </h4>

                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 group-hover:text-white transition-colors">
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-stone-200">Alerts</span>
                                        </div>
                                    </div>
                                    <Switch defaultChecked />
                                </div>

                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 group-hover:text-white transition-colors">
                                            <Moon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-stone-200">Dark Mode</span>
                                        </div>
                                    </div>
                                    <Switch checked disabled />
                                </div>

                                <div className="p-3 mt-auto rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
                                    <div className="p-1.5 bg-orange-500/10 rounded-lg">
                                        <Laptop className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-orange-200">Current Session</span>
                                        <span className="text-[10px] text-orange-500/60">Active now • Windows</span>
                                    </div>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    )
}