import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  console.log(`[MIDDLEWARE] Path: ${path}, User: ${user ? user.id : 'null'}`)

  // Define route patterns
  const isAuthPage = path === '/login' || path === '/signup' || path === '/confirm'
  const isPublicPage = path === '/' || path.startsWith('/rooms')
  const isAdminPage = path.startsWith('/admin')
  const isDashboardPage = path.startsWith('/dashboard')
  const isProtectedPage = isAdminPage || isDashboardPage

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

  return supabaseResponse
}

// Helper function to get user role
async function getProfileRole(supabase: any, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data
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