"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, AlertTriangle, Clock, Shield, RefreshCw } from "lucide-react"
import React, { useState, useEffect } from "react"

export default function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const [params, setParams] = useState<{ email?: string } | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Load search params on client side
  React.useEffect(() => {
    searchParams.then(setParams);
  }, [searchParams]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!params?.email || countdown > 0) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await fetch('/api/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: params.email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendMessage('Email konfirmasi telah dikirim ulang. Silakan periksa kotak masuk Anda.');
        setCountdown(60); // Start countdown after successful resend
      } else {
        setResendMessage('Gagal mengirim ulang email. Silakan coba lagi nanti.');
      }
    } catch (error) {
      setResendMessage('Terjadi kesalahan. Silakan coba lagi nanti.');
    } finally {
      setIsResending(false);
    }
  };

  if (!params) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        {/* Main Confirmation Card */}
        <Card className="backdrop-blur-sm bg-card/95 border-0 shadow-xl">
          <div className="text-center pb-1">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              Cek Email Anda
            </div>
            <hr className="mt-3 border-border/50" />
          </div>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4 -mt-4">
              <p className="text-muted-foreground text-lg">
                Kami telah mengirimkan email konfirmasi ke:
              </p>
              {params.email && (
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <p className="text-lg font-semibold text-foreground font-mono">
                    {params.email}
                  </p>
                </div>
              )}
              <div className="space-y-3 text-muted-foreground">
                <p className="text-base leading-relaxed">
                  Silakan klik link konfirmasi di email tersebut untuk mengaktifkan akun Anda.
                </p>
                <p className="text-sm">
                  Tidak menerima email? Cek folder spam/junk Anda atau tunggu beberapa menit.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isResending || countdown > 0}
                variant="outline"
                className="w-full h-12 text-base font-medium border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all duration-200 disabled:opacity-50"
                aria-label="Kirim ulang email konfirmasi"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Mengirim ulang...' : countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Kirim Ulang Email Konfirmasi'}
              </Button>

              {resendMessage && (
                <div className={`text-sm text-center p-3 rounded-lg ${
                  resendMessage.includes('berhasil') ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {resendMessage}
                </div>
              )}

              <Button asChild className="w-full h-12 text-base font-medium">
                <a href="/login">
                  Kembali ke Login
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}
