import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { ApiResponse } from '@/lib/types'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    const supabase = await getSupabaseServer(request)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('Error resending confirmation email:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to resend confirmation email'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email resent successfully',
      data: { success: true }
    })

  } catch (error) {
    console.error('Unexpected error in resend confirmation:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}