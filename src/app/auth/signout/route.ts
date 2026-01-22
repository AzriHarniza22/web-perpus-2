import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Clear all cookies for complete logout
          cookiesToSet.forEach(({ name }) => {
            request.cookies.set({ 
              name, 
              value: '', 
            })
          })
        },
      },
    }
  )

  console.log('[SIGN OUT ROUTE] Starting server-side sign out')
  
  await supabase.auth.signOut()
  
  console.log('[SIGN OUT ROUTE] Sign out successful, redirecting to login')
  
  // Create response with cookie clearing
  const response = NextResponse.redirect(new URL('/login', request.url))
  
  // Clear all Supabase auth cookies
  const cookies = request.cookies.getAll()
  cookies.forEach(cookie => {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
      response.cookies.set(cookie.name, '')
    }
  })
  
  return response
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  await supabase.auth.signOut()

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url))
}