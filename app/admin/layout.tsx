'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Toaster } from 'react-hot-toast'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAdminAccess()
    }, [])

    const checkAdminAccess = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // Check if user is admin
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            if (error || !profile?.is_admin) {
                setIsAdmin(false)
                setTimeout(() => {
                    router.push('/dashboard')
                }, 2000)
                return
            }

            setIsAdmin(true)
        } catch (error) {
            console.error('Error checking admin access:', error)
            setIsAdmin(false)
            router.push('/dashboard')
        } finally {
            setLoading(false)
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-stone-400">Verifying admin access...</p>
                </div>
            </div>
        )
    }

    // Unauthorized state
    if (isAdmin === false) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-stone-400 mb-6">
                        You don't have permission to access the admin panel.
                    </p>
                    <p className="text-sm text-stone-500">
                        Redirecting to dashboard...
                    </p>
                </div>
            </div>
        )
    }

    // Authorized - show admin panel
    return (
        <div className="min-h-screen bg-stone-950 flex text-stone-200 font-sans selection:bg-orange-500/30">
            <AdminSidebar />

            <main className="flex-1 ml-64 min-h-screen relative">
                {/* Background ambient glow */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: '#1c1917',
                                color: '#e7e5e4',
                                border: '1px solid rgba(255,255,255,0.1)',
                            },
                        }}
                    />
                    {children}
                </div>
            </main>
        </div>
    )
}
