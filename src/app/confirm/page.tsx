'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function ConfirmPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const registeredEmail = searchParams.get('email')

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const emailToUse = registeredEmail || email

    if (!emailToUse) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
      })

      if (error) throw error

      setMessage('Confirmation email sent! Please check your inbox.')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Konfirmasi Email</CardTitle>
          <CardDescription>
            Kami telah mengirim email konfirmasi ke {registeredEmail || 'alamat email Anda'}.
            Silakan periksa inbox Anda dan klik link konfirmasi untuk melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResend} className="space-y-4">
            {!registeredEmail && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  required
                />
              </div>
            )}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Ulang Email Konfirmasi'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/login')}
            >
              Kembali ke Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}