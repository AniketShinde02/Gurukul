'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          toast.error('Authentication failed. Please try again.')
          router.push('/auth/signin')
          return
        }

        if (data.session) {
          // Check if user profile exists, create if not
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email!,
                username: generateAnonymousUsername(),
                created_at: new Date().toISOString(),
                last_seen: new Date().toISOString(),
                is_online: true,
                total_chats: 0,
                report_count: 0,
                is_banned: false,
              })

            if (createError) {
              console.error('Profile creation error:', createError)
              toast.error('Failed to create profile. Please try again.')
              router.push('/auth/signin')
              return
            }
          }

          toast.success('Welcome to Gurukul!')
          // Redirect to the 'next' param if it exists, otherwise dashboard
          router.push(next || '/dashboard')
        } else {
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        toast.error('Something went wrong. Please try again.')
        router.push('/auth/signin')
      }
    }

    handleAuthCallback()
  }, [router, next])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}

function generateAnonymousUsername(): string {
  const adjectives = [
    'Curious', 'Brave', 'Wise', 'Swift', 'Bright', 'Kind', 'Bold', 'Gentle',
    'Clever', 'Fierce', 'Calm', 'Wild', 'Sweet', 'Sharp', 'Bold', 'Quiet'
  ]
  const nouns = [
    'Owl', 'Wolf', 'Eagle', 'Fox', 'Bear', 'Lion', 'Tiger', 'Dolphin',
    'Phoenix', 'Dragon', 'Falcon', 'Panther', 'Raven', 'Shark', 'Hawk', 'Lynx'
  ]

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 99) + 1

  return `${adjective}${noun}${number}`
}

