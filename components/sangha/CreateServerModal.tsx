'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function CreateServerModal({ children, open: controlledOpen, onOpenChange: setControlledOpen }: { children?: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) {
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen
    const [name, setName] = useState('')
    const [topic, setTopic] = useState('')
    const [loading, setLoading] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Check size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image must be less than 2MB')
                return
            }
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleCreate = async () => {
        if (!name.trim()) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let icon_url = null

            // Upload image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('room-assets')
                    .upload(fileName, imageFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('room-assets')
                    .getPublicUrl(fileName)

                icon_url = publicUrl
            }

            const { data, error } = await supabase
                .from('study_rooms')
                .insert({
                    name,
                    topic: topic || 'General',
                    description: `Welcome to ${name}!`,
                    type: 'public',
                    created_by: user.id,
                    is_active: true,
                    icon_url: icon_url
                })
                .select()
                .single()

            if (error) throw error

            // Auto-create #general channel
            await supabase.from('room_channels').insert({
                room_id: data.id,
                name: 'general',
                type: 'text',
                position: 0
            })

            // Auto-add creator as admin member
            await supabase.from('room_participants').insert({
                room_id: data.id,
                user_id: user.id,
                role: 'admin' // Ensure we have logic to handle this role string or ID
            })

            toast.success('Server created!')
            setOpen(false)
            resetForm()

            // Navigate to new room - realtime subscription will update the server rail automatically
            router.push(`/sangha/rooms/${data.id}`)
        } catch (error: any) {
            console.error('Error creating server:', error)
            toast.error(error.message || 'Failed to create server')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName('')
        setTopic('')
        setImageFile(null)
        setPreviewUrl(null)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetForm()
        }}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-serif">Customize Your Server</DialogTitle>
                    <p className="text-center text-stone-400 text-sm">
                        Give your new server a personality with a name and an icon. You can always change it later.
                    </p>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-6">
                    {/* Icon Upload */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    <div className="relative group">
                        {previewUrl ? (
                            <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-orange-500">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <span className="text-xs font-bold text-white uppercase">Change</span>
                                </div>
                                <button
                                    className="absolute top-0 right-0 bg-red-500 p-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setImageFile(null)
                                        setPreviewUrl(null)
                                    }}
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ) : (
                            <div
                                className="w-20 h-20 rounded-full border-2 border-dashed border-stone-600 flex items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-white/5 transition-all group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex flex-col items-center gap-1 text-stone-500 group-hover:text-orange-500 transition-colors">
                                    <Upload className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase">Upload</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold text-stone-400 uppercase">Server Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-stone-950/50 border-black/20 focus:border-orange-500/50 text-white"
                                placeholder="My Awesome Server"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="topic" className="text-xs font-bold text-stone-400 uppercase">Topic (Optional)</Label>
                            <Input
                                id="topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="bg-stone-950/50 border-black/20 focus:border-orange-500/50 text-white"
                                placeholder="e.g. Physics, Gaming, Art"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-stone-400 hover:text-white hover:bg-transparent">Back</Button>
                    <Button onClick={handleCreate} disabled={loading || !name.trim()} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[100px]">
                        {loading ? 'Creating...' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
