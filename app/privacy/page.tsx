import Link from 'next/link'
import Navigation from '@/components/Navigation'

const c = {
  bg: '#07111f', navy: '#0d1f3c', gold: '#c9a84c',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', sepia: '#5a6e82',
  border: 'rgba(201,168,76,0.15)',
}

const h2 = { fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.35rem', fontWeight: 600, color: c.ivory, margin: '2rem 0 0.75rem' } as const
const p  = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.8, margin: '0 0 0.9rem' } as const
const li = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.8, marginBottom: '0.4rem' } as const

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />
      <Navigation />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '6rem 1.5rem 5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.5rem' }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.4rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>Privacy Policy</h1>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', color: c.sepia, margin: 0 }}>Last updated: May 2026</p>
          <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginTop: '1.25rem' }} />
        </div>

        <p style={p}>
          Arrange Marriage is committed to protecting your privacy. This Privacy Policy explains what personal data we collect, how we use it, and your rights under the UK General Data Protection Regulation (Indian Information Technology Act 2000 and applicable data protection laws.
        </p>

        <h2 style={h2}>1. Who We Are</h2>
        <p style={p}>
          Arrange Marriage is a privacy-first matrimony platform based in the India. For any privacy-related enquiries, please contact us at{' '}
          <a href="mailto:support@arrangemarriage.live" style={{ color: c.gold }}>support@arrangemarriage.live</a>.
        </p>

        <h2 style={h2}>2. Data We Collect</h2>
        <p style={p}>When you create a Arrange Marriage account we collect:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Email address (for account creation and communication)',
            'First name and last name',
            'Age, gender, city, country',
            'Religion, mother tongue, education, occupation',
            'Partner preferences',
            'Back-side photos (visible to other members)',
            'Face/reveal photo (hidden until you choose to reveal)',
            'Voice introduction recording',
            'Personality and interest information',
            'Subscription and billing information (processed by Razorpay)',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>

        <h2 style={h2}>3. How We Use Your Data</h2>
        <p style={p}>We use your personal data to:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Provide the Arrange Marriage matchmaking service',
            'Display your profile to other members',
            'Facilitate photo reveals and video meeting requests',
            'Process subscription payments',
            'Send you verification codes and service notifications',
            'Improve and personalise your experience using AI matching',
            'Comply with our legal obligations',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>
        <p style={p}>
          We do not sell your personal data to third parties. We do not use your data for advertising purposes.
        </p>

        <h2 style={h2}>4. Your Face Photo</h2>
        <p style={p}>
          Your face (reveal) photo is stored securely and is <strong style={{ color: c.ivory }}>never visible</strong> to other members by default. It is only revealed when you actively choose to reveal it on another member's profile. This is central to how Arrange Marriage works — personality and voice come before appearance.
        </p>

        <h2 style={h2}>5. Third-Party Services</h2>
        <p style={p}>We use the following trusted third-party services:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Supabase — secure database and file storage (EU/US servers)',
            'Razorpay — payment processing (PCI-DSS compliant, no card data stored by us)',
            'Vercel — website hosting',
            'Anthropic Claude — AI-powered compatibility matching (no data retained)',
            'Jitsi Meet — video calls (end-to-end encrypted, no data stored)',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>

        <h2 style={h2}>6. Data Retention</h2>
        <p style={p}>
          We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or financial compliance purposes (e.g. payment records for up to 7 years).
        </p>

        <h2 style={h2}>7. Your Rights (UK GDPR)</h2>
        <p style={p}>Under UK data protection law, you have the right to:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Access the personal data we hold about you',
            'Correct any inaccurate data',
            'Request deletion of your data ("right to be forgotten")',
            'Object to or restrict how we process your data',
            'Data portability — receive your data in a portable format',
            'Withdraw consent at any time',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>
        <p style={p}>
          To exercise any of these rights, please email us at{' '}
          <a href="mailto:support@arrangemarriage.live" style={{ color: c.gold }}>support@arrangemarriage.live</a>.
          We will respond within 30 days.
        </p>

        <h2 style={h2}>8. Cookies</h2>
        <p style={p}>
          Arrange Marriage uses only essential cookies required for authentication and security. We do not use advertising or tracking cookies.
        </p>

        <h2 style={h2}>9. Security</h2>
        <p style={p}>
          All data is transmitted over HTTPS. Photos and voice recordings are stored in a private, access-controlled storage system. Signed URLs are generated on demand and expire within 1 hour. We take reasonable technical and organisational measures to protect your data against unauthorised access.
        </p>

        <h2 style={h2}>10. Changes to This Policy</h2>
        <p style={p}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes by email. The date at the top of this page reflects when the policy was last updated.
        </p>

        <h2 style={h2}>11. Complaints</h2>
        <p style={p}>
          If you are not satisfied with how we handle your data, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: c.gold }}>ico.org.uk</a>.
        </p>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '1.5rem' }}>
          <Link href="/terms" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.gold, textDecoration: 'none', letterSpacing: '0.06em' }}>Terms of Service →</Link>
          <Link href="/" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, textDecoration: 'none', letterSpacing: '0.06em' }}>← Back to Home</Link>
        </div>

      </main>
    </div>
  )
}
