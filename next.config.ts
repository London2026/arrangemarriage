import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://checkout.razorpay.com https://*.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://xkgorkcrkignmpkjlbda.supabase.co",
  "connect-src 'self' https://xkgorkcrkignmpkjlbda.supabase.co https://checkout.razorpay.com https://*.razorpay.com https://cdn.jsdelivr.net",
  "frame-src 'self' https://*.razorpay.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.razorpay.com",
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Serve the original landing page at / without changing the URL
        { source: '/', destination: '/index.html' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  async redirects() {
    return [
      { source: '/register',      destination: '/signup', permanent: true },
      { source: '/register.html', destination: '/signup', permanent: true },
      { source: '/admin.html',    destination: '/admin',  permanent: true },
      { source: '/index.html',    destination: '/',       permanent: true },
    ]
  },
}

export default nextConfig;
