'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { isValidEmail } from '@/lib/validation'
import { handleError } from '@/lib/errors'
import { useToastContext } from '@/components/ToastProvider'
import { useHoverAnimation } from '@/hooks/useAnimations'

interface ForgotPasswordFormData {
  email: string
}

interface ForgotPasswordModalProps {
  children: React.ReactNode
}

export function ForgotPasswordModal({ children }: ForgotPasswordModalProps) {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<{field: string, message: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { success: showToast } = useToastContext()
  const hoverAnimation = useHoverAnimation()

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
    e.stopPropagation() // Prevent any parent form submission
    setError('')
    setSuccess('')
    setValidationErrors([])
    setIsSubmitting(true)

    try {

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
        redirectTo: `${window.location.origin}/reset-password?type=recovery`,
      })

      if (error) throw error

      console.log('✅ Password reset email sent')

      // Close modal and show toast
      setIsOpen(false)
      showToast('Email Reset Password Terkirim', 'Silakan periksa kotak masuk Anda untuk link reset password.')

      // Clear form
      setFormData({ email: '' })

    } catch (error: unknown) {
      const appError = handleError(error)
      const errorMessage = appError.message
      setError(errorMessage)
      console.error('❌ Password reset failed', { error: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Masukkan email Anda untuk menerima link reset password
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <motion.form
            onSubmit={handleSubmit}
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
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11"
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
            </AnimatePresence>

            <motion.div
              {...hoverAnimation}
            >
              <Button
                type="submit"
                className="w-full h-11"
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
                  'Kirim Link Reset'
                )}
              </Button>
            </motion.div>
          </motion.form>
        </div>
      </DialogContent>
    </Dialog>
  )
}