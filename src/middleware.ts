/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // 登录接口单独处理：速率限制（5 req/60s/IP），然后放行
  if (pathname === '/api/login') {
    const result = checkRateLimit(`${ip}:login`, 5, 60_000);
    if (!result.ok) {
      return tooManyRequests(result.retryAfter);
    }
    return NextResponse.next();
  }

  // 跳过不需要认证的路径
  if (shouldSkipAuth(pathname)) {
    // 公开 API 路径：速率限制 + API Token 验证
    if (isPublicApiPath(pathname)) {
      const result = checkRateLimit(`${ip}:public-api`, 60, 60_000);
      if (!result.ok) {
        return tooManyRequests(result.retryAfter);
      }

      // API Token 验证（仅在 API_SECRET 已配置时生效）
      const apiSecret = process.env.API_SECRET;
      if (apiSecret) {
        const tokenHeader = request.headers.get('X-API-Token');
        if (!tokenHeader || !(await verifyApiToken(tokenHeader, apiSecret))) {
          return unauthorized();
        }
      }
    }
    return NextResponse.next();
  }

  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';

  // 如果没有设置密码，直接放行
  if (storageType === 'localstorage' && !process.env.PASSWORD) {
    return NextResponse.next();
  }

  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo) {
    return redirectToLogin(request, pathname);
  }

  // localstorage 模式：验证 HMAC 签名（cookie 中存 signature，不再存明文密码）
  if (storageType === 'localstorage') {
    if (!authInfo.signature || !process.env.PASSWORD) {
      return redirectToLogin(request, pathname);
    }
    const isValid = await verifySignature(
      process.env.PASSWORD,
      authInfo.signature,
      process.env.PASSWORD
    );
    if (!isValid) {
      return redirectToLogin(request, pathname);
    }
    return NextResponse.next();
  }

  // 数据库模式：验证用户名签名
  if (!authInfo.username || !authInfo.signature) {
    return redirectToLogin(request, pathname);
  }

  const isValidSignature = await verifySignature(
    authInfo.username,
    authInfo.signature,
    process.env.PASSWORD || ''
  );

  if (!isValidSignature) {
    return redirectToLogin(request, pathname);
  }

  // Admin 速率限制（10 req/60s/IP）
  if (pathname.startsWith('/api/admin')) {
    const result = checkRateLimit(`${ip}:admin`, 10, 60_000);
    if (!result.ok) {
      return tooManyRequests(result.retryAfter);
    }
  }

  return NextResponse.next();
}

// ---- 辅助函数 ----

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function tooManyRequests(retryAfter: number): NextResponse {
  return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
    },
  });
}

function unauthorized(): NextResponse {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function verifySignature(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBuffer = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      encoder.encode(data)
    );
  } catch (error) {
    console.error('签名验证失败:', error);
    return false;
  }
}

// 验证 API Token（HMAC-SHA256，±5 分钟窗口）
async function verifyApiToken(token: string, secret: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 60_000);
  for (let offset = -5; offset <= 5; offset++) {
    const expected = await generateHmac(String(now + offset), secret);
    if (expected === token) return true;
  }
  return false;
}

async function generateHmac(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/login', request.url);
  const fullUrl = `${pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('redirect', fullUrl);
  return NextResponse.redirect(loginUrl);
}

function isPublicApiPath(pathname: string): boolean {
  return ['/api/search', '/api/detail', '/api/douban', '/api/image-proxy'].some(
    (p) => pathname.startsWith(p)
  );
}

function shouldSkipAuth(pathname: string): boolean {
  const skipPaths = [
    '/login',
    '/api/register',
    '/api/logout',
    '/api/server-config',
    '/api/auth/me',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/manifest.json',
    '/icons/',
    '/logo.png',
    '/screenshot.png',
    '/api/detail',
    '/api/search',
    '/api/search/one',
    '/api/search/resources',
    '/api/image-proxy',
    '/api/douban',
  ];
  return skipPaths.some((path) => pathname.startsWith(path));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
