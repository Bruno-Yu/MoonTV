'use client';

import { useRef } from 'react';
import { useTVFocus } from './TVFocusContext';

interface TVScrollableRowProps {
  id: string;
  row: number;
  children: React.ReactNode;
  className?: string;
}

export function TVScrollableRow({ id, row, children, className = '' }: TVScrollableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { focusedId, moveFocus } = useTVFocus();
  const isRowFocused = focusedId?.startsWith(id);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRowFocused) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        moveFocus(e.key === 'ArrowUp' ? 'up' : 'down');
        e.preventDefault();
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      data-tv-row-id={id}
      onKeyDown={handleKeyDown}
      className={`relative ${className}`}
    >
      <div className="flex space-x-6 overflow-x-auto scrollbar-hide py-2 snap-x snap-mandatory">
        {children}
      </div>
    </div>
  );
}
