import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);

  if (!authInfo || (!authInfo.username && !authInfo.signature)) {
    return NextResponse.json({ authenticated: false });
  }

  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';

  if (storageType === 'localstorage') {
    // localStorage 模式：有签名即视为已认证
    if (!authInfo.signature) {
      return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json({
      authenticated: true,
      username: 'user',
      role: 'user',
    });
  }

  // 数据库模式：查询用户角色
  const username = authInfo.username;
  if (!username) {
    return NextResponse.json({ authenticated: false });
  }

  // 检查是否为站长
  if (username === process.env.USERNAME) {
    return NextResponse.json({ authenticated: true, username, role: 'owner' });
  }

  // 查询 config 中的用户角色
  try {
    const config = getConfig();
    const user = config.UserConfig.Users.find((u) => u.username === username);
    const role = user?.role || 'user';
    return NextResponse.json({ authenticated: true, username, role });
  } catch {
    return NextResponse.json({ authenticated: true, username, role: 'user' });
  }
}
