import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { ApiResponse } from '@/lib/types'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    console.log('🔄 [CHANGE-PASSWORD] Starting password change process')

    // 1. Get authenticated user
    const user = await getUser()
    if (!user) {
      console.log('❌ [CHANGE-PASSWORD] No authenticated user')
      return NextResponse.json({
        success: false,
        error: 'Otentikasi diperlukan'
      }, { status: 401 })
    }

    console.log('✅ [CHANGE-PASSWORD] User authenticated:', user.id)

    // 2. Parse request body
    const body = await request.json()
    const { currentPassword, newPassword } = body

    console.log('🔄 [CHANGE-PASSWORD] Received password change request')

    // 3. Validate input
    if (!currentPassword || !newPassword) {
      console.log('❌ [CHANGE-PASSWORD] Missing required fields')
      return NextResponse.json({
        success: false,
        error: 'Password saat ini dan password baru wajib diisi'
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      console.log('❌ [CHANGE-PASSWORD] New password too short')
      return NextResponse.json({
        success: false,
        error: 'Password baru minimal 6 karakter'
      }, { status: 400 })
    }

    // 4. Initialize Supabase client
    const supabase = await createClient()

    // 5. Verify current password by attempting to sign in
    console.log('🔄 [CHANGE-PASSWORD] Verifying current password')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (signInError) {
      console.log('❌ [CHANGE-PASSWORD] Current password verification failed:', signInError.message)
      return NextResponse.json({
        success: false,
        error: 'Password saat ini salah'
      }, { status: 400 })
    }

    console.log('✅ [CHANGE-PASSWORD] Current password verified')

    // 6. Update password
    console.log('🔄 [CHANGE-PASSWORD] Updating password')
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('❌ [CHANGE-PASSWORD] Password update failed:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Gagal memperbarui password'
      }, { status: 500 })
    }

    console.log('✅ [CHANGE-PASSWORD] Password updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui'
    })

  } catch (error) {
    console.error('❌ [CHANGE-PASSWORD] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan yang tidak terduga'
    }, { status: 500 })
  }
}