'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react'
import { isValidEmail } from '@/lib/validation'
import { handleError } from '@/lib/errors'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{field: string, message: string}[]>([])
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { login, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('Login page: user state changed', { hasUser: !!user, userId: user?.id })

    if (user && !isRedirecting) {
      // Check if email is confirmed
      if (!user.email_confirmed_at) {
        console.log('Login page: email not confirmed, redirecting to confirm', { email: user.email })
        setIsRedirecting(true)
        router.push(`/confirm?email=${encodeURIComponent(user.email ?? '')}`)
        return
      }

      const checkRoleAndRedirect = async () => {
        console.log('Login page: checking user role for redirect', { userId: user.id })
        setIsRedirecting(true)

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          // Redirect based on role
          const redirectPath = profile?.role === 'admin' ? '/admin' : '/dashboard'
          console.log('Login page: redirecting based on role', { role: profile?.role, redirectPath })

          router.push(redirectPath)
        } catch (error) {
          console.error('Login page: error checking role', { error, userId: user.id })
          // Fallback redirect
          router.push('/dashboard')
        }
      }

      checkRoleAndRedirect()
    } else if (!user) {
      console.log('Login page: no user, staying on login')
      setIsRedirecting(false)
    }
  }, [user, router, isRedirecting])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationErrors([])
    setIsEmailNotConfirmed(false)

    try {
      console.log('🔐 Login attempt', { email: formData.email })

      // Basic validation
      if (!formData.email || !formData.password) {
        const errors = []
        if (!formData.email) errors.push({ field: 'email', message: 'Email is required' })
        if (!formData.password) errors.push({ field: 'password', message: 'Password is required' })
        setValidationErrors(errors)
        return
      }

      if (!isValidEmail(formData.email)) {
        setValidationErrors([{ field: 'email', message: 'Please enter a valid email address' }])
        return
      }

      await login(formData.email, formData.password)

      console.log('✅ Login successful', { email: formData.email })

    } catch (error: unknown) {
      const appError = handleError(error)
      const errorMessage = appError.message

      if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
        setIsEmailNotConfirmed(true)
        setError('Email belum dikonfirmasi. Silakan periksa email Anda atau kirim ulang email konfirmasi.')
        console.warn('Login failed: email not confirmed', { email: formData.email })
        // Auto redirect to confirm page after 3 seconds
        setTimeout(() => {
          router.push(`/confirm?email=${encodeURIComponent(formData.email)}`)
        }, 3000)
      } else {
        setError(errorMessage)
        console.error('❌ Login failed', { error: errorMessage, email: formData.email })
      }
    }
  }

  const handleGoogleLogin = async () => {
    try {
      console.log('🔐 Google login attempt')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      console.log('✅ Google login initiated successfully')
    } catch (error: unknown) {
      const appError = handleError(error)
      setError(appError.message)
      console.error('❌ Google login failed', { error: appError.message })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-secondary-50 dark:from-gray-900 dark:via-primary-900 dark:to-secondary-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-primary-400/10 via-secondary-400/10 to-accent-400/10 dark:from-primary-400/5 dark:via-secondary-400/5 dark:to-accent-400/5"
        />
      </div>

      {/* Back Button & Theme Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="backdrop-blur-lg bg-background/90 border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Selamat Datang
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Masuk ke akun Anda untuk melakukan reservasi ruangan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.form
              onSubmit={handleLogin}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 h-11"
                    required
                    aria-describedby={validationErrors.some(err => err.field === 'email') ? "email-error" : undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 h-11"
                    required
                    aria-describedby={validationErrors.some(err => err.field === 'password') ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {validationErrors.map((validationError) => (
                  <motion.div
                    key={validationError.field}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{validationError.message}</p>
                  </motion.div>
                ))}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    id="login-error"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isEmailNotConfirmed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/confirm?email=${encodeURIComponent(formData.email)}`)}
                    className="text-sm w-full"
                  >
                    Kirim Ulang Email Konfirmasi
                  </Button>
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white font-medium"
                  disabled={isLoading || isRedirecting}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Memproses...
                    </>
                  ) : isRedirecting ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Mengalihkan...
                    </>
                  ) : (
                    <>
                      Masuk
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-gray-500">atau</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={handleGoogleLogin}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Masuk dengan Google
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-sm text-gray-600 dark:text-gray-400"
            >
              Belum punya akun?{' '}
              <Link
                href="/register"
                className="text-primary hover:text-primary dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Daftar di sini
              </Link>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}