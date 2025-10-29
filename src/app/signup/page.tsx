'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Eye, EyeOff, Mail, Lock, User, Building, Phone, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { validateRegistrationData, sanitizeRegistrationData } from '@/lib/validation'
import { handleError } from '@/lib/errors'
import { RegistrationData } from '@/lib/types'
import { useDebouncedValidation } from '@/hooks/useDebouncedValidation'
import Image from 'next/image'

export default function SignupPage() {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    institution: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{field: string, message: string}[]>([])
  const [touched, setTouched] = useState<{fullName: boolean, email: boolean, institution: boolean, phone: boolean, password: boolean, confirmPassword: boolean}>({
    fullName: false,
    email: false,
    institution: false,
    phone: false,
    password: false,
    confirmPassword: false,
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null)
  const router = useRouter()

  // Debounced validation for real-time feedback
  const { debouncedValidate } = useDebouncedValidation<RegistrationData>((data) => {
    // Real-time validation feedback without showing errors
    // This provides immediate visual feedback while preventing premature error display
  }, { delay: 300 })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    debouncedValidate({ ...formData, [name]: value })
  }, [formData, debouncedValidate])

  const handleFieldBlur = useCallback((field: keyof RegistrationData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    // Validate only this field on blur
    const errors = validateRegistrationData(formData)
    const fieldErrors = errors.filter(error => error.field === field)
    setValidationErrors(prev => {
      // Remove existing errors for this field and add new ones
      const filtered = prev.filter(error => error.field !== field)
      return [...filtered, ...fieldErrors]
    })

    // Check password match for confirmPassword field
    if (field === 'confirmPassword' || field === 'password') {
      if (formData.password && formData.confirmPassword) {
        setPasswordMatch(formData.password === formData.confirmPassword)
      } else {
        setPasswordMatch(null)
      }
    }
  }, [formData])

  const handleFieldFocus = useCallback((field: keyof RegistrationData) => {
    // Clear errors for this field when user starts typing
    setValidationErrors(prev => prev.filter(error => error.field !== field))
  }, [])

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationErrors([])
    setIsRegistering(true)

    try {
      console.log('🔄 Starting registration for:', formData.email)

      // 1. Validate form data
      const validationErrors = validateRegistrationData(formData)
      if (validationErrors.length > 0) {
        setValidationErrors(validationErrors)
        return
      }

      // 2. Sanitize input data (exclude confirmPassword for API)
      const sanitizedData = sanitizeRegistrationData(formData)
      const { confirmPassword, ...apiData } = sanitizedData

      // 3. Submit to API
      const response = await fetch('/api/register-fixed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Registration successful')
        router.push(`/confirm?email=${encodeURIComponent(formData.email)}`)
      } else {
        const error = handleError(new Error(result.details || 'Registration failed'))
        setError(error.message)
        // Error already handled above
      }
    } catch (error: unknown) {
      const appError = handleError(error)
      setError(appError.message)
      // Error already handled above
    } finally {
      setIsRegistering(false)
    }
  }, [formData, router])


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
                Selamat Datang
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="text-white/90"
              >
                Bergabunglah dengan komunitas kami untuk reservasi ruangan yang mudah dan cepat
              </motion.p>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="bg-background/95 backdrop-blur-xl border-0 lg:border-l border-gray-200/20 dark:border-gray-700/20 flex flex-col min-h-[700px]">
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
              <div className="w-full">
              <div className="text-center pb-6 px-0">
                <h1 className="text-2xl font-bold text-blue-600 mb-2">
                  Bergabung Sekarang
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Buat akun baru untuk melakukan reservasi ruangan
                </p>
              </div>

              <CardContent className="space-y-6 px-0">
                <motion.form
                  onSubmit={handleRegister}
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Nama Lengkap
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Masukkan nama lengkap"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('fullName')}
                        onFocus={() => handleFieldFocus('fullName')}
                        className="pl-10 h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                        aria-describedby={getFieldError('fullName') ? 'fullName-error' : undefined}
                      />
                    </div>
                    <AnimatePresence>
                      {getFieldError('fullName') && (
                        <motion.p
                          id="fullName-error"
                          variants={errorVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                          role="alert"
                        >
                          <XCircle className="w-4 h-4" />
                          {getFieldError('fullName')}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

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

                  <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="institution" className="text-sm font-medium">
                        Institusi
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="institution"
                          name="institution"
                          placeholder="Universitas..."
                          value={formData.institution}
                          onChange={handleChange}
                          onBlur={() => handleFieldBlur('institution')}
                          onFocus={() => handleFieldFocus('institution')}
                          className="pl-10 h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                          aria-describedby={getFieldError('institution') ? 'institution-error' : undefined}
                        />
                      </div>
                      <AnimatePresence>
                        {getFieldError('institution') && (
                          <motion.p
                            id="institution-error"
                            variants={errorVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                            role="alert"
                          >
                            <XCircle className="w-4 h-4" />
                            {getFieldError('institution')}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Nomor HP
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="+62..."
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={() => handleFieldBlur('phone')}
                          onFocus={() => handleFieldFocus('phone')}
                          className="pl-10 h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                          aria-describedby={getFieldError('phone') ? 'phone-error' : undefined}
                        />
                      </div>
                      <AnimatePresence>
                        {getFieldError('phone') && (
                          <motion.p
                            id="phone-error"
                            variants={errorVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                            role="alert"
                          >
                            <XCircle className="w-4 h-4" />
                            {getFieldError('phone')}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
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
                        placeholder="Minimal 6 karakter"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('password')}
                        onFocus={() => handleFieldFocus('password')}
                        className="pl-10 pr-10 h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                        required
                        minLength={6}
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

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Konfirmasi Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Konfirmasi password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => handleFieldBlur('confirmPassword')}
                        onFocus={() => handleFieldFocus('confirmPassword')}
                        className={`pl-10 pr-10 h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg ${
                          passwordMatch === true ? 'border-green-500 focus:border-green-500' :
                          passwordMatch === false ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        required
                        aria-describedby={getFieldError('confirmPassword') ? 'confirmPassword-error' : 'password-match-status'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {passwordMatch !== null && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                          {passwordMatch ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <AnimatePresence>
                        {getFieldError('confirmPassword') && (
                          <motion.p
                            id="confirmPassword-error"
                            variants={errorVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                            role="alert"
                          >
                            <XCircle className="w-4 h-4" />
                            {getFieldError('confirmPassword')}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      {passwordMatch === true && !getFieldError('confirmPassword') && (
                        <motion.p
                          id="password-match-status"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Password cocok
                        </motion.p>
                      )}
                    </div>
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
                      disabled={isRegistering}
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                      {isRegistering ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          Daftar Sekarang
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
                  Sudah punya akun?{' '}
                  <Link
                    href="/login"
                    className="text-primary hover:text-primary dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Masuk di sini
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