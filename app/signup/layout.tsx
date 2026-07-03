import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Your Profile',
  description: 'Join Arrange Marriage — India\'s privacy-first matrimony platform. Create your free profile and meet verified, educated Indian singles across all communities.',
  alternates: { canonical: 'https://www.arrangemarriage.co.in/signup' },
  openGraph: {
    title: 'Create Your Profile | Arrange Marriage',
    description: 'Join free and meet verified Indian singles. Hindu, Muslim, Sikh, Christian and all communities welcome.',
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
