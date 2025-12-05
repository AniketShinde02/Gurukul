'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User, Mail, Camera, Save, Loader2, MapPin, Link as LinkIcon, GraduationCap, Heart, X, Upload, ImageIcon, LayoutGrid, Clock, Award, BookOpen } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Profile } from '@/types/chat.types'
import Cropper from 'react-easy-crop'

type Point = { x: number; y: number }
type Area = { x: number; y: number; width: number; height: number }

type Education = {
    id: string
    school: string
    degree: string
    year: string
}

const SUGGESTED_INTERESTS = [
    "Physics", "Mathematics", "Computer Science", "History",
    "Literature", "UPSC", "JEE", "NEET", "Coding", "Design",
    "Economics", "Psychology", "Law", "Medicine", "Arts"
]

// Helper to create the cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
): Promise<Blob | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file)
        }, 'image/jpeg')
    })
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'personal' | 'education' | 'interests'>('personal')

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        bio: '',
        location: '',
        website: '',
        education: [] as Education[],
        interests: [] as string[]
    })
    const [newInterest, setNewInterest] = useState('')
    const [newEducation, setNewEducation] = useState<Education>({ id: '', school: '', degree: '', year: '' })

    // Image Cropper State
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isCropperOpen, setIsCropperOpen] = useState(false)
    const [uploading, setUploading] = useState(false)

    const avatarInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            setProfile(data)
            setFormData({
                username: data.username || '',
                full_name: data.full_name || '',
                bio: data.bio || '',
                location: data.location || '',
                website: data.website || '',
                education: data.education || [],
                interests: data.interests || []
            })
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!profile) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: formData.username,
                    full_name: formData.full_name,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    education: formData.education,
                    interests: formData.interests
                })
                .eq('id', profile.id)

            if (error) throw error
            toast.success('Profile updated successfully')
            setProfile({ ...profile, ...formData })
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    // Image Handling
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const imageDataUrl = await readFile(file)
            setImageSrc(imageDataUrl as string)
            setIsCropperOpen(true)
            // Reset zoom and crop
            setZoom(1)
            setCrop({ x: 0, y: 0 })
        }
    }

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.addEventListener('load', () => resolve(reader.result), false)
            reader.readAsDataURL(file)
        })
    }

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSaveCrop = async () => {
        if (!imageSrc || !croppedAreaPixels || !profile) return

        setUploading(true)
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (!croppedImageBlob) throw new Error('Failed to crop image')

            const timestamp = Date.now()
            const fileName = `${profile.id}/avatar-${timestamp}.jpg`
            const file = new File([croppedImageBlob], fileName, { type: 'image/jpeg' })

            // Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id)

            if (updateError) throw updateError

            setProfile({ ...profile, avatar_url: publicUrl })
            setIsCropperOpen(false)
            setImageSrc(null)
            toast.success('Avatar updated!')
        } catch (error: any) {
            console.error('Error saving image:', error)
            toast.error(error.message || 'Failed to save image')
        } finally {
            setUploading(false)
        }
    }

    // Interest Handling
    const addInterest = () => {
        if (newInterest && !formData.interests.includes(newInterest)) {
            setFormData({
                ...formData,
                interests: [...formData.interests, newInterest]
            })
            setNewInterest('')
        }
    }

    const removeInterest = (interest: string) => {
        setFormData({
            ...formData,
            interests: formData.interests.filter(i => i !== interest)
        })
    }

    // Education Handling
    const addEducation = () => {
        if (newEducation.school && newEducation.degree) {
            setFormData({
                ...formData,
                education: [...formData.education, { ...newEducation, id: Date.now().toString() }]
            })
            setNewEducation({ id: '', school: '', degree: '', year: '' })
        }
    }

    const removeEducation = (id: string) => {
        setFormData({
            ...formData,
            education: formData.education.filter(edu => edu.id !== id)
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">

            {/* 1. Header Card */}
            <div className="relative bg-[#1C1917] border border-white/5 rounded-3xl p-8 overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-[#1C1917] to-[#1C1917]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-orange-500 bg-stone-800 overflow-hidden shadow-2xl shadow-orange-900/20">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-stone-600">
                                    {profile?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute bottom-1 right-1 p-2.5 bg-stone-900 rounded-full text-white hover:text-orange-500 border border-white/10 hover:border-orange-500 transition-all shadow-lg hover:scale-110"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input
                            type="file"
                            ref={avatarInputRef}
                            onChange={onFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-white mb-1">{formData.full_name || 'Your Name'}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-3 text-stone-400">
                                <span className="text-orange-500 font-medium">@{formData.username || 'username'}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-sm">{formData.location || 'Location not set'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mini Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                <Clock className="w-4 h-4 text-orange-500" />
                                <div className="text-left">
                                    <p className="text-[10px] text-stone-500 font-bold uppercase">Study Time</p>
                                    <p className="text-sm font-bold text-white">124h</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                <Award className="w-4 h-4 text-purple-500" />
                                <div className="text-left">
                                    <p className="text-[10px] text-stone-500 font-bold uppercase">Reputation</p>
                                    <p className="text-sm font-bold text-white">4.8/5</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                <div className="text-left">
                                    <p className="text-[10px] text-stone-500 font-bold uppercase">Sessions</p>
                                    <p className="text-sm font-bold text-white">42</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => handleUpdateProfile()}
                            disabled={saving}
                            className="bg-white text-black hover:bg-stone-200 font-bold py-2.5 px-6 rounded-full transition-all flex items-center gap-2 text-sm"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 2. Left Column: About & Details */}
                <div className="space-y-6">
                    {/* Bio */}
                    <div className="bg-[#1C1917] border border-white/5 rounded-3xl p-6">
                        <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5" /> About Me
                        </h3>
                        <p className="text-stone-300 text-sm leading-relaxed">
                            {formData.bio || "No bio yet. Tell the world about your journey!"}
                        </p>

                        {formData.website && (
                            <a
                                href={formData.website}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors text-sm font-medium"
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                                {new URL(formData.website).hostname}
                            </a>
                        )}
                    </div>

                    {/* Interests Chips (Read Only view) */}
                    <div className="bg-[#1C1917] border border-white/5 rounded-3xl p-6">
                        <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-4">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                            {formData.interests.length > 0 ? (
                                formData.interests.map((interest, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-stone-800/50 border border-white/5 text-xs text-stone-300">
                                        {interest}
                                    </span>
                                ))
                            ) : (
                                <span className="text-stone-600 text-xs italic">No interests added.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Right Column: Tabbed Forms */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Tabs */}
                    <div className="bg-[#1C1917] border border-white/5 rounded-full p-1 flex overflow-x-auto no-scrollbar">
                        {['personal', 'education', 'interests'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-stone-800 text-white shadow-lg'
                                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab === 'personal' && 'Personal Info'}
                                {tab === 'education' && 'Education'}
                                {tab === 'interests' && 'Interests & Goals'}
                            </button>
                        ))}
                    </div>

                    {/* Form Content */}
                    <div className="bg-[#1C1917] border border-white/5 rounded-3xl p-6 md:p-8 min-h-[400px]">
                        {activeTab === 'personal' && (
                            <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full bg-[#2C2927] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all text-sm"
                                            placeholder="e.g. Arjun Kumar"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Username</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full bg-[#2C2927] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all text-sm"
                                            placeholder="username"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        rows={4}
                                        maxLength={400}
                                        className="w-full bg-[#2C2927] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all resize-none text-sm"
                                        placeholder="Tell us about your study journey..."
                                    />
                                    <div className="text-right text-[10px] text-stone-600">{formData.bio.length}/400</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-stone-500" />
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full bg-[#2C2927] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all text-sm"
                                                placeholder="Mumbai, India"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Website</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-4 top-3.5 w-4 h-4 text-stone-500" />
                                            <input
                                                type="url"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                className="w-full bg-[#2C2927] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all text-sm"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {activeTab === 'education' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Add New Education Card */}
                                <div className="bg-[#2C2927] border border-white/5 rounded-2xl p-5 space-y-4">
                                    <h3 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-orange-500" />
                                        Add New Education
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={newEducation.school}
                                            onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                                            className="bg-[#1C1917] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none transition-colors text-sm"
                                            placeholder="School / University"
                                        />
                                        <input
                                            type="text"
                                            value={newEducation.degree}
                                            onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                                            className="bg-[#1C1917] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none transition-colors text-sm"
                                            placeholder="Degree / Class"
                                        />
                                        <input
                                            type="text"
                                            value={newEducation.year}
                                            onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
                                            className="bg-[#1C1917] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none transition-colors text-sm md:col-span-2"
                                            placeholder="Year (e.g. 2020 - 2024)"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={addEducation}
                                            disabled={!newEducation.school || !newEducation.degree}
                                            className="bg-stone-800 hover:bg-stone-700 text-white px-5 py-2 rounded-lg transition-colors font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Add Entry
                                        </button>
                                    </div>
                                </div>

                                {/* List Education */}
                                <div className="space-y-3">
                                    {formData.education.length > 0 ? (
                                        formData.education.map((edu) => (
                                            <div key={edu.id} className="flex items-start justify-between bg-[#2C2927] border border-white/5 rounded-2xl p-4 group hover:border-orange-500/30 transition-all">
                                                <div className="flex items-start space-x-3">
                                                    <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                                                        <GraduationCap className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-base">{edu.school}</h4>
                                                        <p className="text-stone-400 text-sm">{edu.degree}</p>
                                                        <p className="text-stone-500 text-xs mt-0.5">{edu.year}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeEducation(edu.id)}
                                                    className="text-stone-500 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-stone-500 bg-[#2C2927]/30 rounded-2xl border border-white/5 border-dashed">
                                            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No education details added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'interests' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-stone-400 text-[10px] font-bold uppercase mb-3">Add New Interests</label>
                                    <div className="flex space-x-2 mb-5">
                                        <input
                                            type="text"
                                            value={newInterest}
                                            onChange={(e) => setNewInterest(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                                            className="flex-1 bg-[#2C2927] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors text-sm"
                                            placeholder="Type an interest (e.g. Physics, Coding)..."
                                        />
                                        <button
                                            onClick={addInterest}
                                            className="bg-stone-800 hover:bg-stone-700 text-white px-6 rounded-xl transition-colors font-medium text-sm"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {/* Suggested Interests */}
                                    <div className="bg-[#2C2927] border border-white/5 rounded-2xl p-5">
                                        <p className="text-stone-500 text-[10px] mb-2 uppercase tracking-wider font-bold">Popular Tags</p>
                                        <div className="flex flex-wrap gap-2">
                                            {SUGGESTED_INTERESTS.filter(i => !formData.interests.includes(i)).map((interest) => (
                                                <button
                                                    key={interest}
                                                    onClick={() => {
                                                        if (!formData.interests.includes(interest)) {
                                                            setFormData({ ...formData, interests: [...formData.interests, interest] })
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 rounded-full bg-[#1C1917] border border-white/5 text-stone-400 text-xs hover:border-orange-500 hover:text-orange-500 transition-all hover:scale-105"
                                                >
                                                    + {interest}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#2C2927] border border-white/5 rounded-2xl p-5 min-h-[150px]">
                                    <p className="text-stone-500 text-[10px] mb-3 uppercase tracking-wider font-bold">Your Interests</p>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.interests.length > 0 ? (
                                            formData.interests.map((interest, index) => (
                                                <div key={index} className="flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 px-3 py-1.5 rounded-full animate-fade-in group hover:bg-orange-500/20 transition-colors">
                                                    <span className="font-medium text-xs">{interest}</span>
                                                    <button onClick={() => removeInterest(interest)} className="hover:text-white opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-full py-8 flex flex-col items-center justify-center text-stone-600 text-xs italic">
                                                <Heart className="w-8 h-8 mb-2 opacity-20" />
                                                No interests added yet. Select from above or add your own.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {isCropperOpen && imageSrc && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#221F1D] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">
                                Adjust Profile Picture
                            </h3>
                            <button onClick={() => setIsCropperOpen(false)} className="text-stone-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="relative h-80 w-full bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={true}
                            />
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-stone-400 text-xs font-bold uppercase mb-3">Zoom Level</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                />
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setIsCropperOpen(false)}
                                    className="flex-1 py-3.5 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCrop}
                                    disabled={uploading}
                                    className="flex-1 py-3.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors font-bold shadow-lg shadow-orange-900/20 flex items-center justify-center space-x-2"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    <span>Save Photo</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
