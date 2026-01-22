import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  console.log(`[MIDDLEWARE] Path: ${path}, User: ${user ? user.id : 'null'}, Auth Error: ${authError?.message || 'none'}`)
  console.log(`[MIDDLEWARE] Cookies count: ${request.cookies.getAll().length}`)
  console.log(`[MIDDLEWARE] Has session cookie: ${request.cookies.getAll().some(c => c.name.includes('sb-'))}`)
  console.log(`[DEBUG] Request URL: ${request.url}`)
  console.log(`[DEBUG] User Agent: ${request.headers.get('user-agent')}`)

  // Define route patterns
  const isAuthPage = path === '/login' || path === '/signup' || path === '/confirm'
  const isPublicPage = path === '/' || path.startsWith('/rooms')
  const isAdminPage = path.startsWith('/admin')
  const isDashboardPage = path.startsWith('/dashboard')
  const isProtectedPage = isAdminPage || isDashboardPage
  const isRootPage = path === '/'

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const profile = await getProfileRole(supabase, user.id)
    const redirectTo = profile?.role === 'admin' ? '/admin' : '/dashboard'
    console.log(`[MIDDLEWARE] Redirecting authenticated user from auth page to: ${redirectTo}, role: ${profile?.role}`)
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Redirect unauthenticated users from protected pages
  if (!user && isProtectedPage) {
    const redirectUrl = new URL('/login', request.url)
    // Save original destination for redirect after login
    redirectUrl.searchParams.set('redirect', path)
    console.log(`[MIDDLEWARE] Redirecting unauthenticated user to login, original path: ${path}`)
    return NextResponse.redirect(redirectUrl)
  }

  // Check admin authorization for admin pages
  if (user && isAdminPage) {
    const profile = await getProfileRole(supabase, user.id)
    console.log(`[MIDDLEWARE] Admin page access check - User: ${user.id}, Role: ${profile?.role}`)
    if (profile?.role !== 'admin') {
      console.log(`[MIDDLEWARE] Non-admin user accessing admin page, redirecting to dashboard`)
      console.log(`[MIDDLEWARE] Profile details:`, profile)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Allow all users to access root page to prevent race conditions
  // Client-side will handle authentication redirects after auth state is confirmed
  console.log(`[MIDDLEWARE] Allowing access to root page - client-side will handle redirects`)
  
  // Special handling for authenticated users on root page - don't redirect server-side
  if (user && path === '/') {
    console.log(`[MIDDLEWARE] Authenticated user on root page, allowing client-side redirect`)
    return supabaseResponse
  }

  return supabaseResponse
}

// Helper function to get user role
async function getProfileRole(supabase: any, userId: string): Promise<{ role: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('[MIDDLEWARE] Error fetching user role:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('[MIDDLEWARE] Exception fetching user role:', error)
    return null
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images, icons, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}