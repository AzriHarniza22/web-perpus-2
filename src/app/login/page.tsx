'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
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
  const [touched, setTouched] = useState<{email: boolean, password: boolean}>({
    email: false,
    password: false,
  })
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const { login, isLoading, user } = useAuth()
  const router = useRouter()

  // Memoized validation function
  const validateForm = useMemo(() => {
    return (data: LoginFormData) => {
      const errors: {field: string, message: string}[] = []

      if (!data.email) {
        errors.push({ field: 'email', message: 'Email is required' })
      } else if (!isValidEmail(data.email)) {
        errors.push({ field: 'email', message: 'Please enter a valid email address' })
      }

      if (!data.password) {
        errors.push({ field: 'password', message: 'Password is required' })
      }

      return errors
    }
  }, [])

  // Debounced validation - only for real-time feedback, not showing errors
  const debouncedValidate = useCallback((data: LoginFormData) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    const timer = setTimeout(() => {
      // Keep debounced validation for potential future use, but don't set errors
      // This maintains the existing debounced system without showing premature errors
    }, 300)

    setDebounceTimer(timer)
  }, [debounceTimer])

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

  // useCallback for event handlers
  const handleInputChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    debouncedValidate({ ...formData, [field]: value })
  }, [formData, debouncedValidate])

  const handleFieldBlur = useCallback((field: keyof LoginFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    // Validate only this field on blur
    const errors = validateForm(formData)
    const fieldErrors = errors.filter(error => error.field === field)
    setValidationErrors(prev => {
      // Remove existing errors for this field and add new ones
      const filtered = prev.filter(error => error.field !== field)
      return [...filtered, ...fieldErrors]
    })
  }, [formData, validateForm])

  const handleFieldFocus = useCallback((field: keyof LoginFormData) => {
    // Clear errors for this field when user starts typing
    setValidationErrors(prev => prev.filter(error => error.field !== field))
  }, [])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationErrors([])
    setIsEmailNotConfirmed(false)

    try {
      console.log('🔐 Login attempt', { email: formData.email })

      const errors = validateForm(formData)
      if (errors.length > 0) {
        setValidationErrors(errors)
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
  }, [formData, validateForm, login, router])


  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

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
        className="w-full max-w-6xl relative z-10"
      >
        <div className="grid lg:grid-cols-2 gap-0 min-h-[700px] rounded-3xl overflow-hidden shadow-2xl">
          {/* Left Side - Background Image */}
          <div className="relative hidden lg:block">
            <Image
              src="/gedungperpusaceh.jpg"
              alt="Library Building"
              fill
              className="object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            {/* Logo positioned over the background image */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="absolute top-8 left-8 z-10"
            >
              <Image
                src="/logo.svg"
                alt="Library Reservation Logo"
                width={80}
                height={80}
                className="drop-shadow-lg opacity-90"
              />
            </motion.div>
            <div className="absolute bottom-8 left-8 text-white">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold mb-2"
              >
                Selamat Datang
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="text-white/90"
              >
                Masuk ke akun Anda untuk melakukan reservasi ruangan yang mudah dan cepat
              </motion.p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-background/95 backdrop-blur-xl border-0 lg:border-l border-gray-200/20 dark:border-gray-700/20 flex flex-col min-h-[700px]">
            <div className="flex-1 flex items-center justify-center p-10 lg:p-16">
              <div className="w-full">
                <CardContent className="space-y-12 px-0">
                  <div className="text-center pb-8 px-0">
                    <h1 className="text-2xl font-bold text-blue-600 mb-4">
                      Selamat Datang
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Masuk ke akun Anda untuk melakukan reservasi ruangan
                    </p>
                  </div>
            <motion.form
              onSubmit={handleLogin}
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    onFocus={() => handleFieldFocus('email')}
                    className="pl-10 h-11 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    required
                    aria-describedby={validationErrors.some(err => err.field === 'email') ? "email-error" : undefined}
                    aria-label="Email address"
                  />
                </motion.div>
                <AnimatePresence>
                  {validationErrors
                    .filter(error => error.field === 'email')
                    .map((validationError) => (
                      <motion.div
                        key={validationError.field}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                        role="alert"
                        aria-live="polite"
                      >
                        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{validationError.message}</p>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => handleFieldBlur('password')}
                    onFocus={() => handleFieldFocus('password')}
                    className="pl-10 pr-10 h-11 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    required
                    aria-describedby={validationErrors.some(err => err.field === 'password') ? "password-error" : undefined}
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </motion.div>
                <AnimatePresence>
                  {validationErrors
                    .filter(error => error.field === 'password')
                    .map((validationError) => (
                      <motion.div
                        key={validationError.field}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                        role="alert"
                        aria-live="polite"
                      >
                        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{validationError.message}</p>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
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
                className="relative overflow-hidden rounded-lg"
              >
                <Button
                  type="submit"
                  className="w-full h-11 relative z-10"
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
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-lg"
                  initial={{ scale: 0, opacity: 1 }}
                  whileTap={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            </motion.form>


            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8"
            >
              Belum punya akun?{' '}
              <Link
                href="/register"
                className="text-primary hover:text-primary dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Daftar di sini
              </Link>
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4"
            >
              Lupa password?{' '}
              <Link
                href="/forgot-password"
                className="text-primary hover:text-primary dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Reset di sini
              </Link>
            </motion.p>
                </CardContent>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}