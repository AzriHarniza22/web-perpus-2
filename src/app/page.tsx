'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, Clock, CheckCircle, ArrowRight, Play, MapPin, Phone, Mail, Menu, X, Building, Award, Shield, Zap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useCalendarBookings, useRooms, type Room } from '@/lib/api'

// Interactive Calendar Component
const InteractiveCalendar = ({ bookings = [] }: { bookings?: Array<{ start_time: string; end_time: string; rooms?: { name: string }; status: string }> }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedDates, setBookedDates] = useState<string[]>([])

  useEffect(() => {
    const dates = bookings.map(booking =>
      new Date(booking.start_time).toDateString()
    )
    setBookedDates([...new Set(dates)])
  }, [bookings])

  const getBookedTimes = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      return bookingDate.toDateString() === date.toDateString()
    }).map(booking => ({
      start: new Date(booking.start_time),
      end: new Date(booking.end_time),
      room: booking.rooms?.name,
      status: booking.status
    }))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isBooked = (date: Date) => {
    return bookedDates.includes(date.toDateString())
  }

  const isSameMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevMonth}
          className="p-2 rounded-full bg-white/30 hover:bg-white/40 transition-all"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </motion.button>
        
        <h3 className="text-xl font-bold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="p-2 rounded-full bg-white/30 hover:bg-white/40 transition-all"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </motion.button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day)
          const isTodayDate = isToday(day)
          const isBookedDate = isBooked(day)
          const isSelected = selectedDate.toDateString() === day.toDateString()

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(day)}
              className={`
                relative p-2 text-sm rounded-lg transition-all duration-200
                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                ${isTodayDate ? 'bg-blue-500 text-white font-bold' : ''}
                ${isSelected && !isTodayDate ? 'bg-purple-500 text-white' : ''}
                ${isBookedDate && !isTodayDate && !isSelected ? 'bg-red-100 text-red-600' : ''}
                ${!isTodayDate && !isSelected && !isBookedDate && isCurrentMonth ? 'hover:bg-white/40' : ''}
              `}
            >
              {day.getDate()}
              {isBookedDate && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full"></div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Selected Date Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={selectedDate.toDateString()}
        className="bg-white/30 rounded-2xl p-4"
      >
        <h4 className="font-bold text-gray-800 mb-3">
          📅 {formatDate(selectedDate)}
        </h4>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {getBookedTimes(selectedDate).length > 0 ? (
            getBookedTimes(selectedDate).map((booking, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-2 rounded-lg text-sm ${
                  booking.status === 'approved' 
                    ? 'bg-green-100 text-green-800 border-l-4 border-green-400' 
                    : 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400'
                }`}
              >
                <div className="font-medium">{booking.room}</div>
                <div className="text-xs">
                  🕐 {formatTime(booking.start)} - {formatTime(booking.end)}
                </div>
                <div className="text-xs capitalize">
                  📋 {booking.status === 'approved' ? 'Disetujui' : 'Menunggu'}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4 text-gray-600"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="text-sm">Tidak ada booking untuk tanggal ini</div>
              <div className="text-xs text-gray-500 mt-1">Hari yang sempurna untuk reservasi!</div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600">Hari ini</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-400 rounded-full"></div>
          <span className="text-gray-600">Ada booking</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-600">Dipilih</span>
        </div>
      </div>
    </div>
  )
}

const HomePage = () => {
  const [user, setUser] = useState(null)
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

  const floatingAnimation = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity
      }
    }
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

  // Simulate auth check
  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20"
          />
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-800 mb-2"
          >
            Memuat Perpustakaan Aceh
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-600"
          >
            Menyiapkan pengalaman terbaik untuk Anda...
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center gap-2 mt-6"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-3 h-3 bg-blue-500 rounded-full"
              />
            ))}
          </motion.div>
        </div>
      </div>
    )
  }

  if (user) {
    // Authenticated user dashboard would go here
    return <div>Dashboard content...</div>
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100"
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
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
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

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
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
              className="md:hidden bg-white border-t border-gray-100"
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
                    className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
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
          className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
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
                className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight"
              >
                Reservasi
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Ruangan
                </span>
                Perpustakaan
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 mt-6 max-w-2xl"
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
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-full hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Lihat Demo
                </motion.button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-gray-600"
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
                variants={floatingAnimation}
                animate="animate"
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

      {/* Features Section */}
      <section
        ref={featuresRef}
        id="features"
        className="py-20 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Fitur <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Unggulan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -15,
                  scale: 1.05,
                  rotateY: 5,
                  boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
                }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section
        ref={roomsRef}
        id="rooms"
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Pilihan <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ruangan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai pilihan ruangan dengan fasilitas lengkap untuk kebutuhan Anda
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room: Room, index: number) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, rotateY: 5 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                whileDrag={{ scale: 1.05, rotateY: 10 }}
                className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all overflow-hidden group relative cursor-grab active:cursor-grabbing"
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                  {room.description && (
                    <p className="text-gray-600 text-sm mb-4">{room.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <Users size={16} />
                    <span>{room.capacity} orang</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {room.facilities.map((facility: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/book/${room.id}`)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-all"
                  >
                    Pesan Ruangan Ini
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Hubungi <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Kami</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all text-center"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${contact.color} flex items-center justify-center mb-6 mx-auto`}>
                  <contact.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{contact.title}</h3>
                <p className="text-gray-600">{contact.info}</p>
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