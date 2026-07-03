import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Terms of Service for Arrange Marriage — India\'s privacy-first matrimony platform.',
  alternates: { canonical: 'https://www.arrangemarriage.co.in/terms' },
}

const c = {
  bg: '#07111f', navy: '#0d1f3c', gold: '#c9a84c',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', sepia: '#5a6e82',
  border: 'rgba(201,168,76,0.15)',
}

const h2 = { fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.35rem', fontWeight: 600, color: c.ivory, margin: '2rem 0 0.75rem' } as const
const p  = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.8, margin: '0 0 0.9rem' } as const
const li = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.8, marginBottom: '0.4rem' } as const

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />
      <Navigation />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '6rem 1.5rem 5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.5rem' }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.4rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>Terms of Service</h1>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', color: c.sepia, margin: 0 }}>Last updated: May 2026</p>
          <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginTop: '1.25rem' }} />
        </div>

        <p style={p}>
          Welcome to Arrange Marriage. These Terms of Service govern your use of our website and services. By creating an account or using Arrange Marriage, you agree to be bound by these terms. Please read them carefully.
        </p>

        <h2 style={h2}>1. Eligibility</h2>
        <p style={p}>
          You must be at least 18 years old to use Arrange Marriage. By registering, you confirm that you are 18 or older and that all information you provide is accurate, current, and complete. Arrange Marriage is a matrimony platform intended for individuals seeking a long-term committed relationship or marriage.
        </p>

        <h2 style={h2}>2. Your Account</h2>
        <p style={p}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to:
        </p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Provide truthful and accurate profile information',
            'Upload only photos of yourself',
            'Not impersonate any other person',
            'Notify us immediately of any unauthorised use of your account',
            'Not share your account with any other person',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>

        <h2 style={h2}>3. Subscription & Payments</h2>
        <p style={p}>
          Arrange Marriage offers a Free plan and paid subscription plans (Starter and Premium). Paid subscriptions are billed monthly. By subscribing to a paid plan, you authorise Arrange Marriage to charge your payment method on a recurring monthly basis until you cancel.
        </p>
        <p style={p}>
          All payments are processed securely through Razorpay. Arrange Marriage does not store your card details. Prices are displayed in INR.
        </p>

        <h2 style={h2}>4. Cancellation Policy</h2>
        <p style={p}>
          You may cancel your subscription at any time through the Billing section in your account settings. Upon cancellation, you will retain access to paid features until the end of your current billing period. No refunds are provided for partial months. Your account will revert to the Free plan at the end of the billing period.
        </p>

        <h2 style={h2}>5. User Content</h2>
        <p style={p}>
          You retain ownership of the photos, voice recordings, and other content you upload to Arrange Marriage. By uploading content, you grant Arrange Marriage a limited licence to display that content to other members as part of the service. You must not upload content that is offensive, illegal, or that you do not have the right to share.
        </p>

        <h2 style={h2}>6. Privacy</h2>
        <p style={p}>
          Your privacy is important to us. Your face photo is never shown to other members unless you explicitly choose to reveal it. Voice recordings and back-side photos are visible to other members as part of the discovery experience. Please review our <Link href="/privacy" style={{ color: c.gold, textDecoration: 'underline' }}>Privacy Policy</Link> for full details on how we collect and use your data.
        </p>

        <h2 style={h2}>7. Prohibited Conduct</h2>
        <p style={p}>You agree not to:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Harass, abuse, or harm other members',
            'Send unsolicited messages or spam',
            'Create fake or misleading profiles',
            'Use the service for commercial purposes without our consent',
            'Attempt to extract personal contact details from other members outside the platform',
            'Use automated tools to access or scrape the service',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>
        <p style={p}>
          Arrange Marriage reserves the right to suspend or permanently ban any account found to be in violation of these terms.
        </p>

        <h2 style={h2}>8. Limitation of Liability</h2>
        <p style={p}>
          Arrange Marriage is a platform that facilitates connections between individuals. We do not conduct background checks on members and are not responsible for the conduct of any member on or off the platform. You use the service at your own risk. Arrange Marriage's total liability to you shall not exceed the amount you paid us in the three months prior to the claim.
        </p>

        <h2 style={h2}>9. Changes to These Terms</h2>
        <p style={p}>
          We may update these Terms of Service from time to time. We will notify you of significant changes by email or through a notice on the platform. Continued use of Arrange Marriage after changes take effect constitutes your acceptance of the revised terms.
        </p>

        <h2 style={h2}>10. Governing Law</h2>
        <p style={p}>
          These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2 style={h2}>11. Contact</h2>
        <p style={p}>
          If you have any questions about these Terms, please contact us at{' '}
          <a href="mailto:support@arrangemarriage.co.in" style={{ color: c.gold }}>support@arrangemarriage.co.in</a>.
        </p>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '1.5rem' }}>
          <Link href="/privacy" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.gold, textDecoration: 'none', letterSpacing: '0.06em' }}>Privacy Policy →</Link>
          <Link href="/" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, textDecoration: 'none', letterSpacing: '0.06em' }}>← Back to Home</Link>
        </div>

      </main>
    </div>
  )
}
