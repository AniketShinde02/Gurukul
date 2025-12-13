'use client'

import { Shield, Crown, Hammer, Bot, User } from 'lucide-react'

type RoleBadgeProps = {
    role: {
        name: string
        color: string
        icon?: string | null
    }
    isOwner?: boolean
    size?: 'sm' | 'md' | 'lg'
}

const ICON_MAP: Record<string, any> = {
    'shield': Shield,
    'crown': Crown,
    'hammer': Hammer,
    'bot': Bot,
    'user': User
}

export function RoleBadge({ role, isOwner = false, size = 'sm' }: RoleBadgeProps) {
    // Size mappings
    const sizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    }

    const iconSize = sizes[size]

    // Owner always gets crown
    if (isOwner) {
        return (
            <div title="Server Owner">
                <Crown className={`${iconSize} text-yellow-500`} />
            </div>
        )
    }

    // If role has icon
    if (role.icon) {
        // Check if it's an icon name
        const IconComponent = ICON_MAP[role.icon.toLowerCase()]

        if (IconComponent) {
            return (
                <div title={role.name}>
                    <IconComponent
                        className={iconSize}
                        style={{ color: role.color }}
                    />
                </div>
            )
        }

        // Check if it's emoji (Unicode emoji detection)
        if (/\p{Emoji}/u.test(role.icon)) {
            return <span title={role.name} className="text-sm">{role.icon}</span>
        }

        // Check if it's URL
        if (role.icon.startsWith('http')) {
            return (
                <img
                    src={role.icon}
                    alt={role.name}
                    className={iconSize}
                    title={role.name}
                />
            )
        }
    }

    // Fallback: just show colored dot
    return (
        <div
            className={`${iconSize} rounded-full`}
            style={{ backgroundColor: role.color }}
            title={role.name}
        />
    )
}
