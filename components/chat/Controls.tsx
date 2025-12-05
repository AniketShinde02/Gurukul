import { Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ControlsProps {
    isMicOn: boolean
    isCameraOn: boolean
    onToggleMic: () => void
    onToggleCamera: () => void
    onEndCall: () => void
}

export function Controls({
    isMicOn,
    isCameraOn,
    onToggleMic,
    onToggleCamera,
    onEndCall
}: ControlsProps) {
    return (
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
            </div>
        </div>
    )
}
