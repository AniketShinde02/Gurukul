import { Mic, MicOff, Video, VideoOff, Phone, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ReportModal } from '@/components/ReportModal'

interface ControlsProps {
    isMicOn: boolean
    isCameraOn: boolean
    onToggleMic: () => void
    onToggleCamera: () => void
    onEndCall: () => void
    partnerId?: string
    partnerUsername?: string
    sessionId?: string
}

export function Controls({
    isMicOn,
    isCameraOn,
    onToggleMic,
    onToggleCamera,
    onEndCall,
    partnerId,
    partnerUsername,
    sessionId
}: ControlsProps) {
    const [showReportModal, setShowReportModal] = useState(false)

    return (
        <>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-lg">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleMic}
                        className={`rounded-full w-14 h-14 transition-colors ${!isMicOn
                            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                            : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCamera}
                        className={`rounded-full w-14 h-14 transition-colors ${!isCameraOn
                            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                            : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </Button>

                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={onEndCall}
                        className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white shadow-red-900/20"
                    >
                        <Phone className="w-6 h-6" />
                    </Button>

                    {/* Report Button - Only show if we have partner info */}
                    {partnerId && partnerUsername && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowReportModal(true)}
                            className="rounded-full w-14 h-14 bg-white/10 text-white hover:bg-white/20 transition-colors"
                            title="Report User"
                        >
                            <Flag className="w-6 h-6" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Report Modal */}
            {partnerId && partnerUsername && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    reportedUserId={partnerId}
                    reportedUsername={partnerUsername}
                    sessionId={sessionId}
                />
            )}
        </>
    )
}
