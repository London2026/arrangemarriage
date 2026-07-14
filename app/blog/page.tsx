import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { getSortedBlogPosts } from '@/content/blog-posts'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights on finding the right life partner — how our matching works, staying safe while getting to know someone new, and making the most of Arrange Marriage.',
}

const c = {
  page: '#07111f', card: '#1e3358', border: 'rgba(201,168,76,0.25)',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', gold: '#c9a84c', navy: '#0d1f3c',
  sepia: '#5a6e82',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogIndexPage() {
  const posts = getSortedBlogPosts()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.page }}>
      <style>{`
        .blog-main { padding: 6.5rem 1.5rem 6rem; }
        .blog-h1 { font-size: 2.4rem; }
        @media (max-width: 600px) {
          .blog-main { padding: 5.5rem 1rem 7rem; }
          .blog-h1 { font-size: 1.85rem; }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)' }} />

      <Navigation />

      <main className="blog-main" style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.6rem' }}>
            From Arrange Marriage
          </p>
          <h1 className="blog-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, margin: '0 0 0.75rem' }}>
            The Blog
          </h1>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.2rem', color: c.ivoryDim, maxWidth: '54ch', lineHeight: 1.6 }}>
            Notes on finding the right partner, staying safe, and getting the most out of Arrange Marriage.
          </p>
          <div style={{ height: '1px', background: 'linear-gradient(to right, #c9a84c, transparent)', marginTop: '1.5rem' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <article style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', padding: 'clamp(1.25rem, 4vw, 1.75rem)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(201,168,76,0.12)', border: `1px solid ${c.border}`, color: c.gold, borderRadius: '20px', padding: '0.2rem 0.7rem' }}>
                    {post.tag}
                  </span>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, letterSpacing: '0.04em' }}>
                    {formatDate(post.date)}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.35rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                  {post.title}
                </h2>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.6, margin: '0 0 0.75rem', overflowWrap: 'anywhere' }}>
                  {post.description}
                </p>
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.gold }}>
                  Read more →
                </span>
              </article>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
