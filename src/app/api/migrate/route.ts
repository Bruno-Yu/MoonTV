/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { D1Storage } from '@/lib/d1.db';
import { Favorite, PlayRecord } from '@/lib/types';

export const runtime = 'edge';

interface MigrateBody {
  playRecords?: Record<string, PlayRecord>;
  favorites?: Record<string, Favorite>;
  searchHistory?: string[];
}

/**
 * POST /api/migrate
 * Bulk-imports localStorage data into D1 for the authenticated user.
 * Idempotent: existing keys are silently ignored (INSERT OR IGNORE semantics
 * achieved by calling setPlayRecord / setFavorite which use INSERT OR REPLACE —
 * safe to call multiple times, same result).
 */
export async function POST(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: MigrateBody;
  try {
    body = (await request.json()) as MigrateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const storage = new D1Storage();
  const userName = authInfo.username;

  const { playRecords = {}, favorites = {}, searchHistory = [] } = body;

  let importedPlayRecords = 0;
  let importedFavorites = 0;
  let importedSearchHistory = 0;

  // Import play records
  for (const [key, record] of Object.entries(playRecords)) {
    try {
      await storage.setPlayRecord(userName, key, record);
      importedPlayRecords++;
    } catch (err) {
      console.warn('[migrate] skip play record', key, err);
    }
  }

  // Import favorites
  for (const [key, favorite] of Object.entries(favorites)) {
    try {
      await storage.setFavorite(userName, key, favorite);
      importedFavorites++;
    } catch (err) {
      console.warn('[migrate] skip favorite', key, err);
    }
  }

  // Import search history (oldest-first so newest ends up on top)
  for (const keyword of [...searchHistory].reverse()) {
    try {
      await storage.addSearchHistory(userName, keyword);
      importedSearchHistory++;
    } catch (err) {
      console.warn('[migrate] skip search history', keyword, err);
    }
  }

  return NextResponse.json({
    imported: {
      playRecords: importedPlayRecords,
      favorites: importedFavorites,
      searchHistory: importedSearchHistory,
    },
  });
}
