'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Hash, Volume2, Presentation, MonitorPlay, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export type CreationMode = 'channel' | 'category' | 'event'
type ChannelType = 'text' | 'voice' | 'canvas' | 'video' | 'image'

type Category = {
    id: string
    name: string
}

interface UnifiedCreationModalProps {
    isOpen: boolean
    onClose: () => void
    roomId: string
    categories: Category[]
    channelsCount: number
    categoriesCount: number
    canManage: boolean
    onSuccess?: () => void // Callback after successful creation
    initialMode?: CreationMode
}

export function UnifiedCreationModal({ isOpen, onClose, roomId, categories, channelsCount, categoriesCount, canManage, onSuccess, initialMode = 'channel' }: UnifiedCreationModalProps) {
    const [mode, setMode] = useState<CreationMode>(initialMode)

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode)
        }
    }, [isOpen, initialMode])


    // Channel fields
    const [channelName, setChannelName] = useState('')
    const [channelType, setChannelType] = useState<ChannelType>('text')
    const [channelCategory, setChannelCategory] = useState('')
    const [channelDescription, setChannelDescription] = useState('')
    const [channelPrivate, setChannelPrivate] = useState(false)

    // Category fields
    const [categoryName, setCategoryName] = useState('')

    // Event fields
    const [eventName, setEventName] = useState('')
    const [eventDescription, setEventDescription] = useState('')
    const [eventStartTime, setEventStartTime] = useState('')
    const [eventEndTime, setEventEndTime] = useState('')

    const resetForm = () => {
        setChannelName('')
        setChannelDescription('')
        setChannelCategory('')
        setChannelPrivate(false)
        setCategoryName('')
        setEventName('')
        setEventDescription('')
        setEventStartTime('')
        setEventEndTime('')
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleCreateChannel = async () => {
        if (!channelName.trim()) return
        if (!canManage) {
            toast.error('You do not have permission to create channels')
            return
        }

        const { error } = await supabase
            .from('room_channels')
            .insert({
                room_id: roomId,
                name: channelName,
                type: channelType,
                position: channelsCount,
                category_id: channelCategory || null,
                description: channelDescription || null,
                is_private: channelPrivate
            })

        if (error) {
            console.error('Channel creation error:', error)
            toast.error(`Failed to create channel: ${error.message}`)
        } else {
            toast.success('Channel created')
            onSuccess?.() // Trigger refetch
            handleClose()
        }
    }

    const handleCreateCategory = async () => {
        if (!categoryName.trim()) return
        if (!canManage) {
            toast.error('You do not have permission to create categories')
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase
            .from('room_categories')
            .insert({
                room_id: roomId,
                name: categoryName,
                position: categoriesCount,
                created_by: user?.id
            })

        if (error) {
            console.error('Category creation error:', error)
            toast.error(`Failed to create category: ${error.message}`)
        } else {
            toast.success('Category created')
            onSuccess?.() // Trigger refetch
            handleClose()
        }
    }

    const handleCreateEvent = async () => {
        if (!eventName.trim() || !eventStartTime) {
            toast.error('Event name and start time are required')
            return
        }
        if (!canManage) {
            toast.error('You do not have permission to create events')
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase
            .from('room_events')
            .insert({
                room_id: roomId,
                name: eventName,
                description: eventDescription || null,
                start_time: eventStartTime,
                end_time: eventEndTime || null,
                created_by: user?.id
            })

        if (error) {
            console.error('Event creation error:', error)
            toast.error(`Failed to create event: ${error.message}`)
        } else {
            toast.success('Event created')
            onSuccess?.() // Trigger refetch
            handleClose()
        }
    }

    const handleSubmit = () => {
        if (mode === 'channel') handleCreateChannel()
        else if (mode === 'category') handleCreateCategory()
        else if (mode === 'event') handleCreateEvent()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-serif">
                        Create {mode === 'channel' ? 'Channel' : mode === 'category' ? 'Category' : 'Event'}
                    </DialogTitle>
                    <DialogDescription className="text-stone-400">
                        {mode === 'channel' && 'Create a new channel for your server.'}
                        {mode === 'category' && 'Organize your channels with a new category.'}
                        {mode === 'event' && 'Schedule a new event for your community.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Selection Tabs */}
                <div className="flex gap-2 p-1 bg-stone-950/50 rounded-lg border border-white/5">
                    <button
                        onClick={() => setMode('channel')}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all ${mode === 'channel'
                            ? 'bg-orange-600 text-white'
                            : 'text-stone-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Channel
                    </button>
                    <button
                        onClick={() => setMode('category')}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all ${mode === 'category'
                            ? 'bg-orange-600 text-white'
                            : 'text-stone-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Category
                    </button>
                    <button
                        onClick={() => setMode('event')}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all ${mode === 'event'
                            ? 'bg-orange-600 text-white'
                            : 'text-stone-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Event
                    </button>
                </div>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {/* CHANNEL FORM */}
                    {mode === 'channel' && (
                        <>
                            <div className="space-y-2">
                                <Label>Channel Type</Label>
                                <RadioGroup value={channelType} onValueChange={(v) => setChannelType(v as ChannelType)} className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="text" id="text" className="border-white/20 text-orange-500" />
                                        <Label htmlFor="text" className="cursor-pointer flex items-center gap-2"><Hash className="w-4 h-4" /> Text</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="voice" id="voice" className="border-white/20 text-orange-500" />
                                        <Label htmlFor="voice" className="cursor-pointer flex items-center gap-2"><Volume2 className="w-4 h-4" /> Voice</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="video" id="video" className="border-white/20 text-orange-500" />
                                        <Label htmlFor="video" className="cursor-pointer flex items-center gap-2"><MonitorPlay className="w-4 h-4" /> Video</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="canvas" id="canvas" className="border-white/20 text-orange-500" />
                                        <Label htmlFor="canvas" className="cursor-pointer flex items-center gap-2"><Presentation className="w-4 h-4" /> Canvas</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="image" id="image" className="border-white/20 text-orange-500" />
                                        <Label htmlFor="image" className="cursor-pointer flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Image</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Channel Name</Label>
                                <Input
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    placeholder="new-channel"
                                    className="bg-stone-800 border-white/10 text-white placeholder:text-stone-500"
                                />
                            </div>

                            {categories.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Category (Optional)</Label>
                                    <select
                                        value={channelCategory}
                                        onChange={(e) => setChannelCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-stone-800 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">No Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <textarea
                                    value={channelDescription}
                                    onChange={(e) => setChannelDescription(e.target.value)}
                                    placeholder="What's this channel about?"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-stone-800 border border-white/10 rounded-md text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-white/5">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold">Private Channel</Label>
                                    <p className="text-xs text-stone-400">Only selected members can view this channel</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={channelPrivate}
                                    onClick={() => setChannelPrivate(!channelPrivate)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${channelPrivate ? 'bg-orange-600' : 'bg-stone-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${channelPrivate ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </>
                    )}

                    {/* CATEGORY FORM */}
                    {mode === 'category' && (
                        <div className="space-y-2">
                            <Label>Category Name</Label>
                            <Input
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="Study Resources"
                                className="bg-stone-800 border-white/10 text-white placeholder:text-stone-500"
                            />
                            <p className="text-xs text-stone-400">Categories help organize your channels into groups</p>
                        </div>
                    )}

                    {/* EVENT FORM */}
                    {mode === 'event' && (
                        <>
                            <div className="space-y-2">
                                <Label>Event Name</Label>
                                <Input
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="Weekly Study Session"
                                    className="bg-stone-800 border-white/10 text-white placeholder:text-stone-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <textarea
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                    placeholder="What's this event about?"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-stone-800 border border-white/10 rounded-md text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <input
                                        type="datetime-local"
                                        value={eventStartTime}
                                        onChange={(e) => setEventStartTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-stone-800 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time (Optional)</Label>
                                    <input
                                        type="datetime-local"
                                        value={eventEndTime}
                                        onChange={(e) => setEventEndTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-stone-800 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose} className="hover:bg-white/5 hover:text-white">Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 text-white">
                        Create {mode === 'channel' ? 'Channel' : mode === 'category' ? 'Category' : 'Event'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
