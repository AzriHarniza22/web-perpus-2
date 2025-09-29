'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

function ConfirmPageContent() {
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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-pink-400/5"
        />
      </div>

      {/* Back Button & Theme Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
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
        <Card className="backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Konfirmasi Email
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {registeredEmail ? (
                `Kami telah mengirim email konfirmasi ke ${registeredEmail}. Silakan periksa inbox Anda.`
              ) : (
                'Silakan konfirmasi email Anda untuk melanjutkan proses registrasi.'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.form
              onSubmit={handleResend}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {!registeredEmail && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              )}

              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
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
                      <Mail className="w-4 h-4 mr-2" />
                      Kirim Ulang Email Konfirmasi
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Kembali ke Login
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-sm text-gray-600 dark:text-gray-400"
            >
              Sudah konfirmasi email?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Masuk di sini
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<Loading variant="inline" />}>
      <ConfirmPageContent />
    </Suspense>
  )
}