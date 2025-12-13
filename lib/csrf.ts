// CSRF Protection Middleware

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf_token'

export function generateCSRFToken(): string {
    return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

export function validateCSRFToken(
    cookieToken: string | undefined,
    headerToken: string | undefined
): boolean {
    if (!cookieToken || !headerToken) {
        return false
    }

    // Compare hashed tokens to prevent timing attacks
    const hashedCookie = hashToken(cookieToken)
    const hashedHeader = hashToken(headerToken)

    return hashedCookie === hashedHeader
}

export function csrfProtection(handler: Function) {
    return async (request: NextRequest) => {
        //  Only apply CSRF protection to state-changing methods
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
            const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
            const headerToken = request.headers.get('X-CSRF-Token')

            if (!validateCSRFToken(cookieToken, headerToken || undefined)) {
                return NextResponse.json(
                    { error: 'Invalid CSRF token' },
                    { status: 403 }
                )
            }
        }

        return handler(request)
    }
}

// Usage in API routes:
// export const POST = csrfProtection(async (request: NextRequest) => { /* your handler */ })
