'use client'

import { Shield, Crown, Hammer, Bot, Star, Zap, Users, Award } from 'lucide-react'

type RoleBadgeProps = {
    role: {
        name: string
        color: string
        icon?: string | null
    }
    isOwner?: boolean
    size?: 'sm' | 'md' | 'lg'
    showName?: boolean
}

// Icon name to Lucide component mapping
const ICON_MAP: Record<string, any> = {
    'shield': Shield,
    'crown': Crown,
    'hammer': Hammer,
    'bot': Bot,
    'star': Star,
    'zap': Zap,
    'users': Users,
    'award': Award
}

export function RoleBadge({ role, isOwner = false, size = 'sm', showName = false }: RoleBadgeProps) {
    // Size mappings
    const sizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    }

    const textSizes = {
        sm: 'text-[10px]',
        md: 'text-xs',
        lg: 'text-sm'
    }

    const iconSize = sizes[size]
    const textSize = textSizes[size]

    // Owner always gets crown
    if (isOwner) {
        return (
            <div className="flex items-center gap-1" title="Server Owner">
                <Crown className={`${iconSize} text-yellow-500`} />
                {showName && <span className={`${textSize} text-yellow-500 font-medium`}>Owner</span>}
            </div>
        )
    }

    // If role has icon
    if (role.icon) {
        // Check if it's an icon name (e.g., "shield", "crown")
        const IconComponent = ICON_MAP[role.icon.toLowerCase()]

        if (IconComponent) {
            return (
                <div className="flex items-center gap-1" title={role.name}>
                    <IconComponent
                        className={iconSize}
                        style={{ color: role.color }}
                    />
                    {showName && (
                        <span className={`${textSize} font-medium`} style={{ color: role.color }}>
                            {role.name}
                        </span>
                    )}
                </div>
            )
        }

        // Check if it's emoji (contains emoji characters)
        if (/\p{Emoji}/u.test(role.icon)) {
            return (
                <div className="flex items-center gap-1" title={role.name}>
                    <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
                        {role.icon}
                    </span>
                    {showName && (
                        <span className={`${textSize} font-medium`} style={{ color: role.color }}>
                            {role.name}
                        </span>
                    )}
                </div>
            )
        }

        // Check if it's URL (starts with http)
        if (role.icon.startsWith('http')) {
            return (
                <div className="flex items-center gap-1" title={role.name}>
                    <img src={role.icon} alt={role.name} className={`${iconSize} rounded-sm`} />
                    {showName && (
                        <span className={`${textSize} font-medium`} style={{ color: role.color }}>
                            {role.name}
                        </span>
                    )}
                </div>
            )
        }
    }

    // Fallback: Show colored dot if no icon, or colored name if showName
    if (showName) {
        return (
            <span className={`${textSize} font-medium`} style={{ color: role.color }} title={role.name}>
                {role.name}
            </span>
        )
    }

    return (
        <div
            className={`${iconSize} rounded-full`}
            style={{ backgroundColor: role.color }}
            title={role.name}
        />
    )
}

// Compact role badge list component
export function RoleBadgeList({ roles, isOwner, max = 3 }: { roles: any[], isOwner?: boolean, max?: number }) {
    if (!roles || roles.length === 0) return null

    const displayRoles = roles.slice(0, max)
    const remaining = roles.length - max

    return (
        <div className="flex items-center gap-1">
            {isOwner && <RoleBadge role={{ name: 'Owner', color: '#FFD700', icon: 'crown' }} isOwner size="sm" />}
            {displayRoles.map((role) => (
                <RoleBadge key={role.id} role={role} size="sm" />
            ))}
            {remaining > 0 && (
                <span className="text-[10px] text-stone-500 font-medium">
                    +{remaining}
                </span>
            )}
        </div>
    )
}
