import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // ✅ List of protected routes that require auth
  const protectedRoutes = [
    '/dashboard',
    '/chat',
    '/profile',
    '/sangha',
    '/settings',
    '/rooms'
  ]

  // ✅ Check if current path is protected
  const isProtected = protectedRoutes.some(route => path.startsWith(route))

  if (!isProtected) {
    // ✅ Skip middleware for public routes - no DB calls
    return NextResponse.next()
  }

  // ✅ Lightweight check: verify if ANY Supabase auth cookie exists
  // Supabase cookies are named like: sb-<project-ref>-auth-token
  const allCookies = req.cookies.getAll()
  const hasAuthCookie = allCookies.some(cookie =>
    cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')
  )

  if (!hasAuthCookie) {
    // ✅ No DB needed: missing cookie = not authenticated
    // Redirect to home page where AuthModal can be triggered
    return NextResponse.redirect(new URL('/', req.url))
  }

  // ✅ For full user verification, do it in Server Component or route handler
  // Don't do database lookups in middleware - they block every request
  return NextResponse.next()
}

export const config = {
  // ✅ Be specific: only apply to pages that need auth
  // Don't run middleware on static files, images, API routes, etc.
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/sangha/:path*',
    '/settings/:path*',
    '/rooms/:path*',
  ],
}
