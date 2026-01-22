import { getUser } from '@/lib/auth/server'
import { AuthProvider } from '@/components/AuthProvider'
import { QueryProvider } from '@/lib/QueryProvider'
import { ToastProvider } from '@/components/ToastProvider'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservasi Ruangan Perpustakaan',
  description: 'Sistem reservasi ruangan perpustakaan',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get initial user state from server - but don't block on it
  // This allows the page to load even if auth check fails due to SSR limitations
  let user = null
  try {
    user = await getUser()
    console.log(`[LAYOUT] Initial user loaded: ${user ? user.id : 'null'}`)
  } catch (error) {
    console.log('[LAYOUT] Initial user load failed (expected in SSR), will rely on client-side auth')
  }

  return (
    <html lang="id">
      <body>
        <QueryProvider>
          <ToastProvider>
            <AuthProvider initialUser={user}>
              {children}
            </AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
