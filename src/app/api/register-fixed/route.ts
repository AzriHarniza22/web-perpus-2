import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer, getSupabaseAdmin, dbHelpers } from '@/lib/supabase'
import { validateRegistrationData, sanitizeRegistrationData } from '@/lib/validation'
import { handleError, formatErrorResponse } from '@/lib/errors'
import { RegistrationData, ApiResponse, RegistrationResponse } from '@/lib/types'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<RegistrationResponse>>> {
  try {
    console.log('🔄 [REGISTER] Starting registration process')

    const body = await request.json() as Partial<RegistrationData>
    const { email } = body

    console.log('🔄 [REGISTER] Received request for email:', email)
    console.log('🔄 [REGISTER] Request body:', JSON.stringify(body, null, 2))

    // 1. Validate input data (skip confirmPassword validation for API)
    console.log('🔄 [REGISTER] Step 1: Validating input data')
    // Create a complete RegistrationData object for validation, excluding confirmPassword check
    const validationData: RegistrationData = {
      email: body.email || '',
      password: body.password || '',
      confirmPassword: body.password || '', // Use password as confirmPassword for API validation
      fullName: body.fullName || '',
      institution: body.institution || '',
      phone: body.phone || ''
    }
    const validationErrors = validateRegistrationData(validationData)
    if (validationErrors.length > 0) {
      console.log('❌ [REGISTER] Validation failed:', validationErrors)
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: `Validation errors: ${validationErrors.map(e => e.message).join(', ')}`
      }, { status: 400 })
    }
    console.log('✅ [REGISTER] Validation passed')

    // 2. Sanitize input data
    console.log('🔄 [REGISTER] Step 2: Sanitizing input data')
    const sanitizedData = sanitizeRegistrationData(validationData)
    console.log('✅ [REGISTER] Sanitized data:', JSON.stringify(sanitizedData, null, 2))

    // 3. Get Supabase clients
    console.log('🔄 [REGISTER] Step 3: Initializing Supabase clients')
    const supabase = await getSupabaseServer(request)
    console.log('✅ [REGISTER] Server client initialized')

    const supabaseAdmin = getSupabaseAdmin()
    console.log('✅ [REGISTER] Admin client initialized')

    // 4. Validate required environment variables
    console.log('🔄 [REGISTER] Step 4: Validating environment variables')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ [REGISTER] SUPABASE_SERVICE_ROLE_KEY is missing from environment variables')
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured',
        details: 'SUPABASE_SERVICE_ROLE_KEY is missing from environment variables'
      } as ApiResponse<RegistrationResponse>, { status: 500 })
    }
    console.log('✅ [REGISTER] Environment variables validated')

    // 5. Register user (regular auth)
    console.log('🔄 [REGISTER] Step 5: Registering user with Supabase Auth')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedData.email,
      password: sanitizedData.password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        data: {
          name: sanitizedData.fullName, // Supabase standard field for display name
          full_name: sanitizedData.fullName,
          institution: sanitizedData.institution,
          phone: sanitizedData.phone
        }
      }
    })

    console.log('🔄 [REGISTER] Auth response:', {
      hasData: !!authData,
      hasUser: !!authData?.user,
      hasError: !!authError,
      errorMessage: authError?.message
    })

    if (authError || !authData.user) {
      console.error('❌ [REGISTER] Auth registration failed:', authError)
      const error = handleError(authError || new Error('User creation failed'))
      return NextResponse.json(formatErrorResponse(error) as ApiResponse<RegistrationResponse>, { status: error.statusCode })
    }

    console.log('✅ [REGISTER] User registered successfully:', authData.user.id)

    // 6. Create profile using service role (bypass RLS completely)
    console.log('🔄 [REGISTER] Step 6: Creating user profile')
    const profileData = await dbHelpers.createProfile(supabaseAdmin, {
      id: authData.user.id, // Add the user ID from auth
      email: sanitizedData.email,
      full_name: sanitizedData.fullName,
      institution: sanitizedData.institution,
      phone: sanitizedData.phone,
      profile_photo: null,
      role: 'user',
    })

    console.log('✅ [REGISTER] Profile created successfully:', profileData.id)
    console.log('✅ [REGISTER] Registration and profile creation successful')

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

    console.log('✅ [REGISTER] Sending success response')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [REGISTER] Unexpected error in registration process:', error)
    const appError = handleError(error)
    return NextResponse.json(formatErrorResponse(appError) as ApiResponse<RegistrationResponse>, { status: appError.statusCode })
  }
}