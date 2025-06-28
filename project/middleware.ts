import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response that will be used to set cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Forward the cookie to the response
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'lax',
            path: '/',
          })
        },
        remove(name: string, options: CookieOptions) {
          // Delete the cookie in the response
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
            path: '/',
          })
        },
      },
    }
  )

  // Skip middleware for static files, Next.js internals, auth-related paths, and public assets
  const publicPaths = [
    '/_next/',
    '/favicon.ico',
    '/api/auth',
    '/auth/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/api/trpc',
    '/_vercel',
    '/__nextjs_original-stack-frame',
    '/__nextjs_loading'
  ]

  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return response
  }

  // Get the session from the auth token in the request cookies
  const { data: { session }, error } = await supabase.auth.getSession()
  
  console.log('Middleware - Path:', request.nextUrl.pathname)
  console.log('Session exists:', !!session)
  if (error) console.error('Session error:', error)

  // Handle login page
  if (request.nextUrl.pathname === '/login') {
    if (session) {
      console.log('Already authenticated, redirecting to dashboard')
      const redirectUrl = new URL('/dashboard', request.url)
      // Copy cookies to the redirect response
      const redirectResponse = NextResponse.redirect(redirectUrl)
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie)
      })
      return redirectResponse
    }
    return response
  }

  // Handle API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Add CORS headers for API routes
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
    
    return response
  }

  // If no session, redirect to login
  if (!session) {
    console.log('No session, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    
    // Only add redirect for non-API and non-static paths
    if (!request.nextUrl.pathname.startsWith('/_next/') && 
        !request.nextUrl.pathname.startsWith('/api/') &&
        !publicPaths.some(path => request.nextUrl.pathname === path)) {
      loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    }
    
    // Create a new response with the redirect
    const redirectResponse = NextResponse.redirect(loginUrl)
    // Copy any cookies from the original response
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // User is authenticated and not on login page, allow the request
  console.log('Allowing authenticated request to proceed')
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}