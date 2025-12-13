import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Toaster } from 'react-hot-toast'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
