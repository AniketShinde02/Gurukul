import { Trash2, Users, Radio } from 'lucide-react'

type EventCardProps = {
    event: {
        id: string
        name: string
        description?: string | null
        start_time: string
        end_time?: string | null
        status?: 'upcoming' | 'active' | 'past'
        participant_count?: number
        channel_id?: string | null
    }
    canManage: boolean
    onDelete: (id: string) => void
    onJoin: (event: any) => void
}

export function EventCard({ event, canManage, onDelete, onJoin }: EventCardProps) {
    const isActive = event.status === 'active'
    const isPast = event.status === 'past'

    return (
        <div
            onClick={() => !isPast && onJoin(event)}
            className={`px-2 py-2 rounded-lg border transition-all cursor-pointer group relative ${isActive
                    ? 'bg-orange-600/20 border-orange-500/50 hover:border-orange-500 shadow-lg shadow-orange-500/10'
                    : isPast
                        ? 'bg-stone-800/30 border-stone-700/30 opacity-60'
                        : 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40'
                }`}
        >
            {/* Live Badge */}
            {isActive && (
                <div className="absolute -top-1 -right-1 flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded-full text-[9px] font-bold text-white animate-pulse">
                    <Radio className="w-2 h-2" />
                    LIVE
                </div>
            )}

            {/* Delete Button */}
            {canManage && !isPast && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(event.id)
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:text-red-400 text-orange-400 transition-opacity z-10"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}

            {/* Event Name */}
            <div className={`text-sm font-bold truncate pr-6 ${isActive ? 'text-orange-300' : isPast ? 'text-stone-500' : 'text-orange-400'
                }`}>
                {event.name}
            </div>

            {/* Time */}
            <div className={`text-[10px] mt-0.5 ${isPast ? 'text-stone-600' : 'text-stone-400'}`}>
                {new Date(event.start_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                })}
            </div>

            {/* Description */}
            {event.description && (
                <div className={`text-[10px] mt-1 line-clamp-2 ${isPast ? 'text-stone-600' : 'text-stone-500'}`}>
                    {event.description}
                </div>
            )}

            {/* Participant Count */}
            {event.participant_count !== undefined && event.participant_count > 0 && (
                <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${isActive ? 'text-orange-300' : isPast ? 'text-stone-600' : 'text-stone-400'
                    }`}>
                    <Users className="w-3 h-3" />
                    <span>{event.participant_count} attending</span>
                </div>
            )}

            {/* Join Button for Active Events */}
            {isActive && (
                <div className="mt-2 pt-2 border-t border-orange-500/30">
                    <div className="text-[10px] font-bold text-orange-300 text-center">
                        Click to join →
                    </div>
                </div>
            )}
        </div>
    )
}
