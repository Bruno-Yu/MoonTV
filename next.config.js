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
    // 只允许明确信任的图片域名（restricted image remote patterns）
    remotePatterns: [
      { protocol: 'https', hostname: '*.doubanio.com' },
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'img.bgm.tv' },
      // 中国视频源常用图片 CDN
      { protocol: 'https', hostname: 'pic.rmb.bdstatic.com' },
      { protocol: 'http', hostname: '*.doubanio.com' },
    ],
  },
};

// 暫時禁用 PWA 以避免問題
module.exports = nextConfig;
