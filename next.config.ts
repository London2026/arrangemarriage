import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
