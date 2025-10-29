  'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, Clock, CheckCircle, ArrowRight, Play, MapPin, Phone, Mail, Menu, X, Building, Award, Shield, Zap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useCalendarBookings, useRooms, type Room } from '@/lib/api'
import { useAuth } from '@/components/AuthProvider'
import Image from 'next/image'
import { ImageCarousel } from '@/components/ui/image-carousel'

import InteractiveCalendar from '@/app/InteractiveCalendar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { supabase } from '@/lib/supabase'
import { Loading } from '@/components/ui/loading'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'


const HomePage = () => {
  const { user, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
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




  // Scroll-based animations
  const heroRef = useRef(null)
  const roomsRef = useRef(null)
  const featuresRef = useRef(null)
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
      const sections = ['home', 'rooms', 'features', 'contact']
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <Image
                src="/logo.svg"
                alt="Perpustakaan Aceh Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Perpustakaan Aceh
              </div>
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { name: 'Beranda', id: 'home' },
                { name: 'Ruangan', id: 'rooms' },
                { name: 'Fitur', id: 'features' },
                { name: 'Kontak', id: 'contact' }
              ].map(item => (
                <motion.a
                  key={item.id}
                  href={`#${item.id}`}
                  whileHover={{ y: -2 }}
                  className={`relative font-medium transition-colors ${
                    activeSection === item.id
                      ? 'text-primary dark:text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
                  }`}
                >
                  {item.name}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
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
                className="px-6 py-2 text-primary font-medium hover:text-primary transition-colors"
              >
                Masuk
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/register')}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-medium shadow-lg transition-all"
              >
                Daftar
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} className="text-gray-600" /> : <Menu size={24} className="text-gray-600" />}
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
              className="md:hidden bg-background border-t border-gray-100 dark:border-gray-800"
            >
              <div className="px-4 py-4 space-y-4">
                {[
                  { name: 'Beranda', id: 'home' },
                  { name: 'Ruangan', id: 'rooms' },
                  { name: 'Fitur', id: 'features' },
                  { name: 'Kontak', id: 'contact' }
                ].map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-2 text-primary font-medium hover:text-primary transition-colors"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-medium"
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
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-gray-900 dark:via-primary/10 dark:to-secondary/10"
        >
          <div className="absolute inset-0 opacity-30">
            <motion.div
              variants={particleVariants}
              custom={0}
              animate="animate"
              className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={1}
              animate="animate"
              className="absolute top-40 right-10 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={2}
              animate="animate"
              className="absolute bottom-32 left-1/2 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={3}
              animate="animate"
              className="absolute top-1/4 right-1/4 w-48 h-48 bg-primary/15 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={4}
              animate="animate"
              className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-secondary/15 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={5}
              animate="animate"
              className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/15 rounded-full mix-blend-multiply filter blur-xl"
            />
            <motion.div
              variants={particleVariants}
              custom={6}
              animate="animate"
              className="absolute bottom-1/2 right-1/3 w-40 h-40 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl"
            />
          </div>
        </motion.div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
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
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
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
                  className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white text-lg font-semibold rounded-full shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  Mulai Reservasi
                  <ArrowRight size={20} className="text-white" />
                </motion.button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-gray-600 dark:text-gray-300"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span>Gratis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span>24/7 Tersedia</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600" />
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
                className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-2xl opacity-80"
              />
              <motion.div
                animate={{
                  y: [0, 15, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-full opacity-60"
              />
            </motion.div>
          </div>
        </div>
      </section>


      {/* Rooms Section */}
      <section
        ref={roomsRef}
        id="rooms"
        className="py-20 bg-background"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Pilihan <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Ruangan</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Berbagai pilihan ruangan dengan fasilitas lengkap untuk kebutuhan Anda
            </p>
          </motion.div>

          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.filter((room: Room) => room.name !== 'Library Tour').map((room: Room, index: number) => (
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
                className="bg-card rounded-3xl shadow-xl overflow-hidden group relative cursor-grab active:cursor-grabbing"
              >
                {/* Header with Image or Icon */}
                {room.photos && room.photos.length > 1 ? (
                  <div className="h-48 bg-muted relative overflow-hidden">
                    <ImageCarousel photos={room.photos} alt={room.name} />
                  </div>
                ) : (
                  <div className="h-48 bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300 rounded-md" />
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center rounded-md overflow-hidden"
                    >
                      {room.photos && room.photos.length === 1 ? (
                        <Image
                          src={room.photos[0]}
                          alt={room.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <Building className="w-16 h-16 text-white/80" />
                      )}
                    </motion.div>
                    {/* Floating elements */}
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{room.name}</h3>
                  {room.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{room.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-4">
                    <Users size={16} className="text-gray-600" />
                    <span>{room.capacity} orang</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {room.facilities.map((facility: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-gray-600 dark:text-gray-300">{facility}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </motion.div>
            ))}
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section
        ref={featuresRef}
        id="features"
        className="py-20 bg-gray-50 dark:bg-gray-800"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Fitur <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Unggulan</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nikmati pengalaman reservasi ruangan yang tak terlupakan dengan fitur-fitur canggih kami
            </p>
          </motion.div>

          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: 'Kalender Interaktif',
                  description: 'Lihat ketersediaan ruangan secara real-time dengan kalender yang mudah digunakan',
                  color: 'from-primary to-secondary'
                },
              {
                icon: Clock,
                title: 'Booking Instan',
                description: 'Reservasi ruangan hanya dalam hitungan detik dengan sistem otomatis yang cepat',
                color: 'from-secondary to-accent'
              },
              {
                icon: Shield,
                title: 'Keamanan Terjamin',
                description: 'Data Anda aman dengan enkripsi tingkat militer dan sistem authentication modern',
                color: 'from-primary to-accent'
              },
              {
                icon: Zap,
                title: 'Notifikasi Real-time',
                description: 'Dapatkan pemberitahuan instan untuk setiap perubahan status reservasi Anda',
                color: 'from-accent to-primary'
              },
              {
                icon: Users,
                title: 'Multi-User Support',
                description: 'Kelola reservasi tim dengan fitur kolaborasi yang powerful dan intuitif',
                color: 'from-secondary to-primary'
              },
              {
                icon: Award,
                title: 'Dashboard Analytics',
                description: 'Analisis penggunaan ruangan dengan dashboard yang comprehensive dan mudah dipahami',
                color: 'from-primary to-secondary'
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
                className="bg-card rounded-3xl p-8 shadow-xl cursor-pointer group relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
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
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} id="contact" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Hubungi <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Kami</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Ada pertanyaan? Tim kami siap membantu Anda 24/7
            </p>
          </motion.div>

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  icon: MapPin,
                  title: 'Alamat',
                  info: 'Jl. Teuku Umar No. 4, Banda Aceh, Aceh 23116',
                  color: 'from-primary to-secondary'
                },
              {
                icon: Phone,
                title: 'Telepon',
                info: '+62 651 123456',
                color: 'from-secondary to-accent'
              },
              {
                icon: Mail,
                title: 'Email',
                info: 'info@perpustakaanaceh.go.id',
                color: 'from-accent to-primary'
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
                className="bg-card rounded-3xl p-8 shadow-xl text-center"
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
          className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full shadow-2xl flex items-center justify-center text-white relative overflow-hidden group"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-accent to-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <Sparkles size={24} className="relative z-10 text-white" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute inset-0 bg-background/20 rounded-full"
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
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4"
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