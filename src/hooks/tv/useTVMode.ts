'use client';

import { useEffect, useState } from 'react';

export function useTVMode() {
  const [isTVMode, setIsTVMode] = useState(false);

  useEffect(() => {
    // 檢測是否為 TV 模式
    const checkTVMode = () => {
      // 1. 檢查 URL 參數
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tv') === '1') {
        return true;
      }
      
      // 2. 檢查 User Agent
      const userAgent = navigator.userAgent;
      const isAndroidTV = /Android TV|GoogleTV|SmartTV/.test(userAgent);
      
      // 3. 檢查是否有 AndroidTV bridge
      if ((window as any).AndroidTV) {
        return true;
      }
      
      return isAndroidTV;
    };

    setIsTVMode(checkTVMode());
  }, []);

  return isTVMode;
}
