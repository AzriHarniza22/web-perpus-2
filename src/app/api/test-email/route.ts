import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json()

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing required fields: to and subject' }, { status: 400 })
    }

    await sendEmail(to, subject, html || 'Test email content')

    return NextResponse.json({ success: true, message: 'Test email sent successfully' })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}