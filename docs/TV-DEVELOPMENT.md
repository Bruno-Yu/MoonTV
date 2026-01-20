# MoonTV TV 模式開發文件

## 📋 概述

MoonTV TV 模式允許在 Chromecast with Google TV 等電視設備上使用遙控器操作網頁。

## 🏗️ 架構

```
MoonTV Web (網頁/PWA共用)
    ↓
┌──────────────────────────┐
│  TV Focus System       │ ← src/components/tv/*
│  - TVFocusContext     │
│  - FocusableCard      │
│  - TVScrollableRow    │
└──────────────────────────┘
    ↓
┌──────────────────────────┐
│  TV Pages             │ ← src/app/tv/*
│  - /tv               │
│  - /search/tv         │
│  - /favorites/tv      │
└──────────────────────────┘
    ↓
┌──────────────────────────┐
│  Kotlin WebView App    │ ← MoonTV-Android/
│  - MainActivity       │
│  - WebAppInterface    │
│  - 遙控器事件橋接       │
└──────────────────────────┘
```

## 🔧 開發指南

### 1. TV 模式啟動

有三種方式啟動 TV 模式：

#### 方式 1: URL 參數
```
https://moontv.vercel.app?tv=1
```

#### 方式 2: User Agent 檢測
自動檢測 Android TV / GoogleTV User Agent。

#### 方式 3: WebView Bridge
在 Android WebView 中自動啟動。

### 2. 使用 TV 專用元件

#### TVFocusableCard
```tsx
import { TVFocusableCard } from '@/components/tv/TVFocusableCard';

<TVFocusableCard
  id="my-card"
  row={0}
  col={0}
  parentRow="main-grid"
  className="bg-gray-800 rounded-lg"
  onEnter={() => console.log('Enter pressed')}
>
  Card Content
</TVFocusableCard>
```

#### TVFocusProvider
```tsx
import { TVFocusProvider } from '@/components/tv/TVFocusContext';

<TVFocusProvider>
  <YourContent />
</TVFocusProvider>
```

#### TVNavigationBar
```tsx
import { TVNavigationBar } from '@/components/tv/TVNavigationBar';

<TVNavigationBar items={[
  { id: 'home', label: '首頁', icon: '🏠', path: '/tv' },
  { id: 'search', label: '搜尋', icon: '🔍', path: '/search/tv' },
]} />
```

### 3. 自定義 Focus 樣式

```css
.tv-mode .tv-focused {
  ring: 4px solid #22c55e;
  transform: scale(1.08);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
}
```

### 4. 測試 TV 模式

#### 使用 Chrome DevTools 模擬
```bash
# 1. 打開 DevTools (F12)
# 2. 按 Ctrl+Shift+P
# 3. 輸入 "Show Rendering"
# 4. 啟動 "Emulate CSS media type: tv"
```

#### 使用 URL 參數
```
http://localhost:3000?tv=1
```

#### 使用 ADB 測試（Chromecast）
```bash
# 連接設備
adb connect <TV-IP>:5555

# 發送模擬按鍵
adb shell input keyevent 19  # DPAD_UP
adb shell input keyevent 20  # DPAD_DOWN
adb shell input keyevent 21  # DPAD_LEFT
adb shell input keyevent 22  # DPAD_RIGHT
adb shell input keyevent 23  # DPAD_CENTER
```

## 🎯 遙控器按鍵映射

| 按鍵 | Android KeyCode | JavaScript Key | 說明 |
|-------|---------------|----------------|-------|
| 上 | 19 | ArrowUp | 上一個元素 |
| 下 | 20 | ArrowDown | 下一個元素 |
| 左 | 21 | ArrowLeft | 左側元素 |
| 右 | 22 | ArrowRight | 右側元素 |
| 確認 | 23 | Enter | 確認/播放 |
| 返回 | 4 | Backspace | 返回上一頁 |
| 首頁 | 3 | Home | 返回首頁 |

## 📱 Android 專案開發

### 環境設置
```bash
cd MoonTV-Android

# 同步 Gradle
./gradlew build

# 安裝到設備
./gradlew installDebug
```

### 修改 WebView URL
```kotlin
// MainActivity.kt
loadUrl("https://your-moontv-url.com?tv=1")
```

### 查看 WebView 日誌
```bash
adb logcat | grep "MoonTV"
```

## 🔗 JavaScript Bridge API

### 在 WebView 中調用 Android
```javascript
// 分發按鍵事件
window.AndroidTV.dispatchKeyEvent(19, 0); // UP key, ACTION_DOWN

// 請求 Focus
window.AndroidTV.requestFocus();

// 獲取設備資訊
const deviceInfo = JSON.parse(window.AndroidTV.getDeviceInfo());
console.log('Screen:', deviceInfo.screenWidth, 'x', deviceInfo.screenHeight);
```

### 在 Android 中調用 JavaScript
```kotlin
webView.evaluateJavascript("moveFocus('up')") { value ->
    // 處理結果
}
```

## 📝 最佳實踐

### 1. Grid 佈局
```tsx
{/* 推薦: 使用 Grid 佈局 */}
<div className="grid grid-cols-3 gap-6">
  <TVFocusableCard row={0} col={0} />
  <TVFocusableCard row={0} col={1} />
  <TVFocusableCard row={0} col={2} />
</div>

{/* 避免: 使用長列表 */}
<div className="space-y-4">
  {/* 需要多次按向下鍵 */}
</div>
```

### 2. Focus 視覺回饋
```tsx
{/* 好的: 清晰的 Focus 樣式 */}
className={isFocused ? 'ring-4 ring-green-500 scale-105' : ''}

{/* 避免: 不明顯的變化 */}
className={isFocused ? 'bg-gray-700' : 'bg-gray-800'}
```

### 3. 自動滾動
Focus 系統會自動將元素滾動到視口中心：

```typescript
// TVFocusContext.tsx
setFocus((id: string) => {
  item.ref.current.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center', 
    inline: 'center' 
  });
});
```

### 4. 減少導航步驟
```tsx
{/* 推薦: 6 個主要項目 */}
const navItems = [
  { id: 'home', label: '首頁' },
  { id: 'search', label: '搜尋' },
  { id: 'favorites', label: '收藏' },
  { id: 'history', label: '歷史' },
];

{/* 避免: 14 個項目（需要多次按鍵） */}
```

## 🐛 常見問題

### Q: Focus 不移動
**A**: 確保所有可互動元素都有 `data-tv-focusable="true"` 屬性。

### Q: 遙控器無法控制
**A**: 
1. 檢查是否在 TV 模式 (`?tv=1`)
2. 查看瀏覽器控制台是否有錯誤
3. 在 Chrome DevTools 中測試鍵盤事件

### Q: WebView 顯示空白
**A**:
1. 檢查 WebView 設定（JavaScript 是否啟用）
2. 檢查 URL 是否正確
3. 查看 logcat 日誌

## 📚 相關文件

- [Android TV 開發指南](https://developer.android.com/training/tv)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🔗 相關文件

- `/Users/brunoyu/Desktop/學習/MoonTV/MoonTV-Android/README.md` - Android 專案文件
- `src/components/tv/` - TV 元件源碼
- `src/lib/tv-bridge.ts` - TV Bridge 源碼
