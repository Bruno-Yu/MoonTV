/* eslint-disable no-console,@typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'edge';

const STORAGE_TYPE =
  (process.env.NEXT_PUBLIC_STORAGE_TYPE as string | undefined) ||
  'localstorage';

// 生成 HMAC-SHA256 十六进制签名
async function generateSignature(
  data: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 生成认证 Cookie 值
async function generateAuthCookie(
  username?: string,
  password?: string
): Promise<string> {
  const authData: any = {};

  if (STORAGE_TYPE === 'localstorage' && password) {
    // localStorage 模式：存 HMAC 签名，不存明文密码
    const signature = await generateSignature(password, password);
    authData.signature = signature;
    authData.timestamp = Date.now();
  } else if (username && process.env.PASSWORD) {
    // 数据库模式：用密码签名用户名
    authData.username = username;
    authData.signature = await generateSignature(
      username,
      process.env.PASSWORD
    );
    authData.timestamp = Date.now();
  }

  return encodeURIComponent(JSON.stringify(authData));
}

// 设置安全 Cookie 的公共选项
function cookieOptions(expires: Date) {
  return {
    path: '/',
    expires,
    sameSite: 'strict' as const,
    httpOnly: true,
    secure: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    // localStorage 模式：仅校验固定密码
    if (STORAGE_TYPE === 'localstorage') {
      const envPassword = process.env.PASSWORD;

      if (!envPassword) {
        const response = NextResponse.json({ ok: true });
        response.cookies.set('auth', '', {
          path: '/',
          expires: new Date(0),
          sameSite: 'strict',
          httpOnly: true,
          secure: true,
        });
        return response;
      }

      const { password } = await req.json();
      if (typeof password !== 'string') {
        return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
      }

      if (password !== envPassword) {
        return NextResponse.json(
          { ok: false, error: '密码错误' },
          { status: 401 }
        );
      }

      const response = NextResponse.json({ ok: true });
      const cookieValue = await generateAuthCookie(undefined, password);
      response.cookies.set('auth', cookieValue, cookieOptions(expires));
      return response;
    }

    // 数据库 / Redis 模式
    const { username, password } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    // 站长账号（环境变量配置）
    if (
      username === process.env.USERNAME &&
      password === process.env.PASSWORD
    ) {
      const response = NextResponse.json({ ok: true });
      const cookieValue = await generateAuthCookie(username, password);
      response.cookies.set('auth', cookieValue, cookieOptions(expires));
      return response;
    } else if (username === process.env.USERNAME) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const config = getConfig();
    const user = config.UserConfig.Users.find((u) => u.username === username);
    if (user && user.banned) {
      return NextResponse.json({ error: '用户被封禁' }, { status: 401 });
    }

    try {
      const pass = await db.verifyUser(username, password);
      if (!pass) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      }

      const response = NextResponse.json({ ok: true });
      const cookieValue = await generateAuthCookie(username, password);
      response.cookies.set('auth', cookieValue, cookieOptions(expires));
      return response;
    } catch (err) {
      console.error('数据库验证失败', err);
      return NextResponse.json({ error: '数据库错误' }, { status: 500 });
    }
  } catch (error) {
    console.error('登录接口异常', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
