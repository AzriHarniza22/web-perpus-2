import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log(`[CALLBACK] OAuth callback received, code: ${!!code}, next: ${next}`)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    console.log(`[CALLBACK] Code exchange result: error=${error ? error.message : 'none'}`)

    if (!error) {
      // Get user to check role
      const { data: { user } } = await supabase.auth.getUser()

      console.log(`[CALLBACK] User after exchange: ${user ? user.id : 'null'}`)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        console.log(`[CALLBACK] Profile lookup: role=${profile?.role}, error=${profile ? 'none' : 'profile not found'}`)

        // Redirect based on role
        const redirectTo = profile?.role === 'admin' ? '/admin' : '/dashboard'
        console.log(`[CALLBACK] Redirecting to: ${redirectTo}`)
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
    }
  }

  console.log(`[CALLBACK] Callback failed, redirecting to login`)
  // Return to login if something went wrong
  return NextResponse.redirect(new URL('/login', request.url))
}