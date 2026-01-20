'use client';

import { useTVFocus } from './TVFocusContext';

interface TVNavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

interface TVNavigationBarProps {
  items: TVNavItem[];
}

export function TVNavigationBar({ items }: TVNavigationBarProps) {
  const { focusedId, setFocus } = useTVFocus();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-700 z-50">
      <div className="flex justify-around py-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            data-tv-focusable="true"
            data-tv-focus-id={`nav-${item.id}`}
            onClick={() => {
              setFocus(`nav-${item.id}`);
              window.location.href = item.path;
            }}
            className={`px-4 py-2 rounded-lg transition-all flex flex-col items-center ${
              focusedId === `nav-${item.id}`
                ? 'bg-green-500 text-white scale-110 shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:scale-105'
            }`}
            style={{ minWidth: '100px' }}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
