import { NextResponse } from 'next/server';

export const runtime = 'edge';

// 允许的图片域名（精确匹配或通配符后缀匹配）
const ALLOWED_HOSTNAME_PATTERNS = [
  /^img\d*\.doubanio\.com$/,
  /^.*\.doubanio\.com$/,
  /^image\.tmdb\.org$/,
  /^img\.bgm\.tv$/,
];

// RFC1918 私有 / 回环 / 链路本地地址前缀（用于 SSRF 防护）
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^localhost$/i,
];

function isAllowedHostname(hostname: string): boolean {
  return ALLOWED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
}

function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

// OrionTV 兼容接口
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  // 缺少 url 参数（missing URL parameter rejected）
  if (!imageUrl || !imageUrl.trim()) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // 解析目标 URL
  let targetUrl: URL;
  try {
    targetUrl = new URL(imageUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid url parameter' },
      { status: 400 }
    );
  }

  const hostname = targetUrl.hostname;

  // 私有 IP 拒绝（image proxy private IP rejection）
  if (isPrivateIp(hostname)) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  // 域名白名单检查（image proxy domain allowlist）
  if (!isAllowedHostname(hostname)) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        Referer: 'https://movie.douban.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: imageResponse.statusText },
        { status: imageResponse.status }
      );
    }

    if (!imageResponse.body) {
      return NextResponse.json(
        { error: 'Image response has no body' },
        { status: 500 }
      );
    }

    const contentType = imageResponse.headers.get('content-type');
    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    headers.set('Cache-Control', 'public, max-age=86400');

    return new Response(imageResponse.body, { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching image' },
      { status: 500 }
    );
  }
}
