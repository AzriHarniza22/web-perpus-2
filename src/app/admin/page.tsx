import { requireAdmin } from '@/lib/auth/server'
import AdminDashboard from '../../components/admin/AdminDashboard'

export default async function AdminPage() {
  console.log('[ADMIN PAGE] Loading admin page, calling requireAdmin()')
  console.log('[ADMIN PAGE] Current URL:', typeof window !== 'undefined' ? window.location.href : 'server-side')
  console.log('[ADMIN PAGE] Request headers:', typeof window === 'undefined' ? 'server-side' : 'client-side')
  const profile = await requireAdmin()
  console.log('[ADMIN PAGE] Admin access granted, rendering dashboard')
  console.log('[ADMIN PAGE] Profile details:', {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    full_name: profile.full_name
  })

  return <AdminDashboard profile={profile} />
}