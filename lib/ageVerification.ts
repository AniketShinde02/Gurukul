/**
 * CENTRALIZED AGE VERIFICATION & ACCESS CONTROL
 * 
 * This is the SINGLE SOURCE OF TRUTH for all age-related checks.
 * All age verification logic should use these utilities.
 * 
 * Age-based access rules:
 * - Under 16: Access denied
 * - 16-17: Limited access (no video matching, restricted community features)
 * - 18+: Full access
 */

export interface AgeVerificationResult {
    age: number
    isVerified: boolean
    canAccessPlatform: boolean
    canAccessVideoMatch: boolean
    canAccessAllCommunities: boolean
    restrictionMessage: string | null
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
    const ageInMs = Date.now() - dob.getTime()
    const ageInYears = ageInMs / (365.25 * 24 * 60 * 60 * 1000)
    return Math.floor(ageInYears)
}

/**
 * Get comprehensive age verification status
 */
export function getAgeVerificationStatus(dateOfBirth: string | Date | null): AgeVerificationResult {
    if (!dateOfBirth) {
        return {
            age: 0,
            isVerified: false,
            canAccessPlatform: false,
            canAccessVideoMatch: false,
            canAccessAllCommunities: false,
            restrictionMessage: 'Age verification required',
        }
    }

    const age = calculateAge(dateOfBirth)

    // Under 16: Denied
    if (age < 16) {
        return {
            age,
            isVerified: true,
            canAccessPlatform: false,
            canAccessVideoMatch: false,
            canAccessAllCommunities: false,
            restrictionMessage: 'You must be at least 16 years old to use this platform',
        }
    }

    // 16-17: Limited access
    if (age >= 16 && age < 18) {
        return {
            age,
            isVerified: true,
            canAccessPlatform: true,
            canAccessVideoMatch: false,
            canAccessAllCommunities: false,
            restrictionMessage: 'Video matching and some community features require you to be 18+',
        }
    }

    // 18+: Full access
    return {
        age,
        isVerified: true,
        canAccessPlatform: true,
        canAccessVideoMatch: true,
        canAccessAllCommunities: true,
        restrictionMessage: null,
    }
}

/**
 * Check if user can access video matching
 */
export function canAccessVideoMatch(dateOfBirth: string | Date | null): boolean {
    const status = getAgeVerificationStatus(dateOfBirth)
    return status.canAccessVideoMatch
}

/**
 * Check if user can access all community features
 */
export function canAccessAllCommunities(dateOfBirth: string | Date | null): boolean {
    const status = getAgeVerificationStatus(dateOfBirth)
    return status.canAccessAllCommunities
}

/**
 * Get user-friendly restriction message
 */
export function getRestrictionMessage(dateOfBirth: string | Date | null, feature: 'video_match' | 'community' | 'platform'): string {
    const status = getAgeVerificationStatus(dateOfBirth)

    if (!status.canAccessPlatform) {
        return 'You must be at least 16 years old to use this platform'
    }

    if (feature === 'video_match' && !status.canAccessVideoMatch) {
        return 'Video matching is only available for users 18 years and older'
    }

    if (feature === 'community' && !status.canAccessAllCommunities) {
        return 'Some community features are restricted for users under 18'
    }

    return 'Access granted'
}

/**
 * DEPRECATED: Old age verification logic
 * 
 * This function is kept for backward compatibility but should NOT be used.
 * Use getAgeVerificationStatus() instead.
 * 
 * @deprecated Use getAgeVerificationStatus() instead
 */
export function isAgeVerified_DEPRECATED(age: number): boolean {
    console.warn('DEPRECATED: isAgeVerified_DEPRECATED() is deprecated. Use getAgeVerificationStatus() instead.')
    return age >= 18
}

/**
 * DEPRECATED: Old age check
 * 
 * @deprecated Use calculateAge() instead
 */
export function checkAge_DEPRECATED(dateOfBirth: string): number {
    console.warn('DEPRECATED: checkAge_DEPRECATED() is deprecated. Use calculateAge() instead.')
    return calculateAge(dateOfBirth)
}
