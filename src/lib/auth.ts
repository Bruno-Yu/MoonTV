import { NextRequest } from 'next/server';

// 生成 HMAC-SHA256 十六进制字符串（Edge Runtime 兼容）
async function hmacHex(data: string, secret: string): Promise<string> {
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

/**
 * 生成 API Token（X-API-Token header 用）
 * Token = HMAC-SHA256(当前 UTC 分钟数, API_SECRET)
 * 有效期 ±5 分钟
 */
export async function generateApiToken(): Promise<string> {
  const secret = process.env.API_SECRET;
  if (!secret) return '';
  const minute = String(Math.floor(Date.now() / 60_000));
  return hmacHex(minute, secret);
}

// 从cookie获取认证信息 (服务端使用)
export function getAuthInfoFromCookie(request: NextRequest): {
  password?: string;
  username?: string;
  signature?: string;
  timestamp?: number;
} | null {
  const authCookie = request.cookies.get('auth');

  if (!authCookie) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decoded);
    return authData;
  } catch (error) {
    return null;
  }
}

// 从 /api/auth/me 获取认证信息（客户端使用，替代 document.cookie 读取）
// Cookie 已设为 HttpOnly，无法从 JS 直接读取
export async function getAuthInfoFromBrowserCookie(): Promise<{
  authenticated: boolean;
  username?: string;
  role?: string;
} | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
