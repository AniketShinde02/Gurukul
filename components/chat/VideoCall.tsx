import { VideoGrid } from './VideoGrid'
import { Controls } from './Controls'

interface VideoCallProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMicOn: boolean
  isCameraOn: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onEndCall: () => void
}

export function VideoCall({
  localStream,
  remoteStream,
  isMicOn,
  isCameraOn,
  onToggleMic,
  onToggleCamera,
  onEndCall
}: VideoCallProps) {
  return (
    <div className="relative w-full h-full flex flex-col bg-black/90 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      {/* Video Grid Area */}
      <div className="flex-1 relative overflow-hidden">
        <VideoGrid
          localStream={localStream}
          remoteStream={remoteStream}
          isVideoEnabled={isCameraOn}
        />

        {/* Controls Overlay */}
        <Controls
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onEndCall={onEndCall}
        />
      </div>
    </div>
  )
}
