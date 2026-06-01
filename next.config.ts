import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // placeholder images for dev
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // alternate placeholder host
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Exclude Razorpay webhook from CSRF protection (needs raw body)
        source: '/api/webhooks/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/products/:slug',
        destination: '/shop/:slug',
        permanent: true,
      },
      {
        source: '/offers',
        destination: '/category/offers',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
