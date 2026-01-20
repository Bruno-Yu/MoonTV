# MoonTV TV 模式快速開始指南

## 🎯 什麼是 MoonTV TV 模式？

MoonTV TV 模式允許你在 Chromecast with Google TV (第 2 代) 和其他 Android TV 設備上使用遙控器操作 MoonTV，享受電視級的觀影體驗！

## ⚡ 快速開始（3 步驟）

### 步驟 1: 準備 Android 設備

1. **Chromecast with Google TV (第 2 代)**
   - 啟用開發者選項
   - 啟用 USB 調試
   - 連接電腦和電視

2. **其他 Android TV 設備**
   - 啟用「未知來源」安裝
   - 準備 USB 數據線

### 步驟 2: 安裝 MoonTV App

**選項 A: 從電腦安裝（推薦）**
```bash
cd MoonTV-Android

# 構建 APK
./gradlew assembleDebug

# 安裝到設備
./gradlew installDebug
```

**選項 B: 下載 APK 直接安裝**
1. 下载 `app-debug.apk` 到電視
2. 打開 APK 文件
3. 允許安裝來自未知來源的應用

**選項 C: 用 Android Studio**
1. 用 Android Studio 打開 `MoonTV-Android` 專案
2. 連接 Android 設備
3. 點擊 Run 按鈕

### 步驟 3: 開始使用

1. 打開 **MoonTV** 應用
2. 使用遙控器方向鍵選擇內容
3. 按確認鍵進入/播放

## 🎮 遙控器操作指南

### 基礎操作

| 按鍵 | 功能 |
|-------|------|
| ◀ ▶ | 左右移動 Focus |
| ▲ ▼ | 上下移動 Focus |
| ⏎ (確認) | 選擇/播放 |
| ◀◀ (返回) | 返回上一頁 |

### 快捷功能

| 按鍵 | 功能 |
|-------|------|
| 首頁鍵 | 返回首頁 |
| 語音鍵 | 語音搜索（開發中） |
| Netflix | 快捷導航到 Netflix |
| YouTube | 快捷導航到 YouTube |

## 📱 主要功能

### 1. 首頁 Grid 佈局
- **繼續觀看** - 從上次播放位置繼續
- **熱門電影** - 最新熱門電影
- **熱門劇集** - 最新熱門劇集
- **收藏夾** - 你收藏的影片
- **豆瓣 Top250** - 評分最高影片
- **搜尋** - 搜索你想要的內容

### 2. 搜尋功能
- 虛擬數字鍵盤輸入
- 語音搜索（開發中）
- 搜索結果分頁顯示

### 3. 精簡導航
只有 6 個主要功能，用遙控器快速切換！

## 🔧 自定義設置

### 修改 MoonTV 網址

如果你有自己的 MoonTV 伺服器：

```kotlin
// 編輯 MoonTV-Android/app/src/main/java/.../MainActivity.kt
loadUrl("https://your-moontv-url.com?tv=1")
```

然後重新構建：
```bash
./gradlew assembleDebug
./gradlew installDebug
```

### 修改 User Agent

```kotlin
// MainActivity.kt
settings.userAgentString = "MoonTV-AndroidTV/1.0 (Android TV)"
```

## 🧪 測試你的安裝

### 測試遙控器
```bash
# 連接到電視
adb connect <TV-IP>:5555

# 模擬按鍵
adb shell input keyevent 19  # 上
adb shell input keyevent 20  # 下
adb shell input keyevent 23  # 確認
```

### 查看日誌
```bash
adb logcat | grep "MoonTV"
```

### 在電腦瀏覽器測試
```
http://localhost:3000?tv=1
```

## ❓ 常見問題

### Q: 遙控器無法控制？
**A**: 
1. 確認 App 已經啟動
2. 檢查遙控器電量
3. 重新連接藍牙遙控器
4. 重啟 App

### Q: 畫面顯示空白？
**A**:
1. 檢查網絡連接
2. 確認 MoonTV 網址正確
3. 查看 Android 設置中的網絡權限
4. 清除 App 緩存並重啟

### Q: 如何更新 App？
**A**:
```bash
cd MoonTV-Android
git pull
./gradlew assembleDebug
./gradlew installDebug
```

### Q: 可以播放 4K 視頻嗎？
**A**: 可以！Chromecast with Google TV (第 2 代) 支援 4K HDR 視頻播放。

### Q: 支援字幕嗎？
**A**: 支援！在播放頁面可以選擇字幕語言。

## 🎨 Focus 視覺效果

被選中的元素會有：
- 🟢 **綠色外框** - 清晰標示當前選擇
- 📏 **放大效果** - 元素放大 5%
- 🌑 **陰影** - 提升視覺層次

## 🚀 進階功能

### 鍵盤快捷鍵（在電腦上測試）
- 方向鍵 - 移動 Focus
- Enter - 確認
- Esc - 返回

### 語音搜索（開發中）
按語音鍵並說出你想要搜索的內容。

### 深色模式
自動根據系統設置切換深色/淺色主題。

## 📞 需要幫助？

- 查看 [TV 開發文檔](./TV-DEVELOPMENT.md)
- 查看 [整合總結](./TV-INTEGRATION.md)
- 查看 [Android 專案 README](../MoonTV-Android/README.md)

## ✨ 特色亮點

- ✅ **完整遙控器支援** - 上下左右、確認、返回
- ✅ **Grid 佈局** - 減少導航步驟
- ✅ **自動滾動** - Focus 元素自動居中
- ✅ **大尺寸卡片** - 適合電視觀看
- ✅ **清晰 Focus 樣式** - 綠色外框 + 放大
- ✅ **精簡導航** - 只有 6 個主要功能
- ✅ **原生體驗** - 全螢幕無邊框

---

**享受在電視上觀看 MoonTV！🎬**
