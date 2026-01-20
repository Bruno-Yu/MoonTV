'use client';

export function TVRemoteHint() {
  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50">
      <div className="bg-black/80 text-white px-4 py-2 rounded-full flex space-x-6 text-sm">
        <span className="flex items-center">
          <span className="mr-1">◀ ▶</span> 下一張/上一張
        </span>
        <span className="flex items-center">
          <span className="mr-1">▲ ▼</span> 上一行/下一行
        </span>
        <span className="flex items-center">
          <span className="mr-1">⏎</span> 確認/播放
        </span>
      </div>
    </div>
  );
}
