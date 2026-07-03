import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plans & Pricing',
  description: 'Choose the right plan on Arrange Marriage. Start free, upgrade to connect with verified Indian singles through secure video meetings and photo reveals.',
  alternates: { canonical: 'https://www.arrangemarriage.co.in/pricing' },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
