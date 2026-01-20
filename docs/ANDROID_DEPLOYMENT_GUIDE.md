# MoonTV Android TV 部署與調試指南

> 完整的開發、測試、部署文檔
>
> 目的：方便後續測試及正式部署

---

## 📋 目錄

1. [快速開始](#快速開始)
2. [開發環境設定](#開發環境設定)
3. [多設備處理](#多設備處理)
4. [Chrome 遠程調試](#chrome-遠程調試)
5. [正式部署](#正式部署)
6. [配置調整清單](#配置調整清單)
7. [故障排除](#故障排除)

---

## 🚀 快速開始

### 前置條件

```bash
# 必要工具
- Android Studio Hedgehog 或更新版本
- JDK 17 或更新版本
- Android SDK API 34
- ADB 工具（Android SDK Platform Tools）
- PC 和 Android TV 在同一 WiFi 網路
```

### 專案結構

```
MoonTV/
├── src/                    # Web 專案（Next.js）
│   ├── app/             # 頁面路由
│   ├── components/      # React 組件
│   ├── lib/            # 工具函式
│   └── ...
├── MoonTV-Android/        # Android TV 應用
│   ├── app/
│   │   ├── src/main/java/com/moontv/android/
│   │   │   ├── MainActivity.kt              # 主活動（WebView 載入）
│   │   │   ├── WebAppInterface.kt           # JavaScript ↔ Kotlin 橋接
│   │   │   ├── bridge/                     # TV 遙控器橋接層
│   │   │   ├── tv/                         # TV 專用邏輯
│   │   │   └── utils/                      # 工具類
│   │   └── build.gradle.kts               # Gradle 配置
│   └── build.gradle.kts            # 專案配置
└── docs/                     # 文檔
```

### 架構說明

```
┌─────────────────────────────────────────────────────────┐
│                  Android TV (Chromecast)          │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │   MoonTV Android App (Kotlin)        │      │
│  │                                        │      │
│  │  ┌────────────────────────────────┐      │      │
│  │  │  WebView (Android System)    │      │      │
│  │  │                            │      │      │
│  │  │  ┌──────────────────┐      │      │      │
│  │  │  │ MoonTV Web App │      │      │      │
│  │  │  │  (Next.js)      │      │      │      │
│  │  │  │                 │      │      │      │
│  │  │  │  - API Routes  │◄─────────────┘──┘      │
│  │  │  │  - Components  │                 │
│  │  │  │  - TV Logic    │                 │
│  │  │  └───────────────┘                 │
│  │  │              ▲                        │
│  │  │         JavaScript Interface            │
│  │  └────────────────────────────────────┘      │
│  │         ▲                                  │
│  │     Remote Control (方向鍵/OK/返回)         │
│  └────────────────────────────────────────────┘      │
│         ▲                                        │
│  ┌──────────────────────────────────────────┐      │
│  │  Chrome DevTools (PC 遠程調試)     │◄─────┘
│  └──────────────────────────────────────────┘
└─────────────────────────────────────────────────┘
```

---

## 🔧 開發環境設定

### 1. Web 專案（Next.js）

#### 啟動開發伺服器
```bash
cd /Users/brunoyu/Desktop/學習/MoonTV
pnpm dev
# 或
npm run dev

# 應用後訪問
# http://localhost:3000
# TV 模式：http://localhost:3000?tv=1
```

#### 開發環境變量（可選）

創建 `.env.local`（不提交到 Git）：
```env
# 關閉密碼保護（開發時）
PASSWORD=

# 或設置密碼
PASSWORD=your_development_password

# 設置存儲類型
NEXT_PUBLIC_STORAGE_TYPE=localstorage

# 啟用註冊功能（測試用）
ENABLE_REGISTER=true
```

### 2. Android 專案

#### 啟用開發者選項（Android TV）

1. **在 Android TV 上**：
   - 設定 > 系統 > 關於 > 連續點擊「Build Number」7 次
   - 進入開發者選項
   - 啟用「USB 調試」
   - 啟用「網絡調試」

2. **配置 WiFi 調試**：
   - 設定 > 網絡與網際網路 > 網絡調試 > 啟用
   - 記下顯示的 IP 地址（例如：`192.168.1.100:5555`）

#### 啟用 WebView 調試（Android App）

修改 `MoonTV-Android/app/src/main/java/com/moontv/android/MainActivity.kt`：

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // 鎖定橫向螢幕
    requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE

    // 初始化 WebView
    webView = WebView(this)
    webAppInterface = WebAppInterface(this)

    setupWebView()
    setContentView(webView)

    // 🔧 啟用開發調試（僅 Debug 版本）
    if (BuildConfig.DEBUG) {
        WebView.setWebContentsDebuggingEnabled(true)
    }
}
```

#### 修改載入網址（本地開發）

修改 `MainActivity.kt` 第 78 行：

```kotlin
// 開發環境：載入本地 Web 專案
loadUrl("http://<YOUR_PC_IP>:3000?tv=1")

// 例如：
// loadUrl("http://192.168.1.100:3000?tv=1")

// 或保持線上：
// loadUrl("https://moontv.vercel.app?tv=1")
```

---

## 📱 多設備處理

### 查看所有已連接設備

```bash
adb devices
```

輸出範例：
```
List of devices attached
192.168.1.100:5555    device    # 設備 A（Chromecast，WiFi 連接）
abc123def456          device    # 設備 B（手機，USB 連接）
```

### 指定目標設備安裝 APK

#### 方式 A：使用 `-s` 參數（推薦）

```bash
# 1. 連接特定設備
adb connect 192.168.1.100:5555

# 2. 安裝到該設備
adb -s 192.168.1.100:5555 install app/build/outputs/apk/debug/app-debug.apk

# 3. 啟動 App
adb -s 192.168.1.100:5555 shell am start -n com.moontv.android/.MainActivity
```

#### 方式 B：使用 `-d` 參數（USB 設備）

```bash
# 安裝到最近的 USB 設備
adb -d install app/build/outputs/apk/debug/app-debug.apk
```

#### 方式 C：使用 Gradle 直接安裝

```bash
cd MoonTV-Android

# Debug 版本
./gradlew installDebug

# Release 版本
./gradlew installRelease
```

### 斷開不需要的設備

```bash
# 斷開特定設備
adb disconnect 192.168.1.100:5555

# 斷開所有設備
adb disconnect

# 重新連接目標設備
adb connect 192.168.1.100:5555
```

---

## 🔍 Chrome 遠程調試

### 方法 1：通過 WiFi 網路（推薦用於 Android TV）

#### 步驟

**1. 確認網絡環境**
```bash
# 確認 PC 和 Android TV 在同一 WiFi
# Windows
ipconfig
# macOS
ifconfig
# Linux
ip addr
```

**2. 在 Android TV 上啟用網絡調試**
- 設定 > 網絡與網際網路 > 網絡調試 > 啟用
- 記下顯示的調試端口（預設：`<IP>:5555`）

**3. 在 PC Chrome 中連接**

選項 A：直接訪問
```
http://192.168.1.100:5555
```

選項 B：使用 Chrome DevTools
```
1. 打開 Chrome
2. 訪問：chrome://inspect
3. 找到「WebViews」下的 MoonTV 設備
4. 點擊「inspect」
```

**4. 開始調試**
- 在 Chrome DevTools 的 Console 查看日誌
- 在 Elements 檢查 DOM
- 在 Network 查看網絡請求
- 在 Sources 設置斷點並除錯

### 方法 2：通過 USB 連接（推薦用於手機）

#### 步驟

**1. 連接設備**
```bash
# 啟用 USB 調試後連接
adb devices
```

**2. 檢查連接**
```bash
adb devices -l
# 應該看到設備 ID
```

**3. Chrome 連接**
```
1. 打開 chrome://inspect
2. 找到設備（顯示為序列號）
3. 點擊「inspect」
```

### 調試技巧

#### 查看 Android 日誌
```bash
# 過濾 MoonTV 相關日誌
adb logcat | grep "MoonTV\|WebView\|Chrome\|moontv"

# 過濾錯誤
adb logcat | grep -E "FATAL\|AndroidRuntime\|System.err"

# 保存日誌到文件
adb logcat > android_logs.txt
```

#### JavaScript 調試

```javascript
// 在 Web 專案中使用
console.log('🔍 Debug:', { message, data });
console.warn('⚠️ Warning:', { message, data });
console.error('❌ Error:', { message, error });

// 設置斷點
debugger;
```

#### Kotlin 調試

```kotlin
// 在 Android Studio 中設置斷點
// 在 Logcat 中輸出日誌
Log.d("MoonTV", "Debug message: $message")
Log.e("MoonTV", "Error: ${error.message}")
```

#### 網絡請求調試

在 Chrome DevTools 的 Network 標籤：
1. 篩選：`douban` 或 `api` 或 `tmdb`
2. 檢查 Request URL
3. 檢查 Response 狀態碼
4. 檢查 Response 數據
5. 檢查 Timing（載入時間）

---

## 🚀 正式部署

### Web 專案部署

#### Vercel 部署（推薦）

```bash
cd /Users/brunoyu/Desktop/學習/MoonTV

# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 登入
vercel login

# 3. 部署
vercel --prod
```

#### 其他平台部署

- **Netlify**: `netlify deploy --prod`
- **Cloudflare Pages**: `npm run pages:build`
- **自訂伺服器**：
  ```bash
  pnpm build
  # 將 .next/standalone 上傳到伺服器
  ```

### Android App 部署

#### 建構 Release APK

```bash
cd MoonTV-Android

# Debug 版本
./gradlew assembleDebug
# 輸出：app/build/outputs/apk/debug/app-debug.apk

# Release 版本（簽名 APK）
./gradlew assembleRelease
# 輸出：app/build/outputs/apk/release/app-release.apk
```

#### 分發 APK

**方式 A：直接安裝**
```bash
# 連接設備
adb connect <chromecast-ip>:5555

# 安裝
adb install app/build/outputs/apk/release/app-release.apk
```

**方式 B：Google Play 商店（未來）**
```bash
# 1. 創建簽名配置
# 在 Android Studio：Build > Generate Signed Bundle/APK

# 2. 上傳到 Google Play Console
# 填寫應用資訊、截圖、隱私政策等

# 3. 等待審核（1-3 天）
```

**方式 C：GitHub Release（測試版）**
```bash
# 1. 創建 GitHub Release
gh release create v1.0.0 \
  --title "MoonTV Android TV v1.0.0" \
  --notes "Release notes..." \
  app/build/outputs/apk/release/app-release.apk

# 2. 用戶可直接下載安裝
```

---

## ✅ 配置調整清單

### Web 專案（MoonTV）部署前檢查

#### 1. 環境變量

| 變數 | 說明 | 部署值 |
|------|------|----------|
| `PASSWORD` | 全站密碼保護 | **生產必須設置** |
| `NEXT_PUBLIC_STORAGE_TYPE` | 存儲類型 | `localstorage` 或 `redis` |
| `TMDB_API_KEY` | TMDB API 密鑰 | 建議申請自己的 |
| `NEXT_PUBLIC_SITE_NAME` | 網站名稱 | `MoonTV` |
| `NEXT_PUBLIC_ANNOUNCEMENT` | 公告內容 | 可選 |

#### 2. 配置文件檢查

- ✅ `config.json` 中的 API 來源是否有效
- ✅ 下一頁數據庫連接是否正確（如使用 Redis）
- ✅ 下一頁數據庫密碼是否設置（如使用）

#### 3. 下一頁數據庫

```bash
# 檢查 Redis 連接
redis-cli ping
# 應回應：PONG
```

### Android App 部署前檢查

#### 1. 版本更新

**文件**：`MoonTV-Android/app/build.gradle.kts`

```kotlin
android {
    defaultConfig {
        applicationId = "com.moontv.android"
        versionCode = 1        // 🔧 每次發布 +1
        versionName = "1.0.0"   // 🔧 更新版本號
    }
}
```

#### 2. 載入網址更新（推薦使用配置）

**文件**：`MoonTV-Android/app/src/main/java/com/moontv/android/MainActivity.kt`

**方式**：使用 BuildConfig 配置（推薦✅）

```kotlin
// 第 78 行已自動從 build.gradle.kts 讀取
loadUrl("${BuildConfig.MOONTV_URL}?tv=1")
```

**配置 URL（三種方式，詳見 [URL_CONFIG_GUIDE.md](../MoonTV-Android/URL_CONFIG_GUIDE.md)）：

**方式 A：全局配置（所有開發者）**
```properties
# MoonTV-Android/gradle.properties
MOONTV_URL=https://moontv.vercel.app
```

**方式 B：本地開發配置（推薦）**
```properties
# MoonTV-Android/gradle.properties.local（不會被 Git 追蹤）
MOONTV_URL=http://192.168.1.100:3000
```

**方式 C：命令行臨時指定（測試用）**
```bash
./gradlew assembleDebug -PMOONTV_URL=http://192.168.1.100:3000
```

**優先級**：
1. 命令行參數（最高）
2. `gradle.properties.local`（本地開發）
3. `gradle.properties`（全局配置）
4. `build.gradle.kts` 默認值（最低）

#### 2. 載入網址更新

**文件**：`MoonTV-Android/app/src/main/java/com/moontv/android/MainActivity.kt`

**方式**：使用 BuildConfig 配置（推薦✅）

```kotlin
// 第 78 行已自動從 build.gradle.kts 讀取
loadUrl("${BuildConfig.MOONTV_URL}?tv=1")
```

**配置 URL**（三種方式）：

**方式 A：修改 gradle.properties（全局生效）**
```properties
# MoonTV-Android/gradle.properties
MOONTV_URL=https://moontv.vercel.app
```

**方式 B：使用本地配置文件（開發用，不提交到 Git）**
```properties
# MoonTV-Android/gradle.properties.local
MOONTV_URL=http://192.168.1.100:3000
```

**方式 C：通過命令行臨時指定**
```bash
cd MoonTV-Android
./gradlew assembleDebug -PMOONTV_URL=http://192.168.1.100:3000
```

#### 3. 簽名配置（正式版）

如需發布到 Google Play：

```bash
# 1. 生成簽名密鑰
keytool -genkey -v -keystore moontv-release.keystore -alias moontv-keyalg RSA -keysize 2048 -validity 10000

# 2. 在 build.gradle.kts 中配置簽名
signingConfigs {
    create("release") {
        storeFile = file("moontv-release.keystore")
        storePassword = "your_store_password"
        keyAlias = "moontv"
        keyPassword = "your_key_password"
    }
}

# 3. 使用簽名建構
./gradlew assembleRelease
```

#### 4. 開發者選項關閉

**檢查清單**：
- [ ] 禁用 `WebView.setWebContentsDebuggingEnabled(true)`
- [ ] 移除測試 `loadUrl`（改為正式網址）
- [ ] 檢查無 `console.log` 遺留（生產環境）
- [ ] 確認 BuildConfig.DEBUG 為 false（Release）

---

## 🐛 故障排除

### Web 專案常見問題

#### 問題 1：API 請求失敗
```bash
# 檢查 API 可用性
curl https://api.themoviedb.org/3/search/multi?api_key=xxx&query=test

# 解決方案：
# 1. 檢查 API 密鑰是否有效
# 2. 檢查網絡連接
# 3. 查看瀏覽器 Console 錯誤
```

#### 問題 2：圖片載入失敗

**症狀**：圖片顯示空白或錯誤圖示

**檢查步驟**：
```bash
# 1. 檢查 API 日誌（在瀏覽器 Console 查看）
# 應該看到：
# ✅ TMDB 替換成功: { originalTitle, newUrl }
# 或
# ⚠️ TMDB 未找到結果: { title, year }

# 2. 檢查 next.config.js 配置
# images.remotePatterns 是否包含所有域名

# 3. 檢查 Next.js Image 組件
# VideoCard.tsx 第 2 行：import Image from 'next/image'
```

**解決方案**：
```javascript
// 確保 next.config.js 配置正確
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**' },
    { protocol: 'http', hostname: '**' },
  ],
}
```

#### 問題 3：TV 模式不工作

**症狀**：方向鍵無法控制 Focus

**檢查步驟**：
```bash
# 1. 檢查 URL 是否包含 ?tv=1
http://localhost:3000?tv=1

# 2. 檢查 TVFocusContext 是否正確初始化
# src/components/tv/TVFocusContext.tsx

# 3. 在 Chrome DevTools Console 測試
window.AndroidTV.dispatchKeyEvent(19, 0)  // UP
window.AndroidTV.dispatchKeyEvent(20, 0)  // DOWN
```

### Android App 常見問題

#### 問題 1：ADB 無法連接

```bash
# 1. 檢查 Android TV 開發者選項
# 確認：USB 調試和網絡調試都已啟用

# 2. 檢查 WiFi 連接
# ping <android-tv-ip>

# 3. 重啟 ADB
adb kill-server
adb start-server
adb connect <android-tv-ip>:5555
```

#### 問題 2：Chrome DevTools 無法連接

```bash
# 1. 檢查 Chrome 版本（需 32 或更新）
chrome://version

# 2. 檢查 WebView 版本
# 設定 > 關於 Chrome

# 3. 重啟 Android TV
adb shell am force-stop com.moontv.android
adb shell am start -n com.moontv.android/.MainActivity
```

#### 問題 3：WebView 白屏

```bash
# 1. 檢查載入網址是否正確
# adb logcat | grep MoonTV

# 2. 檢查 JavaScript 是否啟用
# MainActivity.kt: javaScriptEnabled = true

# 3. 檢查網絡權限
# AndroidManifest.xml: INTERNET 權限必須
```

---

## 📊 開發流程總結

### 完整開發循環

```
1. 修改 Web 專案代碼
   ↓
2. 在 PC Chrome 中修改並測試（本地）
   ↓
3. 在 Android TV 上測試（遠程調試）
   ↓
4. 修改 Android App 代碼（如需要）
   ↓
5. 重新安裝並測試
   ↓
6. 提交 Git commits
   ↓
7. 重複步驟 1-6
```

### Git 工作流程建議

```bash
# 1. Web 專案分支
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"

# 2. Android 專案分支
cd MoonTV-Android
git checkout -b feature/android-update
git add .
git commit -m "feat: update WebView configuration"

# 3. 合併與發布
git checkout main
git merge feature/new-feature
git tag v1.0.0
git push origin main
```

---

## 📚 參考資源

### Web 開發
- [Next.js 文檔](https://nextjs.org/docs)
- [Next.js Image 組件](https://nextjs.org/docs/api-reference/next/image)
- [React 文檔](https://react.dev)

### Android 開發
- [Android TV 開發指南](https://developer.android.com/training/tv)
- [WebView 文檔](https://developer.android.com/guide/webapps/webview)
- [ADB 文檔](https://developer.android.com/studio/command-line/adb)

### 調試工具
- [Chrome DevTools](https://developer.chrome.com/docs/devtools)
- [ADB 快速參考](https://developer.android.com/studio/command-line/adb)

---

## 📝 部署檢查清單（最終版）

### Web 專案
- [ ] 所有功能在本地測試通過
- [ ] 圖片優化功能啟用（`unoptimized: false`）
- [ ] 豆瓣圖片替換功能正常
- [ ] TV 模式功能正常
- [ ] 環境變量設置正確
- [ ] 構建成功（`pnpm build`）
- [ ] 部署到生產環境（Vercel 或其他）
- [ ] 生產環境測試通過

### Android App
- [ ] 載入網址更新為正式 URL
- [ ] 版本號更新（versionCode 和 versionName）
- [ ] Debug 選項已關閉
- [ ] WebView 調試已禁用
- [ ] Release APK 構建成功
- [ ] APK 在 Android TV 上測試通過
- [ ] 所有遙控器功能正常
- [ ] WebView 與 Web 專案通信正常
- [ ] 準備好分發

---

**文檔版本**: 1.0
**最後更新**: 2026-01-20
**維護者**: MoonTV 開發團隊
