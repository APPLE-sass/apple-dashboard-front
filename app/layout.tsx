import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/lib/query-provider'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider, ThemeScript } from '@/components/theme-manager'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Stock Apple',
  description: 'Manejo de Stock de Productos Apple',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

const PROJECT_KEY = process.env.NEXT_PUBLIC_THEME_KEY ?? 'apple-dashboard'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        /* este script lo puse para descachear versiones pero era un problema de la version del monitor* /
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for (let registration of registrations) {
                  registration.unregister();
                }
              });
            }
          `
        }} />
        /* tematica para ver los diferentes estilos de la pantalla* /
        <ThemeScript projectKey={PROJECT_KEY} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>

        <QueryProvider>
          <AuthProvider>
            <ThemeProvider projectKey={PROJECT_KEY}>
              {children}
              <Toaster
                theme="dark"
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  },
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
