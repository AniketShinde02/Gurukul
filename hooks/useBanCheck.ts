import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface BanDetails {
    id: string
    user_id: string
    reason: string
    banned_until: string | null
    created_at: string
}

interface BanStatus {
    is_banned: boolean
    ban_details: BanDetails | null
}

export function useBanCheck() {
    const [isBanned, setIsBanned] = useState(false)
    const [banDetails, setBanDetails] = useState<BanDetails | null>(null)
    const [isChecking, setIsChecking] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkBanStatus()

        // Check every 5 minutes
        const interval = setInterval(checkBanStatus, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [])

    const checkBanStatus = async () => {
        try {
            const response = await fetch('/api/reports')
            const data: BanStatus = await response.json()

            if (data.is_banned) {
                setIsBanned(true)
                setBanDetails(data.ban_details)

                // Show ban message
                const bannedUntil = data.ban_details?.banned_until
                const message = bannedUntil
                    ? `You are banned until ${new Date(bannedUntil).toLocaleString()}`
                    : 'You are permanently banned'

                toast.error(`${message}\nReason: ${data.ban_details?.reason}`, {
                    duration: 10000
                })

                // Redirect to banned page
                router.push('/banned')
            } else {
                setIsBanned(false)
                setBanDetails(null)
            }
        } catch (error) {
            console.error('Ban check error:', error)
        } finally {
            setIsChecking(false)
        }
    }

    return {
        isBanned,
        banDetails,
        isChecking,
        recheckBanStatus: checkBanStatus
    }
}
