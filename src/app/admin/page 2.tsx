'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { AdminConfig } from '@/lib/admin.types';

export default function AdminPage() {
  const [config, setConfig] = useState<AdminConfig>({
    siteName: 'MoonTV',
    announcement: '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。',
    storageType: 'localstorage',
    enableRegister: true,
    searchMaxPage: 5,
    aggregateSearchResult: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const storedConfig = await db.getAdminConfig();
        if (storedConfig) {
          setConfig(storedConfig);
        }
      } catch (err) {
        console.error('Failed to load admin config:', err);
      }
    };

    loadConfig();
  }, [db]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await db.setAdminConfig(config);
      setHasChanges(false);
      // 重新驗證整個個頁面
      window.location.reload();
    } catch (err) {
      console.error('Failed to save admin config:', err);
      alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirm('确定要恢复默认配置吗？')) {
      setLoading(true);
      try {
        const defaultConfig: AdminConfig = {
          siteName: 'MoonTV',
          announcement: '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。',
          storageType: 'localstorage',
          enableRegister: true,
          searchMaxPage: 5,
          aggregateSearchResult: true,
        };

        await db.setAdminConfig(defaultConfig);
        setConfig(defaultConfig);
        setHasChanges(false);
        window.location.reload();
      } catch (err) {
        console.error('Failed to reset config:', err);
        alert('重置失败：' + (err instanceof Error ? err.message : '未知错误'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          管理员配置
        </h1>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              站点设置
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  站点名称
                </label>
                <input
                  type="text"
                  value={config.siteName || ''}
                  onChange={(e) => {
                    setConfig({ ...config, siteName: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  公告
                </label>
                <textarea
                  rows={3}
                  value={config.announcement || ''}
                  onChange={(e) => {
                    setConfig({ ...config, announcement: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                存储类型
              </h2>
              
              <div className="flex items-center space-x-4">
                <label>
                  <input
                    type="radio"
                    checked={config.storageType === 'localstorage'}
                    onChange={() => {
                      setConfig({ ...config, storageType: 'localstorage' });
                      setHasChanges(true);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">本地存储（默认）</span>
                </label>
                
                <label>
                  <input
                    type="radio"
                    checked={config.storageType === 'redis'}
                    onChange={() => {
                      setConfig({ ...config, storageType: 'redis' });
                      setHasChanges(true);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">Redis（需要配置 REDIS_URL）</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                用户功能
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.enableRegister}
                    onChange={(e) => {
                      setConfig({ ...config, enableRegister: e.target.checked });
                      setHasChanges(true);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">开放用户注册</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  搜索最大页数
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.searchMaxPage || 5}
                  onChange={(e) => {
                    setConfig({ ...config, searchMaxPage: parseInt(e.target.value) || 5 });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.aggregateSearchResult}
                    onChange={(e) => {
                      setConfig({ ...config, aggregateSearchResult: e.target.checked });
                      setHasChanges(true);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">聚合搜索结果（相同影片只显示一次）</span>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-8">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled={loading}
              >
                恢复默认
              </button>
              <button
                onClick={handleSave}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                disabled={!hasChanges || loading}
              >
                {loading ? '保存中...' : '保存配置'}
              </button>
            </div>

            {hasChanges && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ 有未保存的更改
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
