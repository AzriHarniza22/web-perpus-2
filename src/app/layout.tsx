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
  // Get initial user state from server
  const user = await getUser()

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
