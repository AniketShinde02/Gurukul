import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Call verification check function
        const { data: dbCheck, error } = await supabase
            .rpc('check_user_verification', { user_id_param: user.id })
            .single()

        if (error) throw error

        const check = dbCheck as {
            is_verified: boolean
            verification_level: string
            missing_requirements: string[]
        }

        return NextResponse.json({
            is_verified: check.is_verified,
            verification_level: check.verification_level,
            missing_requirements: check.missing_requirements || []
        })

    } catch (error: any) {
        console.error('Verification status error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to check verification status' },
            { status: 500 }
        )
    }
}
