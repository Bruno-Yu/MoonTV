# MoonTV Android TV App

Chromecast with Google TV 專用 WebView 應用，使用遙控器控制 MoonTV 網頁。

## 📋 專案結構

```
MoonTV-Android/
├── app/
│   ├── src/main/
│   │   ├── java/com/moontv/android/
│   │   │   ├── MainActivity.kt              # 主活動
│   │   │   ├── WebAppInterface.kt           # JS <-> Kotlin 橋接
│   │   │   ├── bridge/                     # 橋接層
│   │   │   ├── tv/                         # TV 專用邏輯
│   │   │   └── utils/                      # 工具類
│   │   ├── res/                           # 資源文件
│   │   └── AndroidManifest.xml            # 權限配置
│   ├── build.gradle.kts                    # Gradle 配置
│   └── proguard-rules.pro                 # ProGuard 規則
├── build.gradle.kts                        # 專案配置
└── settings.gradle.kts
```

## 🔧 開發環境

### 必要工具

- Android Studio Hedgehog 或更新版本
- JDK 17 或更新版本
- Android SDK API 34

### 安裝步驟

```bash
# 1. 克隆專案
git clone <repository-url>

# 2. 用 Android Studio 打開專案
open MoonTV-Android

# 3. 同步 Gradle
./gradlew build

# 4. 連接設備並安裝
adb devices
./gradlew installDebug
```

## 🎯 功能特性

### 遙控器支援

- ✅ 方向鍵 (上下左右) - Focus 導航
- ✅ 確認鍵 (OK) - 選擇/播放
- ✅ 返回鍵 - 返回上一頁
- ✅ 首鍵 - 返回首頁
- ✅ 語音鍵 - 語音搜索

### WebView 整合

- ✅ 完整攔截遙控器事件
- ✅ JavaScript ↔ Kotlin 橋接
- ✅ 自動滾動 Focus 元素
- ✅ 全螢幕體驗

## 📱 構建與發布

### Debug 版本

```bash
./gradlew assembleDebug
# 輸出: app/build/outputs/apk/debug/app-debug.apk
```

### Release 版本

```bash
./gradlew assembleRelease
# 輸出: app/build/outputs/apk/release/app-release.apk
```

### 安裝到設備

```bash
# Debug 版本
adb install app-debug.apk

# Release 版本
adb install app-release.apk

# 或直接用 Gradle
./gradlew installDebug
```

## 🔗 WebView Bridge API

### JavaScript 調用 Kotlin

```javascript
// 分發按鍵事件
window.AndroidTV.dispatchKeyEvent(19, 0); // UP key, ACTION_DOWN

// 請求 Focus
window.AndroidTV.requestFocus();

// 獲取設備資訊
const deviceInfo = JSON.parse(window.AndroidTV.getDeviceInfo());
```

### Kotlin 調用 JavaScript

```kotlin
webView.evaluateJavascript("moveFocus('up')") { value ->
    // 處理結果
}
```

## 🧪 測試

### 遙控器測試

```bash
# 模擬按鍵事件
adb shell input keyevent 19  # DPAD_UP
adb shell input keyevent 20  # DPAD_DOWN
adb shell input keyevent 21  # DPAD_LEFT
adb shell input keyevent 22  # DPAD_RIGHT
adb shell input keyevent 23  # DPAD_CENTER
```

### 查看日誌

```bash
adb logcat | grep "MoonTV"
```

## 📄 配置說明

### 修改 MoonTV 網址

```kotlin
// MainActivity.kt
loadUrl("https://your-moontv-url.com?tv=1")
```

### 修改 User Agent

```kotlin
// MainActivity.kt
settings.userAgentString = "MoonTV-AndroidTV/1.0 (Android TV)"
```

## 🔐 權限說明

| 權限                 | 用途          |
| -------------------- | ------------- |
| INTERNET             | 網絡訪問      |
| ACCESS_NETWORK_STATE | 網絡狀態檢測  |
| ACCESS_WIFI_STATE    | WiFi 設備檢測 |

## 📝 開發注意事項

1. **TV 螢幕方向**: 強制橫向 (`SCREEN_ORIENTATION_LANDSCAPE`)
2. **JavaScript 安全**: 使用 `@JavascriptInterface` 註解
3. **WebView 設定**: 已針對 TV 優化
4. **返回鍵處理**: 先檢查 WebView 後退歷史

## 🚀 部署到 Chromecast

### 方式 1: USB 安裝

```bash
# 1. 啟用開發者選項
# 2. 啟用 USB 調試
# 3. 連接 USB
# 4. 安裝 APK
adb install app-debug.apk
```

### 方式 2: Sideload (從網頁)

1. 上傳 APK 到網頁
2. 在 Chromecast 上開開網頁並下載
3. 安裝 APK

### 方式 3: Android Studio 直接部署

1. 連接設備
2. 點擊 Run 按鈕
3. 自動安裝並啟動

## 📚 參考資料

- [Android TV 開發指南](https://developer.android.com/training/tv)
- [WebView 文檔](https://developer.android.com/guide/webapps/webview)
- [JavaScript Interface](https://developer.android.com/guide/webapps/webview/bindings/javascript)

## 📄 授權

MIT License - 與 MoonTV Web 專案保持一致
