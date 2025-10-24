'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Mail, ArrowRight, ArrowLeft, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'
import { isValidEmail } from '@/lib/validation'
import { handleError } from '@/lib/errors'
import Image from 'next/image'

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<{field: string, message: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData({ email: value })

    // Clear validation errors when user starts typing
    if (validationErrors.some(err => err.field === 'email')) {
      setValidationErrors([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors([])
    setIsSubmitting(true)

    try {
      console.log('🔐 Password reset attempt', { email: formData.email })

      // Basic validation
      if (!formData.email || !formData.email.trim()) {
        setValidationErrors([{ field: 'email', message: 'Email is required' }])
        return
      }

      if (!isValidEmail(formData.email)) {
        setValidationErrors([{ field: 'email', message: 'Please enter a valid email address' }])
        return
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      console.log('✅ Password reset email sent', { email: formData.email })
      setSuccess('Email reset password telah dikirim. Silakan periksa kotak masuk Anda.')

      // Auto redirect to login after 5 seconds
      setTimeout(() => {
        router.push('/login')
      }, 5000)

    } catch (error: unknown) {
      const appError = handleError(error)
      const errorMessage = appError.message
      setError(errorMessage)
      console.error('❌ Password reset failed', { error: errorMessage, email: formData.email })
    } finally {
      setIsSubmitting(false)
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
        className="w-full max-w-6xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Background Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/gedungperpusaceh.jpg"
                alt="Gedung Perpustakaan Aceh"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20" />
              <div className="absolute bottom-6 left-6 right-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="text-white"
                >
                  <h2 className="text-2xl font-bold mb-2">Lupa Password?</h2>
                  <p className="text-white/90">
                    Jangan khawatir, kami akan membantu Anda mengatur ulang password dengan aman.
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="backdrop-blur-lg bg-background/90 border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="text-white"
                  />
                </motion.div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Reset Password
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Masukkan email Anda untuk menerima link reset password
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
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
                        onChange={handleChange}
                        className="pl-10 h-11"
                        required
                        aria-describedby={validationErrors.some(err => err.field === 'email') ? "email-error" : undefined}
                        disabled={isSubmitting}
                      />
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
                        id="reset-error"
                        role="alert"
                        aria-live="polite"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                        role="alert"
                        aria-live="polite"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white font-medium"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          Kirim Link Reset
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center"
                >
                  <Link
                    href="/login"
                    className="text-primary hover:text-primary dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Kembali ke Login
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}