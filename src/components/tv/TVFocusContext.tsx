'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface TVFocusItem {
  id: string;
  ref: React.RefObject<HTMLElement>;
  row?: number;
  col?: number;
  parentRow?: number;
  onEnter?: () => void;
}

interface TVFocusContextType {
  focusedId: string | null;
  setFocus: (id: string) => void;
  registerItem: (item: TVFocusItem) => void;
  unregisterItem: (id: string) => void;
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
  pressEnter: () => void;
  getFocusedItem: () => TVFocusItem | null;
}

const TVFocusContext = createContext<TVFocusContextType | null>(null);

export function TVFocusProvider({ children }: { children: React.ReactNode }) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const itemsRef = useRef<Map<string, TVFocusItem>>(new Map());
  const rowColMap = useRef<Map<number, Map<string, TVFocusItem>>>(new Map());

  const registerItem = useCallback((item: TVFocusItem) => {
    itemsRef.current.set(item.id, item);
    
    // 建立 row-col 索引
    if (item.row !== undefined && item.col !== undefined && item.parentRow !== undefined) {
      const parentKey = item.parentRow;
      if (!rowColMap.current.has(parentKey)) {
        rowColMap.current.set(parentKey, new Map());
      }
      const key = `${item.row},${item.col}`;
      rowColMap.current.get(parentKey)?.set(key, item);
    }
  }, []);

  const unregisterItem = useCallback((id: string) => {
    const item = itemsRef.current.get(id);
    if (item && item.row !== undefined && item.col !== undefined && item.parentRow !== undefined) {
      const parentKey = item.parentRow;
      const rowMap = rowColMap.current.get(parentKey);
      if (rowMap) {
        rowMap.delete(`${item.row},${item.col}`);
      }
    }
    itemsRef.current.delete(id);
  }, []);

  const setFocus = useCallback((id: string) => {
    setFocusedId(id);
    const item = itemsRef.current.get(id);
    if (item?.ref.current) {
      item.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      item.ref.current.focus();
    }
  }, []);

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const current = itemsRef.current.get(focusedId || '');
    if (!current || (current.row === undefined || current.col === undefined)) {
      // 如果沒有 row/col，用 DOM 順序
      const allItems = Array.from(itemsRef.current.values());
      const currentIndex = allItems.findIndex(item => item.id === focusedId);
      let nextIndex = currentIndex;
      
      switch (direction) {
        case 'down': nextIndex = (currentIndex + 1) % allItems.length; break;
        case 'up': nextIndex = (currentIndex - 1 + allItems.length) % allItems.length; break;
        case 'right': nextIndex = Math.min(currentIndex + 1, allItems.length - 1); break;
        case 'left': nextIndex = Math.max(currentIndex - 1, 0); break;
      }
      
      if (nextIndex >= 0 && nextIndex < allItems.length) {
        setFocus(allItems[nextIndex].id);
      }
      return;
    }

    const parentKey = current.parentRow || 0;
    const rowMap = rowColMap.current.get(parentKey);
    if (!rowMap) return;

    let nextRow = current.row;
    let nextCol = current.col;

    switch (direction) {
      case 'up': nextRow--; break;
      case 'down': nextRow++; break;
      case 'left': nextCol--; break;
      case 'right': nextCol++; break;
    }

    const nextItem = rowMap.get(`${nextRow},${nextCol}`);
    if (nextItem) {
      setFocus(nextItem.id);
    }
  }, [focusedId, setFocus]);

  const pressEnter = useCallback(() => {
    const item = itemsRef.current.get(focusedId || '');
    item?.onEnter?.();
  }, [focusedId]);

  const getFocusedItem = useCallback(() => {
    return itemsRef.current.get(focusedId || '') || null;
  }, [focusedId]);

  // 處理鍵盤事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': moveFocus('up'); e.preventDefault(); break;
        case 'ArrowDown': moveFocus('down'); e.preventDefault(); break;
        case 'ArrowLeft': moveFocus('left'); e.preventDefault(); break;
        case 'ArrowRight': moveFocus('right'); e.preventDefault(); break;
        case 'Enter': pressEnter(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveFocus, pressEnter]);

  return (
    <TVFocusContext.Provider value={{ focusedId, setFocus, registerItem, unregisterItem, moveFocus, pressEnter, getFocusedItem }}>
      {children}
    </TVFocusContext.Provider>
  );
}

export const useTVFocus = () => {
  const context = useContext(TVFocusContext);
  if (!context) throw new Error('useTVFocus must be used within TVFocusProvider');
  return context;
};
