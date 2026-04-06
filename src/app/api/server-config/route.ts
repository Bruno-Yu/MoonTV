/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { generateApiToken } from '@/lib/auth';
import { getConfig } from '@/lib/config';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  console.log('server-config called: ', request.url);

  const config = getConfig();
  const apiToken = await generateApiToken();

  const result: Record<string, string> = {
    SiteName: config.SiteConfig.SiteName,
    StorageType: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage',
  };

  if (apiToken) {
    result.apiToken = apiToken;
  }

  return NextResponse.json(result);
}
