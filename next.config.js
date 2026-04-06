/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    dirs: ['src'],
  },

  reactStrictMode: false,
  swcMinify: false,

  // HTTP Security Headers (HTTP security headers on all responses)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  images: {
    // Cloudflare Pages does not support Next.js Image Optimization.
    // Using unoptimized=true so <Image> renders as a plain <img> tag,
    // which avoids remotePatterns restrictions and works with all CDN domains
    // used by Chinese video source APIs.
    // Douban images are already routed through /api/image-proxy in VideoCard.
    unoptimized: true,
  },
};

// 暫時禁用 PWA 以避免問題
module.exports = nextConfig;
