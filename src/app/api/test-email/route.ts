import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json()

    if (!to || !subject) {
      return NextResponse.json({ error: 'Field wajib tidak lengkap: to dan subject' }, { status: 400 })
    }

    await sendEmail(to, subject, html || 'Test email content')

    return NextResponse.json({ success: true, message: 'Test email berhasil dikirim' })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ error: 'Gagal mengirim test email', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}