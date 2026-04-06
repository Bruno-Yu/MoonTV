# MoonTV URL 配置快速指南

> 快速更改 Android App 載入的 MoonTV 網址

---

## 🎯 三種配置方式

### 方式 1：全局配置（所有開發者）

修改項目級別的 `gradle.properties`（會提交到 Git）

```properties
# MoonTV-Android/gradle.properties
MOONTV_URL=https://moontv.vercel.app
```

**使用場景**：

- ✅ 團隊開發（所有成員使用同一配置）
- ✅ 正式部署
- ⚠️ 會被 Git 追蹤

---

### 方式 2：本地開發配置（推薦）

修改 `gradle.properties.local`（不會提交到 Git）

```properties
# MoonTV-Android/gradle.properties.local
MOONTV_URL=http://192.168.1.100:3000
```

**使用場景**：

- ✅ 個人開發（不影響他人）
- ✅ 本地測試
- ✅ 已在 `.gitignore` 中（自動忽略）

**切換方式**：

```bash
# 開發時
cp gradle.properties.local.example gradle.properties.local

# 正式部署時
# （不使用 .local 文件，使用 gradle.properties 的線上地址）
```

---

### 方式 3：命令行臨時指定（測試用）

構建時臨時覆蓋配置：

```bash
# Debug 版本
cd MoonTV-Android
./gradlew assembleDebug -PMOONTV_URL=http://192.168.1.100:3000

# Release 版本
./gradlew assembleRelease -PMOONTV_URL=https://moontv.vercel.app
```

**使用場景**：

- ✅ CI/CD 流水線
- ✅ 快速測試不同環境
- ✅ 不修改任何文件

---

## 📋 配置優先級

Gradle 按以下優先級讀取配置：

| 優先級       | 配置位置                         | 說明               |
| ------------ | -------------------------------- | ------------------ |
| **1 (最高)** | 命令行參數                       | `-PMOONTV_URL=...` |
| **2**        | `gradle.properties.local`        | 本地開發配置       |
| **3**        | `gradle.properties`              | 項目級別配置       |
| **4 (最低)** | `build.gradle.kts` defaultConfig | 代碼中的默認值     |

---

## 🔧 開發環境設置範例

### 場景 A：本地開發 + PC 遠程調試

```bash
# 1. 啟動 Web 專案（在另一終端）
cd /Users/brunoyu/Desktop/學習/MoonTV
pnpm dev

# 2. 配置 Android 使用本地開發環境
# 編輯 MoonTV-Android/gradle.properties.local：
MOONTV_URL=http://192.168.1.100:3000

# 3. 構建並安裝
cd MoonTV-Android
./gradlew installDebug

# 4. 在 PC Chrome 中連接
chrome://inspect
# 找到 Android TV 設備並點擊 inspect
```

### 場景 B：測試生產環境

```bash
# 不使用 .local 文件，讓它使用 gradle.properties 中的線上地址

# 構建並安裝
cd MoonTV-Android
./gradlew installRelease

# Android TV 會載入：
# https://moontv.vercel.app
```

### 場景 C：快速切換多個測試環境

```bash
# 創建多個配置文件
cp gradle.properties.local.example gradle.properties.local.staging
cp gradle.properties.local.example gradle.properties.local.production

# 使用不同配置
./gradlew assembleDebug -PGRADLE_USER_HOME=../gradle.properties.local.staging
```

---

## 🚀 快速命令

```bash
# 查看當前配置
grep MOONTV_URL MoonTV-Android/gradle.properties

# 查看本地配置（優先級更高）
grep MOONTV_URL MoonTV-Android/gradle.properties.local

# 清除並重新構建
cd MoonTV-Android
./gradlew clean
./gradlew assembleDebug

# 安裝到 Chromecast
adb connect <chromecast-ip>:5555
adb install app/build/outputs/apk/debug/app-debug.apk

# 啟動 App
adb shell am start -n com.moontv.android/.MainActivity
```

---

## 📝 配置文件說明

| 文件                              | 用途                   | Git 追蹤            |
| --------------------------------- | ---------------------- | ------------------- |
| `gradle.properties`               | 全局配置，默認線上環境 | ✅ 是               |
| `gradle.properties.local`         | 個人開發配置           | ❌ 否（.gitignore） |
| `gradle.properties.local.example` | 配置範本               | ✅ 是（供參考）     |
| `build.gradle.kts`                | 默認值配置             | ✅ 是               |

---

## ⚠️ 重要提示

1. **不要提交敏感信息**：

   ```bash
   # ✅ 正確
   gradle.properties.local
   本地 IP、開發密碼等

   # ❌ 錯誤
   gradle.properties
   生產密鑰、敏感配置
   ```

2. **構建後驗證配置**：

   ```bash
   # 檢查 APK 中嵌入的值
   aapt dump badging app/build/outputs/apk/debug/app-debug.apk | grep MOONTV_URL
   ```

3. **使用相對路徑**（開發時）：

   ```properties
   # ✅ 正確（同一局域網）
   MOONTV_URL=http://192.168.1.100:3000

   # ❌ 錯誤（可能無法訪問）
   MOONTV_URL=http://localhost:3000
   ```

---

## 🔍 故障排除

### 問題：APK 還是舊的 URL

**原因**：使用緩存或未重新構建

**解決**：

```bash
cd MoonTV-Android
./gradlew clean
./gradlew assembleDebug
```

### 問題：配置未生效

**原因**：.local 文件優先級問題

**檢查步驟**：

```bash
# 1. 確認文件存在
ls -la MoonTV-Android/gradle.properties.local

# 2. 檢查文件內容
cat MoonTV-Android/gradle.properties.local

# 3. 重新構建
./gradlew clean assembleDebug
```

### 問題：多設備安裝到錯誤環境

**解決**：

```bash
# 1. 先連接目標設備
adb connect <target-ip>:5555

# 2. 指定設備安裝
adb -s <target-ip>:5555 install app/build/outputs/apk/debug/app-debug.apk
```

---

**文檔版本**: 1.0
**最後更新**: 2026-01-20
**適用於**: MoonTV Android TV App v1.0.0+
