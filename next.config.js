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

  /**
   * Webpack alias: stub out @cloudflare/next-on-pages for non-Edge Runtime
   * builds (e.g. the client bundle that includes admin/page.tsx via db.ts →
   * d1.db.ts). This prevents the "server-only cannot be imported from a Client
   * Component" build error while keeping the static import working correctly
   * in Edge Runtime API routes at deploy time.
   */
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime !== 'edge') {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@cloudflare/next-on-pages': false,
      };
    }
    return config;
  },
};

// 暫時禁用 PWA 以避免問題
module.exports = nextConfig;
