import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Arrange Marriage account and continue your journey to finding your life partner.',
  alternates: { canonical: 'https://www.arrangemarriage.co.in/login' },
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
