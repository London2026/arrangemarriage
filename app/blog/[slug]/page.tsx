import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { BLOG_POSTS, getBlogPost, getSortedBlogPosts } from '@/content/blog-posts'

const c = {
  page: '#07111f', card: '#1e3358', border: 'rgba(201,168,76,0.25)',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', gold: '#c9a84c', navy: '#0d1f3c',
  sepia: '#5a6e82',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: 'article', publishedTime: post.date },
    alternates: { canonical: `https://www.arrangemarriage.co.in/blog/${post.slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const otherPosts = getSortedBlogPosts().filter((p) => p.slug !== slug).slice(0, 2)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.page }}>
      <style>{`
        .blog-post-main { padding: 6.5rem 1.5rem 6rem; }
        .blog-post-h1 { font-size: 2.1rem; }
        @media (max-width: 600px) {
          .blog-post-main { padding: 5.5rem 1rem 7rem; }
          .blog-post-h1 { font-size: 1.65rem; }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)' }} />

      <Navigation />

      <main className="blog-post-main" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link href="/blog" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.gold, textDecoration: 'none' }}>
          ← All Posts
        </Link>

        <div style={{ margin: '1.5rem 0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(201,168,76,0.12)', border: `1px solid ${c.border}`, color: c.gold, borderRadius: '20px', padding: '0.2rem 0.7rem' }}>
              {post.tag}
            </span>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', color: c.sepia, letterSpacing: '0.04em' }}>
              {formatDate(post.date)}
            </span>
          </div>
          <h1 className="blog-post-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, margin: '0 0 0.75rem', lineHeight: 1.3 }}>
            {post.title}
          </h1>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.15rem', color: c.ivoryDim, lineHeight: 1.6 }}>
            {post.description}
          </p>
        </div>

        <article>
          <ReactMarkdown
            components={{
              h2: (p) => <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.4rem', fontWeight: 600, color: c.ivory, margin: '2rem 0 0.9rem' }} {...p} />,
              h3: (p) => <h3 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.15rem', fontWeight: 600, color: c.ivory, margin: '1.75rem 0 0.75rem' }} {...p} />,
              p: (p) => <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: '#d8d2c4', lineHeight: 1.8, margin: '0 0 1.1rem' }} {...p} />,
              ul: (p) => <ul style={{ margin: '0 0 1.1rem', paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} {...p} />,
              ol: (p) => <ol style={{ margin: '0 0 1.1rem', paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} {...p} />,
              li: (p) => <li style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: '#d8d2c4', lineHeight: 1.7 }} {...p} />,
              strong: (p) => <strong style={{ color: c.ivory, fontWeight: 700 }} {...p} />,
              em: (p) => <em style={{ color: c.gold, fontStyle: 'italic' }} {...p} />,
              blockquote: (p) => <blockquote style={{ margin: '0 0 1.1rem', paddingLeft: '1rem', borderLeft: `2px solid ${c.border}`, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: c.ivoryDim }} {...p} />,
            }}
          >
            {post.body}
          </ReactMarkdown>
        </article>

        {otherPosts.length > 0 && (
          <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: `1px solid ${c.border}` }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.gold, margin: '0 0 1rem' }}>
              More From the Blog
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {otherPosts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '1rem 1.25rem' }}>
                    <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.05rem', fontWeight: 600, color: c.ivory, margin: 0 }}>{p.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
