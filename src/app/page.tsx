  'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, Clock, CheckCircle, ArrowRight, Play, MapPin, Phone, Mail, Menu, X, Building, Award, Shield, Zap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useCalendarBookings, useRooms, type Room } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import InteractiveCalendar from '@/app/InteractiveCalendar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { supabase } from '@/lib/supabase'
import { Loading } from '@/components/ui/loading'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMotionValue, useSpring, useInView } from 'framer-motion'

// Custom AnimatedCounter component using Framer Motion
const AnimatedCounter = ({ from, to, duration = 2, separator = ',' }: { from: number; to: number; duration?: number; separator?: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(from)
  const springValue = useSpring(motionValue, { duration: duration * 1000 })
  const isInView = useInView(nodeRef, { once: true })

  useEffect(() => {
    if (isInView) {
      motionValue.set(to)
    }
  }, [motionValue, to, isInView])

  useEffect(() => {
    springValue.on('change', (latest) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = Math.floor(latest).toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      }
    })
  }, [springValue, separator])

  return <span ref={nodeRef}>{from}</span>
}

const HomePage = () => {
  const { user, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const router = useRouter()
  const { data: bookings = [] } = useCalendarBookings()
  const { data: rooms = [] } = useRooms()

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const floatingAnimation = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity
      }
    }
  }

  const testimonials = [
    {
      name: 'Ahmad Rahman',
      role: 'Mahasiswa',
      avatar: '/avatars/ahmad.jpg',
      content: 'Sistem reservasi ini sangat membantu saya dalam mengatur jadwal belajar. Interface yang user-friendly dan responsif.',
      rating: 5,
    },
    {
      name: 'Siti Nurhaliza',
      role: 'Dosen',
      avatar: '/avatars/siti.jpg',
      content: 'Sebagai dosen, saya sangat terbantu dengan fitur notifikasi real-time. Proses booking yang cepat dan mudah.',
      rating: 5,
    },
    {
      name: 'Budi Santoso',
      role: 'Staff Administrasi',
      avatar: '/avatars/budi.jpg',
      content: 'Dashboard analytics sangat berguna untuk monitoring penggunaan ruangan. Data yang akurat dan real-time.',
      rating: 5,
    },
  ]

  const newsletterSchema = z.object({
    email: z.string().email('Email tidak valid'),
  })

  const newsletterForm = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: '',
    },
  })

  const onNewsletterSubmit = (values: z.infer<typeof newsletterSchema>) => {
    console.log('Newsletter signup:', values)
    // Handle newsletter signup - could integrate with Supabase or email service
    newsletterForm.reset()
  }

  // Scroll-based animations
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const roomsRef = useRef(null)
  const contactRef = useRef(null)

  // Floating particles animation
  const particleVariants = {
    animate: (i: number) => ({
      y: [0, -20, 0],
      x: [0, Math.sin(i) * 10, 0],
      rotate: [0, 360],
      transition: {
        duration: 4 + i * 0.5,
        repeat: Infinity,
        delay: i * 0.2
      }
    })
  }

  // Set loading to false when auth is loaded
  useEffect(() => {
    if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading])

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'rooms', 'contact']
      const scrollPosition = window.scrollY + 100

      sections.forEach(section => {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const height = element.offsetHeight
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + height) {
            setActiveSection(section)
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Redirect authenticated users to appropriate dashboard
   useEffect(() => {
     const redirectUser = async () => {
       console.log(`Landing page: redirectUser called, user=${user ? user.id : 'null'}`)
       if (user) {
         try {
           // Check if user is admin
           const { data: profile } = await supabase
             .from('profiles')
             .select('role')
             .eq('id', user.id)
             .single()

           // Redirect based on role
           if (profile?.role === 'admin') {
             console.log('Landing page: redirecting to /admin')
             router.push('/admin')
           } else {
             console.log('Landing page: redirecting to /dashboard')
             router.push('/dashboard')
           }
         } catch (error) {
           console.error('Error checking user role:', error)
           // Default to user dashboard if role check fails
           console.log('Landing page: role check failed, redirecting to /dashboard')
           router.push('/dashboard')
         }
       } else {
         console.log('Landing page: no user, staying on landing page')
       }
     }

     redirectUser()
   }, [user, router])

  if (loading) {
    return <Loading variant="fullscreen" message="Memuat Perpustakaan Aceh" />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Perpustakaan Aceh
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { name: 'Beranda', id: 'home' },
                { name: 'Fitur', id: 'features' },
                { name: 'Ruangan', id: 'rooms' },
                { name: 'Kontak', id: 'contact' }
              ].map(item => (
                <motion.a
                  key={item.id}
                  href={`#${item.id}`}
                  whileHover={{ y: -2 }}
                  className={`relative font-medium transition-colors ${
                    activeSection === item.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {item.name}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600"
                    />
                  )}
                </motion.a>
              ))}
            </div>

            {/* Theme Toggle & Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/login')}
                className="px-6 py-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                Masuk
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/register')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium shadow-lg transition-all"
              >
                Daftar
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="px-4 py-4 space-y-4">
                {[
                  { name: 'Beranda', id: 'home' },
                  { name: 'Fitur', id: 'features' },
                  { name: 'Ruangan', id: 'rooms' },
                  { name: 'Kontak', id: 'contact' }
                ].map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium"
                  >
                    Daftar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900"
        >
          <div className="absolute inset-0 opacity-30">
            <motion.div
              variants={particleVariants}
              custom={0}
              animate="animate"
              className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={1}
              animate="animate"
              className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={2}
              animate="animate"
              className="absolute bottom-32 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={3}
              animate="animate"
              className="absolute top-1/4 right-1/4 w-48 h-48 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={4}
              animate="animate"
              className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={5}
              animate="animate"
              className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-400 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={6}
              animate="animate"
              className="absolute bottom-1/2 right-1/3 w-40 h-40 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl"
            />
          </div>
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="text-center lg:text-left"
            >
              <motion.h1
                variants={fadeInUp}
                className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight"
              >
                Reservasi
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Ruangan
                </span>
                Perpustakaan
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 dark:text-gray-300 mt-6 max-w-2xl"
              >
                Sistem reservasi ruangan modern untuk Perpustakaan Wilayah Aceh. 
                Pesan ruangan dengan mudah, cepat, dan efisien untuk kebutuhan belajar dan berkumpul Anda.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(37, 99, 235, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/register')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-full shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  Mulai Reservasi
                  <ArrowRight size={20} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDemoModalOpen(true)}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-full hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Lihat Demo
                </motion.button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-gray-600 dark:text-gray-300"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Gratis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>24/7 Tersedia</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Mudah Digunakan</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Interactive Calendar Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <motion.div
                className="relative z-10"
              >
                <InteractiveCalendar bookings={bookings} />
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-80"
              />
              <motion.div
                animate={{
                  y: [0, 15, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-60"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Statistik <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Penggunaan</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Data real-time penggunaan sistem reservasi ruangan kami
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Total Reservasi', value: 1250, suffix: '+' },
              { label: 'Ruangan Tersedia', value: 15, suffix: '' },
              { label: 'Pengguna Aktif', value: 500, suffix: '+' },
              { label: 'Tingkat Kepuasan', value: 98, suffix: '%' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { delay: index * 0.1, duration: 0.6, ease: "easeOut" }
                  }
                }}
                className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-8 text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  <AnimatedCounter
                    from={0}
                    to={stat.value}
                    duration={2}
                    separator=","
                  />
                  {stat.suffix}
                </div>
                <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-16 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Tetap <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Terhubung</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Dapatkan update terbaru tentang fitur baru, tips penggunaan, dan berita dari Perpustakaan Aceh
              </p>
            </div>

            <Form {...newsletterForm}>
              <form onSubmit={newsletterForm.handleSubmit(onNewsletterSubmit)} className="max-w-md mx-auto">
                <div className="flex gap-4">
                  <FormField
                    control={newsletterForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Masukkan email Anda"
                            {...field}
                            className="h-12 text-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    Berlangganan
                  </motion.button>
                </div>
              </form>
            </Form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Kami menghormati privasi Anda. Tidak ada spam, janji!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        id="features"
        className="py-20 bg-gray-50 dark:bg-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Fitur <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Unggulan</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nikmati pengalaman reservasi ruangan yang tak terlupakan dengan fitur-fitur canggih kami
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Kalender Interaktif',
                description: 'Lihat ketersediaan ruangan secara real-time dengan kalender yang mudah digunakan',
                color: 'from-blue-500 to-cyan-400'
              },
              {
                icon: Clock,
                title: 'Booking Instan',
                description: 'Reservasi ruangan hanya dalam hitungan detik dengan sistem otomatis yang cepat',
                color: 'from-purple-500 to-pink-400'
              },
              {
                icon: Shield,
                title: 'Keamanan Terjamin',
                description: 'Data Anda aman dengan enkripsi tingkat militer dan sistem authentication modern',
                color: 'from-green-500 to-emerald-400'
              },
              {
                icon: Zap,
                title: 'Notifikasi Real-time',
                description: 'Dapatkan pemberitahuan instan untuk setiap perubahan status reservasi Anda',
                color: 'from-yellow-500 to-orange-400'
              },
              {
                icon: Users,
                title: 'Multi-User Support',
                description: 'Kelola reservasi tim dengan fitur kolaborasi yang powerful dan intuitif',
                color: 'from-red-500 to-pink-400'
              },
              {
                icon: Award,
                title: 'Dashboard Analytics',
                description: 'Analisis penggunaan ruangan dengan dashboard yang comprehensive dan mudah dipahami',
                color: 'from-indigo-500 to-purple-400'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1, duration: 0.6, ease: "easeOut" }
                  }
                }}
                whileHover={{
                  y: -15,
                  scale: 1.05,
                  rotateY: 5,
                  boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl cursor-pointer group relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Apa Kata <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pengguna</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Pendapat pengguna tentang pengalaman mereka menggunakan sistem reservasi kami
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl"
              >
                <div className="flex items-center mb-6">
                  <Avatar className="w-16 h-16 mr-4">
                    <AvatarImage src={testimonials[currentTestimonial].avatar} alt={testimonials[currentTestimonial].name} />
                    <AvatarFallback>{testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{testimonials[currentTestimonial].name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{testimonials[currentTestimonial].role}</p>
                    <div className="flex mt-1">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 italic">"{testimonials[currentTestimonial].content}"</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center mt-8 space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <ChevronRight size={24} className="text-gray-600 dark:text-gray-300" />
              </motion.button>
            </div>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Demo Interaktif Sistem Reservasi
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Jelajahi fitur-fitur utama sistem reservasi ruangan Perpustakaan Aceh secara interaktif.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Fitur Utama:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Kalender interaktif real-time</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Booking instan</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Notifikasi otomatis</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Dashboard analytics</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Kalender Demo</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p>Klik pada tanggal di bawah untuk melihat demo reservasi:</p>
                      <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border">
                        <p className="text-xs">📅 Kalender akan muncul di sini</p>
                        <p className="text-xs mt-1">Ruangan tersedia: 15</p>
                        <p className="text-xs">Reservasi hari ini: 8</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Cara Menggunakan:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>Daftar akun atau masuk ke sistem</li>
                    <li>Pilih ruangan yang diinginkan</li>
                    <li>Tentukan tanggal dan waktu</li>
                    <li>Konfirmasi reservasi</li>
                    <li>Dapatkan notifikasi konfirmasi</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Rooms Section */}
      <section
        ref={roomsRef}
        id="rooms"
        className="py-20 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Pilihan <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ruangan</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Berbagai pilihan ruangan dengan fasilitas lengkap untuk kebutuhan Anda
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room: Room, index: number) => (
              <motion.div
                key={room.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1, duration: 0.6, ease: "easeOut" }
                  }
                }}
                whileHover={{
                  y: -10,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                whileDrag={{ scale: 1.05, rotateY: 10 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden group relative cursor-grab active:cursor-grabbing"
              >
                <div className={`h-48 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Building size={48} className="text-white/80" />
                  </motion.div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{room.name}</h3>
                  {room.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{room.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-4">
                    <Users size={16} />
                    <span>{room.capacity} orang</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {room.facilities.map((facility: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} className="text-green-500" />
                        <span className="text-gray-600 dark:text-gray-300">{facility}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} id="contact" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Hubungi <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Kami</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Ada pertanyaan? Tim kami siap membantu Anda 24/7
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: 'Alamat',
                info: 'Jl. Teuku Umar No. 4, Banda Aceh, Aceh 23116',
                color: 'from-blue-500 to-cyan-400'
              },
              {
                icon: Phone,
                title: 'Telepon',
                info: '+62 651 123456',
                color: 'from-green-500 to-emerald-400'
              },
              {
                icon: Mail,
                title: 'Email',
                info: 'info@perpustakaanaceh.go.id',
                color: 'from-purple-500 to-pink-400'
              }
            ].map((contact, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1, duration: 0.6, ease: "easeOut" }
                  }
                }}
                whileHover={{
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${contact.color} flex items-center justify-center mb-6 mx-auto`}>
                  <contact.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{contact.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{contact.info}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/register')}
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white relative overflow-hidden group"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <Sparkles size={24} className="relative z-10" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute inset-0 bg-white/20 rounded-full"
          />
        </motion.button>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Mulai Reservasi
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
            >
              Perpustakaan Wilayah Aceh
            </motion.div>
            <p className="text-gray-400 mb-8">
              Sistem Reservasi Ruangan Modern & Terpercaya
            </p>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500">
                © 2024 Perpustakaan Wilayah Aceh. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage