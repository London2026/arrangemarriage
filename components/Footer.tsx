/** Shared footer for public/legal pages (Terms, Privacy, Contact, Pricing, Blog). */
export default function Footer({ dark = true }: { dark?: boolean }) {
  const textColor = dark ? 'rgba(245,240,230,0.35)' : 'rgba(13,43,43,0.4)'
  const legalColor = dark ? 'rgba(245,240,230,0.22)' : 'rgba(13,43,43,0.3)'
  const borderColor = dark ? 'rgba(201,168,76,0.12)' : 'rgba(29,82,82,0.15)'

  return (
    <footer style={{ marginTop: '3rem', paddingTop: '1.75rem', paddingBottom: '2rem', borderTop: `1px solid ${borderColor}`, textAlign: 'center' }}>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: textColor, margin: '0 0 0.5rem', letterSpacing: '0.02em' }}>
        © 2026 Arrange Marriage · All rights reserved · Privacy-first matrimony platform
      </p>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: legalColor, margin: '0 auto', lineHeight: 1.6, maxWidth: '520px' }}>
        arrangemarriage.co.in is owned and operated by Keshav Vijaya IT Services Private Limited, registered with the Government of India, Ministry of Corporate Affairs, in June 2026.
      </p>
    </footer>
  )
}
