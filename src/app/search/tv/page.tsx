'use client';

import { useState } from 'react';

import { TVFocusableCard } from '@/components/tv/TVFocusableCard';
import { TVFocusProvider } from '@/components/tv/TVFocusContext';
import { TVNavigationBar } from '@/components/tv/TVNavigationBar';
import { TVRemoteHint } from '@/components/tv/TVRemoteHint';

export default function TVSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(
        searchQuery
      )}&tv=1`;
    }
  };

  return (
    <TVFocusProvider>
      <div className='min-h-screen bg-gray-900 text-white pb-24'>
        {/* 搜尋標題 */}
        <header className='p-6 border-b border-gray-800'>
          <h1 className='text-3xl font-bold'>搜尋影片</h1>
        </header>

        {/* 搜尋框 */}
        <div className='p-6'>
          <TVFocusableCard
            id='search-input'
            className='bg-gray-800 rounded-lg p-4'
            onEnter={handleSearch}
          >
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='輸入搜索關鍵字'
              className='w-full bg-transparent text-white text-xl outline-none'
              autoFocus
            />
          </TVFocusableCard>

          {/* 虛擬鍵盤提示 */}
          <div className='mt-6 text-gray-400 text-center'>
            <p className='mb-4'>請使用遙控器或語音輸入</p>

            {/* 模擬數字鍵盤 */}
            <div className='grid grid-cols-6 gap-3 max-w-2xl mx-auto'>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (
                <TVFocusableCard
                  key={num}
                  id={`key-${num}`}
                  className='bg-gray-800 rounded-lg p-4 text-center text-2xl'
                  onEnter={() => setSearchQuery((prev) => prev + String(num))}
                >
                  {num}
                </TVFocusableCard>
              ))}

              <TVFocusableCard
                id='key-clear'
                className='bg-red-600 rounded-lg p-4 text-center'
                onEnter={() => setSearchQuery('')}
              >
                清除
              </TVFocusableCard>
            </div>
          </div>

          {/* 搜索和取消按鈕 */}
          <div className='flex justify-center gap-4 mt-6'>
            <TVFocusableCard
              id='search-btn'
              className='bg-green-600 rounded-lg px-8 py-3 text-xl font-medium'
              onEnter={handleSearch}
            >
              搜索 🔍
            </TVFocusableCard>

            <TVFocusableCard
              id='cancel-btn'
              className='bg-gray-700 rounded-lg px-8 py-3 text-xl font-medium'
              onEnter={() => window.history.back()}
            >
              取消 ✕
            </TVFocusableCard>
          </div>
        </div>

        <TVNavigationBar
          items={[
            { id: 'home', label: '首頁', icon: '🏠', path: '/tv' },
            { id: 'search', label: '搜尋', icon: '🔍', path: '/search/tv' },
            {
              id: 'favorites',
              label: '收藏',
              icon: '❤️',
              path: '/favorites?tv=1',
            },
            { id: 'history', label: '歷史', icon: '📜', path: '/history?tv=1' },
          ]}
        />

        <TVRemoteHint />
      </div>
    </TVFocusProvider>
  );
}
