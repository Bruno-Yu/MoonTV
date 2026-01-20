'use client';

import { useEffect } from 'react';
import { TVFocusProvider } from '@/components/tv/TVFocusContext';
import { TVFocusableCard } from '@/components/tv/TVFocusableCard';
import { TVNavigationBar } from '@/components/tv/TVNavigationBar';
import { TVRemoteHint } from '@/components/tv/TVRemoteHint';
import { useTVMode } from '@/hooks/tv/useTVMode';

export default function TVPage() {
  const isTVMode = useTVMode();

  useEffect(() => {
    if (isTVMode) {
      document.body.classList.add('tv-mode');
      return () => document.body.classList.remove('tv-mode');
    }
  }, [isTVMode]);

  return (
    <TVFocusProvider>
      <div className="min-h-screen bg-gray-900 text-white pb-24">
        {/* 頂部標題 */}
        <header className="p-6 border-b border-gray-800">
          <h1 className="text-3xl font-bold">MoonTV</h1>
          <p className="text-gray-400 mt-2">使用遙控器選擇內容</p>
        </header>

        {/* 主內容區 - Grid 佈局 */}
        <main className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* 第一行 */}
            <TVFocusableCard
              id="continue-watching"
              row={0}
              col={0}
              parentRow={0}
              className="bg-gray-800 rounded-lg p-6 h-48 flex flex-col justify-center items-center hover:bg-gray-700"
              onEnter={() => window.location.href = '/continue-watching?tv=1'}
            >
              <div className="text-4xl mb-2">▶️</div>
              <div className="text-xl font-medium">繼續觀看</div>
            </TVFocusableCard>

            <TVFocusableCard
              id="hot-movies"
              row={0}
              col={1}
              parentRow={0}
              className="bg-gray-800 rounded-lg p-6 h-48 flex flex-col justify-center items-center hover:bg-gray-700"
              onEnter={() => window.location.href = '/hot-movies?tv=1'}
            >
              <div className="text-4xl mb-2">🎬</div>
              <div className="text-xl font-medium">熱門電影</div>
            </TVFocusableCard>

            <TVFocusableCard
              id="hot-tvshows"
              row={0}
              col={2}
              parentRow={0}
              className="bg-gray-800 rounded-lg p-6 h-48 flex flex-col justify-center items-center hover:bg-gray-700"
              onEnter={() => window.location.href = '/hot-tvshows?tv=1'}
            >
              <div className="text-4xl mb-2">📺</div>
              <div className="text-xl font-medium">熱門劇集</div>
            </TVFocusableCard>

            {/* 第二行 */}
            <TVFocusableCard
              id="favorites"
              row={1}
              col={0}
              parentRow={0}
              className="bg-gray-800 rounded-lg p-6 h-48 flex flex-col justify-center items-center hover:bg-gray-700"
              onEnter={() => window.location.href = '/favorites?tv=1'}
            >
              <div className="text-4xl mb-2">❤️</div>
              <div className="text-xl font-medium">收藏夾</div>
            </TVFocusableCard>

            <TVFocusableCard
              id="douban-top"
              row={1}
              col={1}
              parentRow={0}
              className="bg-gray-800 rounded-lg p-6 h-48 flex flex-col justify-center items-center hover:bg-gray-700"
              onEnter={() => window.location.href = '/douban?tv=1'}
            >
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-xl font-medium">豆瓣 Top250</div>
            </TVFocusableCard>

            <TVFocusableCard
              id="search"
              row={1}
              col={2}
              parentRow={0}
              className="bg-gray-800 rounded-lg p-6 h-48 flex flex-col justify-center items-center hover:bg-gray-700"
              onEnter={() => window.location.href = '/search/tv'}
            >
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-xl font-medium">搜尋</div>
            </TVFocusableCard>
          </div>
        </main>

        {/* 底部導航 */}
        <TVNavigationBar items={[
          { id: 'home', label: '首頁', icon: '🏠', path: '/tv' },
          { id: 'search', label: '搜尋', icon: '🔍', path: '/search/tv' },
          { id: 'favorites', label: '收藏', icon: '❤️', path: '/favorites?tv=1' },
          { id: 'history', label: '歷史', icon: '📜', path: '/history?tv=1' },
        ]} />

        {/* 遙控器提示 */}
        <TVRemoteHint />
      </div>
    </TVFocusProvider>
  );
}
