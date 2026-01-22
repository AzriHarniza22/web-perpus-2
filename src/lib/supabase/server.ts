import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          console.log(`[SERVER SUPABASE] Getting ${allCookies.length} cookies`)
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log(`[SERVER SUPABASE] Setting cookie: ${name}`)
              cookieStore.set(name, value, {
                ...options,
                // Ensure cookies work for SSR
                httpOnly: options?.httpOnly ?? true,
                secure: options?.secure ?? process.env.NODE_ENV === 'production',
                sameSite: options?.sameSite ?? 'lax',
                path: options?.path ?? '/',
              })
            })
          } catch (error) {
            console.log(`[SERVER SUPABASE] Cookie set failed (expected in SSR):`, error)
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}