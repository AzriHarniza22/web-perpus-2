import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
       console.log('Auth callback: User authenticated:', {
         userId: data.user.id,
         email: data.user.email,
         session: data.session ? 'present' : 'missing'
       })

       // Check if profile exists, if not create it
       const { data: profile, error: profileError } = await supabase
         .from('profiles')
         .select('id, role')
         .eq('id', data.user.id)
         .single()

       console.log('Auth callback: Profile check result:', {
         profile: profile ? 'exists' : 'not found',
         profileError: profileError?.message,
         profileErrorCode: profileError?.code
       })

       if (!profile) {
         console.log('Auth callback: Creating new profile for user:', data.user.id)

         // Get current auth UID for debugging
         const { data: currentUser } = await supabase.auth.getUser()
         console.log('Auth callback: Current auth UID:', currentUser?.user?.id)

         // Create profile using user metadata
         const userMeta = data.user.user_metadata || {}
         const { error: insertError } = await supabase
           .from('profiles')
           .insert({
             id: data.user.id,
             email: data.user.email,
             full_name: userMeta.full_name || '',
             institution: userMeta.institution || '',
             phone: userMeta.phone || '',
           })

         console.log('Auth callback: Profile insert result:', {
           error: insertError?.message,
           errorCode: insertError?.code,
           errorDetails: insertError?.details
         })
       }

      // Check user role and redirect accordingly
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const redirectPath = userProfile?.role === 'admin' ? '/admin' : (next || '/dashboard')
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}