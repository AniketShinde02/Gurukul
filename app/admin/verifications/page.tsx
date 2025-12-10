'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, Shield, FileText, Mail, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

export default function AdminVerificationsPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }

            // Verify admin status
            const { data: adminProfile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            if (!adminProfile?.is_admin) {
                toast.error('Unauthorized access')
                router.push('/')
                return
            }

            // 1. Fetch Requests (No Join)
            const { data: requestsData, error: reqError } = await supabase
                .from('verification_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (reqError) throw reqError
            if (!requestsData || requestsData.length === 0) {
                setRequests([])
                return
            }

            // 2. Fetch Profiles for these requests
            const userIds = requestsData.map(r => r.user_id)
            const { data: profilesData, error: profError } = await supabase
                .from('profiles')
                .select('id, username, full_name, email, avatar_url')
                .in('id', userIds)

            if (profError) throw profError

            // 3. Merge Data
            const combinedData = requestsData.map(req => {
                const profile = profilesData?.find(p => p.id === req.user_id)
                return {
                    ...req,
                    profile: profile || { username: 'Unknown', full_name: 'Unknown User' }
                }
            })

            setRequests(combinedData)
        } catch (error) {
            console.error('Error fetching requests:', error)
            toast.error('Failed to load verification requests')
        } finally {
            setLoading(false)
        }
    }

    const handleDecision = async (requestId: string, userId: string, status: 'verified' | 'rejected') => {
        setProcessing(requestId)
        try {
            // 1. Update verification request status
            const { error: reqError } = await supabase
                .from('verification_requests')
                .update({ status })
                .eq('id', requestId)

            if (reqError) throw reqError

            // 2. If verified, update profile
            if (status === 'verified') {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        is_student: true,
                        // Optionally add a student badge or XP boost here
                    })
                    .eq('id', userId)

                if (profileError) throw profileError
            }

            toast.success(`User ${status} successfully`)
            setRequests(prev => prev.filter(r => r.id !== requestId))
        } catch (error) {
            console.error('Error processing request:', error)
            toast.error('Failed to process request')
        } finally {
            setProcessing(null)
        }
    }

    const getImageUrl = (path: string) => {
        if (!path) return ''
        const { data } = supabase.storage.from('verification-docs').getPublicUrl(path)
        return data.publicUrl
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-stone-950">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Shield className="text-orange-500" /> Admin Verifications
                        </h1>
                        <p className="text-stone-400">Review pending student ID requests.</p>
                    </div>
                    <Badge variant="outline" className="border-orange-500/50 text-orange-500">
                        {requests.length} Pending
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {requests.length === 0 ? (
                        <div className="text-center py-20 bg-stone-900/50 rounded-2xl border border-white/5">
                            <GraduationCap className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-stone-400">All caught up!</h3>
                            <p className="text-stone-500">No pending verification requests.</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-stone-900/80 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row">
                                {/* Image Preview Section */}
                                <div className="md:w-1/3 bg-black/50 p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
                                    {req.method === 'document' ? (
                                        req.document_url ? (
                                            // Note: In real prod, use signed URLs for private buckets. 
                                            // The SQL I gave makes verification-docs private, 
                                            // so we need createSignedUrl logic. For MVP/Demo I made a public view policy for admins.
                                            // Actually, getPublicUrl won't work if bucket is private.
                                            // I'll add a helper to fetch signed URL immediately.
                                            <SecureImage path={req.document_url} />
                                        ) : (
                                            <span className="text-stone-500">No document attached</span>
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-stone-400">
                                            <Mail className="w-12 h-12" />
                                            <span>Email Verification</span>
                                        </div>
                                    )}
                                </div>

                                {/* Details Section */}
                                <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-lg font-bold text-stone-400">
                                                {req.profile?.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">@{req.profile?.username}</h3>
                                                <p className="text-sm text-stone-500">{req.profile?.full_name}</p>
                                            </div>
                                            <Badge className="ml-auto bg-blue-500/20 text-blue-400 border-none">
                                                {req.method === 'email' ? 'Email' : 'ID Card'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 text-sm text-stone-300">
                                            {req.method === 'email' ? (
                                                <div className="p-3 bg-stone-950 rounded-lg font-mono border border-white/5">
                                                    {req.school_email}
                                                </div>
                                            ) : (
                                                <p className="italic text-stone-500">
                                                    Submitted specific document for visual review. Check for valid dates and name match.
                                                </p>
                                            )}
                                            <p className="text-xs text-stone-600 mt-2">
                                                Requested on: {new Date(req.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                                        <Button
                                            onClick={() => handleDecision(req.id, req.user_id, 'rejected')}
                                            disabled={!!processing}
                                            variant="outline"
                                            className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                        >
                                            <X className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                        <Button
                                            onClick={() => handleDecision(req.id, req.user_id, 'verified')}
                                            disabled={!!processing}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {processing === req.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" /> Approve
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

function SecureImage({ path }: { path: string }) {
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        const fetchUrl = async () => {
            const { data, error } = await supabase.storage
                .from('verification-docs')
                .createSignedUrl(path, 3600) // 1 hour link

            if (data?.signedUrl) setUrl(data.signedUrl)
        }
        fetchUrl()
    }, [path])

    if (!url) return <div className="animate-pulse w-full h-48 bg-stone-800 rounded-lg" />

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="relative group w-full h-full flex flex-col items-center justify-center">
            <img src={url} alt="ID Document" className="max-h-64 object-contain rounded-lg border border-white/10" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                <span className="text-white text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" /> View Full Size
                </span>
            </div>
        </a>
    )
}
