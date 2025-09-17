'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check user role after successful login
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // Redirect based on role
        if (profile?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      if (errorMessage.includes('Email not confirmed')) {
        setIsEmailNotConfirmed(true)
        setError('Email belum dikonfirmasi. Silakan periksa email Anda atau kirim ulang email konfirmasi.')
      } else {
        setIsEmailNotConfirmed(false)
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Masuk ke akun Anda untuk melakukan reservasi ruangan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {isEmailNotConfirmed && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/confirm?email=${encodeURIComponent(email)}`)}
                  className="text-sm"
                >
                  Kirim Ulang Email Konfirmasi
                </Button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              Login dengan Google
            </Button>
          </div>
          <p className="mt-4 text-center text-sm">
            Belum punya akun?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Daftar di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}