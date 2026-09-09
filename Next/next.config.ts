import type { NextConfig } from 'next';
import path from 'node:path';
import createNextPWA from '@ducanh2912/next-pwa';

const withPWA = createNextPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // ===== Images =====
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },

  // ===== Middleware for API requests =====
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: process.env.NEXT_PUBLIC_API_BASE_URL
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`
          : 'http://localhost:8000/api/v1/:path*',
      },
    ];
  },

  turbopack: {
    root: path.resolve(__dirname),
  },

  allowedDevOrigins: [
    'app.127.0.0.1.nip.io',
    'admin.127.0.0.1.nip.io',
    'api.127.0.0.1.nip.io',
    'admin-api.127.0.0.1.nip.io',
    'localhost',
    '127.0.0.1',
  ],
};

export default withPWA(nextConfig);
