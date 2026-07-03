import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Arrange Marriage team. We\'re here to help with your matrimony journey — reach out via our contact form or social media.',
  alternates: { canonical: 'https://www.arrangemarriage.co.in/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
