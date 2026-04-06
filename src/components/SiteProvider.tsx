'use client';

import { createContext, ReactNode, useContext, useEffect } from 'react';

import { setApiToken } from '@/lib/api-token';

const SiteContext = createContext<{ siteName: string; announcement?: string }>({
  // 默认值
  siteName: 'MoonTV',
  announcement:
    '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源，不对任何内容的准确性、合法性、完整性负责。',
});

export const useSite = () => useContext(SiteContext);

export function SiteProvider({
  children,
  siteName,
  announcement,
}: {
  children: ReactNode;
  siteName: string;
  announcement?: string;
}) {
  useEffect(() => {
    fetch('/api/server-config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.apiToken) setApiToken(data.apiToken);
      })
      .catch(() => {
        // server-config fetch failure is non-fatal
      });
  }, []);

  return (
    <SiteContext.Provider value={{ siteName, announcement }}>
      {children}
    </SiteContext.Provider>
  );
}
