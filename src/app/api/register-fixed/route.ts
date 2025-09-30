import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer, getSupabaseAdmin, dbHelpers } from '@/lib/supabase'
import { validateRegistrationData, sanitizeRegistrationData } from '@/lib/validation'
import { handleError, formatErrorResponse, DatabaseError } from '@/lib/errors'
import { RegistrationData, ApiResponse, RegistrationResponse } from '@/lib/types'

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<RegistrationResponse>>> {
  try {
    const body = await request.json() as RegistrationData
    const { email, password, fullName, institution, phone } = body

    console.log('🔄 Starting registration for:', email)

    // 1. Validate input data
    const validationErrors = validateRegistrationData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: `Validation errors: ${validationErrors.map(e => e.message).join(', ')}`
      }, { status: 400 })
    }

    // 2. Sanitize input data
    const sanitizedData = sanitizeRegistrationData(body)

    // 3. Get Supabase clients
    const supabase = await getSupabaseServer(request)
    const supabaseAdmin = getSupabaseAdmin()

    // 4. Validate required environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing from environment variables')
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured',
        details: 'SUPABASE_SERVICE_ROLE_KEY is missing from environment variables'
      } as ApiResponse<RegistrationResponse>, { status: 500 })
    }

    // 3. Register user (regular auth)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedData.email,
      password: sanitizedData.password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`
      }
    })

    if (authError || !authData.user) {
      const error = handleError(authError || new Error('User creation failed'))
      return NextResponse.json(formatErrorResponse(error) as ApiResponse<RegistrationResponse>, { status: error.statusCode })
    }

    console.log('✅ User registered:', authData.user.id)

    // 4. Create profile using service role (bypass RLS completely)
    const profileData = await dbHelpers.createProfile(supabaseAdmin, {
      email: sanitizedData.email,
      full_name: sanitizedData.fullName,
      institution: sanitizedData.institution,
      phone: sanitizedData.phone,
      profile_photo: null,
      role: 'user',
    })

    console.log('✅ Registration and profile creation successful')

    const response: ApiResponse<RegistrationResponse> = {
      success: true,
      message: 'Registration and profile creation successful',
      data: {
        success: true,
        userId: authData.user.id,
        email: authData.user.email!,
        profile: profileData
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    const appError = handleError(error)
    return NextResponse.json(formatErrorResponse(appError) as ApiResponse<RegistrationResponse>, { status: appError.statusCode })
  }
}