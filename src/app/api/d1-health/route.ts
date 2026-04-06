/* eslint-disable no-console */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/d1-health
 * Returns whether the D1 database binding (moontv_db) is available.
 * Used by the UI to verify D1 is connected before migration / data operations.
 */
export async function GET() {
  if (process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'cloudflare-d1') {
    return NextResponse.json({ connected: false, reason: 'not_d1_mode' });
  }

  try {
    const { getRequestContext } = await import(
      /* webpackIgnore: true */ '@cloudflare/next-on-pages'
    );
    const ctx = getRequestContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (ctx.env as any).moontv_db ?? null;

    if (!db) {
      return NextResponse.json({
        connected: false,
        reason: 'binding_missing',
        help: 'Go to Cloudflare Pages → Settings → Functions → D1 database bindings → add moontv_db',
      });
    }

    // Smoke-test: run a trivial query
    await db.prepare('SELECT 1').first();
    return NextResponse.json({ connected: true });
  } catch (err) {
    console.error('[D1 health] check failed:', err);
    return NextResponse.json({ connected: false, reason: 'error', error: String(err) });
  }
}
