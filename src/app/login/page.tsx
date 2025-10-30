'use client'

import { useState, useCallback, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, XCircle } from 'lucide-react'
import { validateLoginData } from '@/lib/validation'
import { handleError } from '@/lib/errors'
import { LoginData } from '@/lib/types'
import { useDebouncedValidation } from '@/hooks/useDebouncedValidation'
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal'
import Image from 'next/image'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const params = use(searchParams)
  const [formData, setFormData] = useState<LoginData>({
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
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Debounced validation for real-time feedback
  const { debouncedValidate } = useDebouncedValidation<LoginData>((data) => {
    // Real-time validation feedback without showing errors
    // This provides immediate visual feedback while preventing premature error display
  }, { delay: 300 })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setHasInteracted(true)
    setShowValidationErrors(true)
    debouncedValidate({ ...formData, [name]: value })
  }, [formData, debouncedValidate])

  const handleFieldBlur = useCallback((field: keyof LoginData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    // Only show validation errors if user has interacted with the form and validation is enabled
    if (hasInteracted && showValidationErrors) {
      // Validate only this field on blur
      const errors = validateLoginData(formData)
      const fieldErrors = errors.filter(error => error.field === field)
      setValidationErrors(prev => {
        // Remove existing errors for this field and add new ones
        const filtered = prev.filter(error => error.field !== field)
        return [...filtered, ...fieldErrors]
      })
    }
  }, [formData, hasInteracted, showValidationErrors])

  const handleFieldFocus = useCallback((field: keyof LoginData) => {
    // Clear errors for this field when user starts typing
    setValidationErrors(prev => prev.filter(error => error.field !== field))
  }, [])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationErrors([])
    setIsLoggingIn(true)
    setHasInteracted(true)
    setShowValidationErrors(true)

    try {
      console.log('🔄 Starting login for:', formData.email)

      // 1. Validate form data
      const validationErrors = validateLoginData(formData)
      if (validationErrors.length > 0) {
        setValidationErrors(validationErrors)
        return
      }

      // 2. Attempt login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        const appError = handleError(signInError)
        setError(appError.message)
        return
      }

      if (!data.user) {
        setError('Login gagal. Silakan coba lagi.')
        return
      }

      // Check if email is confirmed
      if (!data.user.email_confirmed_at) {
        router.push(`/confirm?email=${encodeURIComponent(formData.email)}`)
        return
      }

      // Get user profile to determine redirect
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      console.log(`[LOGIN] Profile lookup result: role=${profile?.role}, error=${profileError ? profileError.message : 'none'}`)
      console.log(`[LOGIN] Profile data:`, profile)
      console.log(`[LOGIN] Profile error details:`, profileError)

      // Redirect based on role or saved redirect path
      const destination = params?.redirect || (profile?.role === 'admin' ? '/admin' : '/dashboard')
      console.log(`[LOGIN] Redirecting to: ${destination}`)
      console.log(`[LOGIN] Current URL before redirect:`, window.location.href)

      // Use window.location for immediate navigation instead of router.push
      // This ensures the navigation happens before any potential router.refresh interference
      console.log(`[LOGIN] Using window.location.href for navigation to: ${destination}`)
      window.location.href = destination

      // Add client-side logging for debugging
      console.log(`[LOGIN] Client-side: Login successful, redirecting to ${destination}`)
      console.log(`[LOGIN] Client-side: User ID: ${data.user.id}, Role: ${profile?.role}`)
    } catch (error: unknown) {
      const appError = handleError(error)
      setError(appError.message)
    } finally {
      setIsLoggingIn(false)
    }
  }, [formData, router, supabase, params])

  // Memoized validation error getter
  const getFieldError = useMemo(() => (fieldName: string) =>
    validationErrors.find(err => err.field === fieldName)?.message,
    [validationErrors]
  )

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const errorVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: -10 }
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
      <div className="absolute top-4 left-4 z-20">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl relative z-10 h-full"
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
                Selamat Datang Kembali
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="text-white/90"
              >
                Masuk untuk melanjutkan reservasi ruangan Anda
              </motion.p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-background/95 backdrop-blur-xl border-0 lg:border-l border-gray-200/20 dark:border-gray-700/20 flex flex-col min-h-[700px]">
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
              <div className="w-full">
              <div className="text-center pb-6 px-0">
                <h1 className="text-2xl font-bold text-blue-600 mb-2">
                  Masuk ke Akun Anda
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Sistem Reservasi Ruangan Perpustakaan
                </p>
              </div>

              <CardContent className="space-y-6 px-0">
                <motion.form
                  onSubmit={handleLogin}
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('email')}
                        onFocus={() => handleFieldFocus('email')}
                        className="pl-10 h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                        aria-describedby={getFieldError('email') ? 'email-error' : undefined}
                      />
                    </div>
                    <AnimatePresence>
                      {getFieldError('email') && (
                        <motion.p
                          id="email-error"
                          variants={errorVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                          role="alert"
                        >
                          <XCircle className="w-4 h-4" />
                          {getFieldError('email')}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('password')}
                        onFocus={() => handleFieldFocus('password')}
                        className="pl-10 pr-10 h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                        aria-describedby={getFieldError('password') ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {getFieldError('password') && (
                        <motion.p
                          id="password-error"
                          variants={errorVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                          role="alert"
                        >
                          <XCircle className="w-4 h-4" />
                          {getFieldError('password')}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex justify-end">
                    <ForgotPasswordModal>
                      <button
                        type="button"
                        className="text-sm text-primary hover:text-primary dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                      >
                        Lupa password?
                      </button>
                    </ForgotPasswordModal>
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        variants={errorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                        role="alert"
                        aria-live="polite"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-11 relative overflow-hidden"
                      disabled={isLoggingIn}
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                      {isLoggingIn ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          Masuk
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>


                <motion.p
                  variants={itemVariants}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  Belum punya akun?{' '}
                  <Link
                    href="/signup"
                    className="text-primary hover:text-primary dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Daftar di sini
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