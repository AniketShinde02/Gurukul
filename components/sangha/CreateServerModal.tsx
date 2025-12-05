'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function CreateServerModal({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [topic, setTopic] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async () => {
        if (!name.trim()) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('study_rooms')
                .insert({
                    name,
                    topic: topic || 'General',
                    description: `Welcome to ${name}!`,
                    type: 'public', // or private if we add that option
                    created_by: user.id,
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Server created!')
            setOpen(false)
            setName('')
            setTopic('')
            router.push(`/sangha/rooms/${data.id}`)
            router.refresh()
        } catch (error) {
            console.error('Error creating server:', error)
            toast.error('Failed to create server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="bg-stone-900 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-serif">Customize Your Server</DialogTitle>
                    <p className="text-center text-stone-400 text-sm">
                        Give your new server a personality with a name and an icon. You can always change it later.
                    </p>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-6">
                    {/* Icon Placeholder (Upload functionality can be added later) */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-stone-600 flex items-center justify-center cursor-pointer hover:border-stone-400 hover:bg-white/5 transition-all">
                            <div className="flex flex-col items-center gap-1 text-stone-500">
                                <Upload className="w-6 h-6" />
                                <span className="text-[10px] font-bold uppercase">Upload</span>
                            </div>
                        </div>
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
                    <Button onClick={handleCreate} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[100px]">
                        {loading ? 'Creating...' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
