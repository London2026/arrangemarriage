'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/discover', icon: '💘', label: 'Discover' },
  { href: '/profile', icon: '👤', label: 'Profile' },
  { href: '/pricing', icon: '💳', label: 'Pricing' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(7,17,31,0.95)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(201,168,76,0.15)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '0.6rem 0 0.75rem',
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
            padding: '0.3rem 1rem', borderRadius: '10px', textDecoration: 'none',
            color: isActive ? '#c9a84c' : '#5a6e82',
            transition: 'color 0.2s',
          }}>
            <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em' }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
