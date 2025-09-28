import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from '@/lib/QueryProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ToastProvider';
import AuthInitializer from '@/components/AuthInitializer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Perpustakaan Aceh - Sistem Reservasi Ruangan Modern",
  description: "Sistem reservasi ruangan perpustakaan terdepan di Aceh. Pesan ruangan dengan mudah, cepat, dan efisien untuk kebutuhan belajar dan berkumpul Anda.",
  keywords: "perpustakaan aceh, reservasi ruangan, booking ruangan, perpustakaan wilayah aceh",
  authors: [{ name: "Perpustakaan Wilayah Aceh" }],
  creator: "Perpustakaan Wilayah Aceh",
  publisher: "Perpustakaan Wilayah Aceh",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://perpustakaanaceh.go.id'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Perpustakaan Aceh - Reservasi Ruangan Modern",
    description: "Sistem reservasi ruangan perpustakaan terdepan di Aceh dengan teknologi terkini.",
    url: "https://perpustakaanaceh.go.id",
    siteName: "Perpustakaan Aceh",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Perpustakaan Aceh - Reservasi Ruangan Modern",
    description: "Sistem reservasi ruangan perpustakaan terdepan di Aceh dengan teknologi terkini.",
    creator: "@perpustakaanaceh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <QueryProvider>
              <AuthInitializer />
              {children}
            </QueryProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
