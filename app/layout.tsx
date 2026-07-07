import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.arrangemarriage.co.in'),
  title: {
    default: 'Arrange Marriage | Indian Matrimony – Find Your Life Partner',
    template: '%s | Arrange Marriage',
  },
  description: 'India\'s privacy-first matrimony platform. Meet verified, educated Indian singles across all communities — Hindu, Muslim, Sikh, Christian and more. Join free.',
  keywords: ['arrange marriage', 'Indian matrimony', 'arranged marriage India', 'matrimonial site India', 'Hindu matrimony', 'Muslim matrimony', 'NRI matrimony', 'Indian matchmaking'],
  authors: [{ name: 'Arrange Marriage' }],
  openGraph: {
    type: 'website',
    siteName: 'Arrange Marriage',
    locale: 'en_IN',
    url: 'https://www.arrangemarriage.co.in',
    title: 'Arrange Marriage | Indian Matrimony – Find Your Life Partner',
    description: 'India\'s privacy-first matrimony platform. Verified profiles, secure video meetings, all communities welcome. Join free.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Indian Matrimony – Arrange Marriage' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arrange Marriage | Indian Matrimony',
    description: 'India\'s privacy-first matrimony platform. Verified profiles, all communities welcome.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.arrangemarriage.co.in' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${inter.className} antialiased bg-slate-950 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}