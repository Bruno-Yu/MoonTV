'use client';

import { useEffect, useState } from 'react';

const LS_MIGRATED = 'moontv_migrated';
const LS_PLAY_RECORDS = 'moontv_play_records';
const LS_FAVORITES = 'moontv_favorites';
const LS_SEARCH_HISTORY = 'moontv_search_history';

function hasLocalData(): boolean {
  try {
    return (
      !!localStorage.getItem(LS_PLAY_RECORDS) ||
      !!localStorage.getItem(LS_FAVORITES) ||
      !!localStorage.getItem(LS_SEARCH_HISTORY)
    );
  } catch {
    return false;
  }
}

/**
 * One-time migration banner: shown when storage type is cloudflare-d1,
 * localStorage has unexported data, and the user hasn't acted yet.
 */
export default function MigratePrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_STORAGE_TYPE !== 'cloudflare-d1') return;
    if (localStorage.getItem(LS_MIGRATED)) return;
    if (hasLocalData()) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(LS_MIGRATED, '1');
    setVisible(false);
  }

  async function handleMigrate() {
    setLoading(true);
    try {
      const playRecords = JSON.parse(
        localStorage.getItem(LS_PLAY_RECORDS) || '{}'
      );
      const favorites = JSON.parse(
        localStorage.getItem(LS_FAVORITES) || '{}'
      );
      const searchHistory = JSON.parse(
        localStorage.getItem(LS_SEARCH_HISTORY) || '[]'
      );

      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playRecords, favorites, searchHistory }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setResult(`遷移失敗: ${err.error || res.status}`);
        return;
      }

      const data = await res.json();
      const { imported } = data;
      setResult(
        `遷移成功！播放記錄 ${imported.playRecords} 筆，收藏 ${imported.favorites} 筆，搜尋記錄 ${imported.searchHistory} 筆`
      );

      // Clear source keys only after successful migration
      localStorage.removeItem(LS_PLAY_RECORDS);
      localStorage.removeItem(LS_FAVORITES);
      localStorage.removeItem(LS_SEARCH_HISTORY);
      localStorage.setItem(LS_MIGRATED, '1');

      setTimeout(() => setVisible(false), 3000);
    } catch (err) {
      setResult(`遷移失敗: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-yellow-500/40 bg-yellow-900/90 p-4 shadow-xl backdrop-blur-sm dark:bg-yellow-950/90">
      {result ? (
        <p className="text-center text-sm text-yellow-100">{result}</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-yellow-100">
            偵測到本地儲存的資料（播放記錄、收藏等），是否遷移到雲端資料庫（D1）？
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={dismiss}
              disabled={loading}
              className="rounded px-3 py-1 text-sm text-yellow-300 hover:text-yellow-100 disabled:opacity-50"
            >
              略過
            </button>
            <button
              onClick={handleMigrate}
              disabled={loading}
              className="rounded bg-yellow-500 px-3 py-1 text-sm font-medium text-yellow-950 hover:bg-yellow-400 disabled:opacity-50"
            >
              {loading ? '遷移中…' : '立即遷移'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
