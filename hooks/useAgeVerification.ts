import { useEffect, useState } from 'react'

interface AgeVerificationStatus {
    age_verified: boolean
    has_dob: boolean
    age: number | null
    verified_at: string | null
    is_adult: boolean
}

export function useAgeVerification() {
    const [status, setStatus] = useState<AgeVerificationStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        checkAgeVerification()
    }, [])

    const checkAgeVerification = async () => {
        try {
            const response = await fetch('/api/verify-age')
            const data = await response.json()

            setStatus(data)

            // Show modal if not verified
            if (!data.age_verified) {
                setShowModal(true)
            }
        } catch (error) {
            console.error('Age verification check error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const requireVerification = () => {
        if (!status?.age_verified) {
            setShowModal(true)
            return false
        }
        return true
    }

    return {
        isVerified: status?.age_verified || false,
        isAdult: status?.is_adult || false,
        age: status?.age,
        isLoading,
        showModal,
        setShowModal,
        recheckVerification: checkAgeVerification,
        requireVerification
    }
}
