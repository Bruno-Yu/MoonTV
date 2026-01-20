'use client';

import { useEffect, useRef } from 'react';
import { useTVFocus } from './TVFocusContext';

interface TVFocusableCardProps {
  id: string;
  children: React.ReactNode;
  onEnter?: () => void;
  className?: string;
  row?: number;
  col?: number;
  parentRow?: number;
  focusStyle?: string;
}

export function TVFocusableCard({ 
  id, 
  children, 
  onEnter, 
  className = '',
  row,
  col,
  parentRow,
  focusStyle = 'ring-4 ring-green-500 ring-offset-2 dark:ring-offset-black scale-105 z-10'
}: TVFocusableCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { focusedId, setFocus } = useTVFocus();
  const isFocused = focusedId === id;

  useEffect(() => {
    if (ref.current) {
      // 註冊到 Focus 系統
      ref.current.setAttribute('data-tv-focusable', 'true');
      ref.current.setAttribute('data-tv-focus-id', id);
    }
  }, [id]);

  // Focus 時的視覺效果
  const focusStyleClass = isFocused ? focusStyle : '';

  return (
    <div
      ref={ref}
      className={`transition-all duration-150 ${focusStyleClass} ${className}`}
      onClick={() => {
        setFocus(id);
        onEnter?.();
      }}
      tabIndex={0}
      data-tv-focusable="true"
      data-tv-focus-id={id}
    >
      {children}
    </div>
  );
}
