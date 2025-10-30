'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Loading } from '@/components/ui/loading'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToastContext } from '@/components/ToastProvider'
import { User as UserIcon, Mail, Building, Phone, Edit, Save, X, CheckCircle, AlertCircle, Camera, Lock, Key, Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface AdminProfile {
  id: string
  email: string
  full_name: string | null
  institution: string | null
  phone: string | null
  profile_photo: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function AdminProfilePage() {
  const { user, isLoading } = useAuth()
  const { success } = useToastContext()
  const [saving, setSaving] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    institution: '',
    phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      // Check if user is admin
      const checkAdminRole = async () => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileData?.role !== 'admin') {
          router.push('/dashboard')
          return
        }
      }

      checkAdminRole()

      // Fetch profile data
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
          setFormData({
            full_name: data.full_name || '',
            institution: data.institution || '',
            phone: data.phone || ''
          })
          setProfilePhotoPreview(data.profile_photo)
        }
      }
      fetchProfile()
    }
  }, [user, isLoading, router])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)

    try {
      let profilePhotoUrl = profile?.profile_photo || null

      // Upload new profile photo if selected
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop()
        const fileName = `${user.id}_${Date.now()}.${fileExt}`
        const filePath = `profile-photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profilePhoto)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        profilePhotoUrl = publicUrl
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          institution: formData.institution,
          phone: formData.phone,
          profile_photo: profilePhotoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Refresh profile data from database
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      setProfilePhotoPreview(profilePhotoUrl)
      setProfilePhoto(null)

      success('Profil Admin Berhasil Diperbarui', 'Informasi profil admin telah disimpan dengan aman.')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      // Error will be shown via toast from the UI components
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        institution: profile.institution || '',
        phone: profile.phone || ''
      })
    }
    setProfilePhoto(null)
    setProfilePhotoPreview(profile?.profile_photo || null)
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    if (!user) return

    setPasswordMessage(null)

    // Basic validation
    if (!passwordData.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Password saat ini diperlukan' })
      return
    }
    if (!passwordData.newPassword) {
      setPasswordMessage({ type: 'error', text: 'Password baru diperlukan' })
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password baru minimal 6 karakter' })
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' })
      return
    }

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Close modal and show success toast
        const modalTrigger = document.getElementById('admin-change-password-trigger') as HTMLButtonElement
        if (modalTrigger) {
          modalTrigger.click() // This will close the dialog
        }

        success('Password Berhasil Diubah', 'Password akun admin telah diperbarui dengan aman.')

        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setPasswordMessage({ type: 'error', text: result.error || 'Gagal mengubah password' })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordMessage({ type: 'error', text: 'Terjadi kesalahan saat mengubah password' })
    }
  }

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordMessage(null)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (isLoading) {
    return (
      <Loading variant="skeleton">
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Card className="max-w-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </Loading>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Sidebar */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title="Kelola Profil Admin"
        description="Update informasi profil dan preferensi admin"
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`px-6 pb-8 pt-24 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <Card className="bg-card backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-primary" />
                      Informasi Profil Admin
                    </CardTitle>
                    <CardDescription>
                      Kelola informasi pribadi admin
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            id="admin-change-password-trigger"
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Ubah Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <Lock className="w-5 h-5 mr-2 text-primary" />
                              Ubah Password Admin
                            </DialogTitle>
                            <DialogDescription>
                              Ubah password akun admin untuk keamanan yang lebih baik
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Password Change Message */}
                            {passwordMessage && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex items-center gap-2 p-3 rounded-lg ${
                                  passwordMessage.type === 'success'
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                }`}
                              >
                                {passwordMessage.type === 'success' ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <p className={`text-sm ${
                                  passwordMessage.type === 'success'
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-red-700 dark:text-red-300'
                                }`}>
                                  {passwordMessage.text}
                                </p>
                              </motion.div>
                            )}

                            {/* Password Change Form */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              {/* Current Password */}
                              <div className="space-y-2">
                                <Label htmlFor="admin_current_password" className="text-sm font-medium flex items-center">
                                  <Lock className="w-4 h-4 mr-2 text-gray-400" />
                                  Password Saat Ini
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="admin_current_password"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    placeholder="Masukkan password saat ini"
                                    className="pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showCurrentPassword ? "Sembunyikan password" : "Tampilkan password"}
                                  >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* New Password */}
                              <div className="space-y-2">
                                <Label htmlFor="admin_new_password" className="text-sm font-medium flex items-center">
                                  <Key className="w-4 h-4 mr-2 text-gray-400" />
                                  Password Baru
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="admin_new_password"
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    placeholder="Masukkan password baru (minimal 6 karakter)"
                                    className="pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showNewPassword ? "Sembunyikan password" : "Tampilkan password"}
                                  >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* Confirm New Password */}
                              <div className="space-y-2">
                                <Label htmlFor="admin_confirm_password" className="text-sm font-medium flex items-center">
                                  <Key className="w-4 h-4 mr-2 text-gray-400" />
                                  Konfirmasi Password Baru
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="admin_confirm_password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    placeholder="Konfirmasi password baru"
                                    className="pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                                  >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* Password Change Action Buttons */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 pt-4"
                              >
                                <Button
                                  onClick={handlePasswordChange}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Ubah Password
                                </Button>
                                <Button
                                  onClick={handleCancelPasswordChange}
                                  variant="destructive"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Batal
                                </Button>
                              </motion.div>
                            </motion.div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profilePhotoPreview || undefined} alt="Admin Profile" />
                    <AvatarFallback className="text-2xl">
                      {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="admin-profile-photo"
                      />
                      <Label
                        htmlFor="admin-profile-photo"
                        className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary dark:text-primary-300">Ubah Foto Profil</span>
                      </Label>
                    </div>
                  )}
                </div>


                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="admin_email" className="text-sm font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    Email
                  </Label>
                  <Input
                    id="admin_email"
                    value={user.email || ''}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                </div>

                {/* Role (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="admin_role" className="text-sm font-medium flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-gray-400" />
                    Role
                  </Label>
                  <Input
                    id="admin_role"
                    value="Administrator"
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500">Role admin tidak dapat diubah</p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="admin_full_name" className="text-sm font-medium flex items-center">
                    <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                    Nama Lengkap
                  </Label>
                  <Input
                    id="admin_full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                {/* Institution */}
                <div className="space-y-2">
                  <Label htmlFor="admin_institution" className="text-sm font-medium flex items-center">
                    <Building className="w-4 h-4 mr-2 text-gray-400" />
                    Institusi
                  </Label>
                  <Input
                    id="admin_institution"
                    value={formData.institution}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Masukkan nama institusi"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="admin_phone" className="text-sm font-medium flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="admin_phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Masukkan nomor telepon"
                  />
                </div>

                {/* Account Info */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Informasi Akun Admin</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Bergabung sejak</p>
                      <p className="text-gray-900 dark:text-white">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Terakhir update</p>
                      <p className="text-gray-900 dark:text-white">
                        {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('id-ID') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 pt-4"
                  >
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Simpan
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="destructive"
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Batal
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>

          </motion.div>
        </div>
      </main>
    </div>
  )
}