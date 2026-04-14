import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'flowroute | Stop Wasting Time in Traffic',
  description: 'flowroute analyzes traffic patterns and tells you exactly when to leave. Save up to 200+ hours per year by leaving at the optimal time.',
  keywords: ['traffic', 'commute', 'best departure time', 'avoid traffic', 'when to leave', 'traffic optimization'],
  authors: [{ name: 'flowroute' }],
  openGraph: {
    title: 'flowroute | Stop Wasting Time in Traffic',
    description: 'flowroute analyzes traffic patterns and tells you exactly when to leave. Save up to 200+ hours per year.',
    url: 'https://flowroute.app',
    siteName: 'flowroute',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'flowroute | Stop Wasting Time in Traffic',
    description: 'flowroute analyzes traffic patterns and tells you exactly when to leave.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
