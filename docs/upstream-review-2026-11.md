# MoonTV：搜尋修復、upstream 評估、正式版設定比對（2026-11）

- 撰寫：claude-code@mini，2026-11-07
- 分支：`Bruno-Yu/moontv-search-upstream`（從 `origin/main` 6a4594f 開出）
- upstream：`samqin123/MoonTV` main（領先 186 個 commit，其中 21 個是 merge）。分岔點是 3fba530（2025-07-10）
- Bruno 領先 20 個 commit

---

## 一、搜尋壞掉的原因（任務 A）

**結論：不是 API 的問題，是 Bruno 版本自己的回歸（regression）。**

| 項目                   | 內容                                                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症狀                   | 搜尋熱門片名，畫面顯示沒有結果；API 回 200                                                                                                                                                                      |
| 原因                   | `src/lib/downstream.ts` 抓第 2 頁以後的結果時，寫成 `results.push(...additionalResults.filter(...))`，推進去的是「整頁陣列」，不是個別項目。API 回應因此混入 `{"0": {...}, "1": {...}}` 這種沒有 `title` 的物件 |
| 為什麼會變成「沒結果」 | 搜尋頁排序時呼叫 `a.title.includes()`，丟出 TypeError，被 `catch` 吃掉後結果被設成空陣列                                                                                                                        |
| 觸發條件               | 任何一個來源的結果超過 1 頁就會發生（熱門片名幾乎都會）                                                                                                                                                         |
| 回歸來源               | commit 36f3754（2026-01-20，Android TV 那次）。原作者的版本一直是正確的 forEach 寫法，**upstream 沒有這個 bug**                                                                                                 |
| 修正                   | commit 8559961：逐頁攤平合併；把繁轉簡抽成 `normalizeSearchQuery()`；補了測試                                                                                                                                   |

已排除的方向（有證據）：

- **來源 API**：23 個來源裡有 15 個用簡體查詢正常回 JSON，並沒有全部失效。壞掉的來源在下面另外列出。
- **API token**：正式版沒有設 `API_SECRET`，所以 token 過期造成 401 的假設不成立。
- **D1 或認證 cookie**：`/api/search` 不需要登入，也不讀寫 D1。

已驗證（本機 `next dev`）：

- `pnpm test` 9/9 通過。合併測試在修正前的程式碼上會失敗，而且失敗的樣子跟正式版一樣。
- `pnpm typecheck` 通過；`pnpm lint` 0 error（警告都是原本就有的）。
- 在瀏覽器輸入「進擊的巨人」，送出的是 `q=进击的巨人`，畫面列出 215 筆結果，沒有錯誤。

**正式版直接證實**（2026-11-07）：正式部署的 hash 網址沒有被 Access 保護（見第三節）。從那裡打 `/api/search?q=海贼王`，回 182 筆，其中 4 筆沒有片名，跟本機修正前一模一樣。

**本機 Cloudflare 執行環境（`pnpm pages:build` 加上 `wrangler pages dev`）驗證過**：修正後「海贼王」連續多次都是 220 筆、13 個來源、0 筆壞資料。

### 第二次追加的修正（Bruno 授權「你決定」之後）

| commit  | 問題                                                                                                                                                               | 修正                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| dadbbae | 只有網頁搜尋框會做繁轉簡。TV 搜尋頁、搜尋歷史、`?q=` 網址、`/api/search/one` 都送出原字。正式版實測：「進擊的巨人」只有 **1 個來源**有結果，「进击的巨人」有 13 個 | 在伺服器端的 `searchFromApi` 統一轉簡體，所有入口都涵蓋。`/api/search/one` 的精確比對也改用簡體。畫面顯示不變 |
| 080af86 | 空結果也被設成 `public, max-age=7200`。只要有一次暫時性失敗，同一個搜尋 2 小時內都會顯示「沒有結果」                                                               | 空結果改成 `no-store`                                                                                         |

本機 workerd 驗證：繁體「進擊的巨人」從 1 個來源變成 13 個來源、267 筆；`/api/search/one?q=海賊王` 從 404 變成 200。

### 尚未查明（等 preview 部署再量）

本機 workerd 大約 15 次請求裡有 2 次，所有來源同時在 8 秒逾時，最後 0 筆。之後沒有再重現。正式環境的 Workers 每個請求最多同時開 6 條對外連線，但本機不會模擬這個限制（我實驗過）。正式版用「海贼王」實測時，13 個來源都有成功，所以目前沒有證據顯示線上會因此遺失來源。這次不針對它修改。

### 順帶發現（這次沒有修，請 Bruno 決定）

1. **失效的來源**（2026-11-07，Mac mini 和本機 workerd 結果一致）：

   - DNS 查不到：dbzy、fczy888
   - 連線中斷：mozhua
   - 403：yinghua、wujin
   - 回 HTML，不是 JSON：heimuer、wolong、wwzy
   - 回「暫不支援搜索」：tyyszy、suoni

   workerd 的 log 顯示它們都是「立刻失敗」，不會拖慢搜尋，所以這次沒有移除。

2. 搜尋框送出後會把框裡的字換成簡體（`setSearchQuery(trimmed)`），結果的片名也是簡體顯示。這跟「畫面一律顯示繁體」不一致，但這是原本就有的行為，這次沒有改。
3. 送出一次搜尋會打兩次 `/api/search`：一次是表單送出，一次是網址參數變動觸發的 effect。這是原本就有的。

---

## 二、upstream 186 個 commit 依功能分組（任務 B）

評估標準：

- **幫助**：對 Bruno 的版本有沒有用
- **衝突**：跟 Bruno 那 20 個 commit 的衝突程度
- **風險／工作量**：引進後可能出的問題，以及大概要花多少力氣

先說最重要的背景：**upstream 和 Bruno 各自做了一套 D1 儲存，彼此不相容。** upstream 也把設定系統改成非同步，而且可以在後台編輯。很多 UI 功能都依賴這兩個底層改動，所以不能整包 merge。

兩邊都改過的檔案共 40 個，其中衝突最重的是：

| 檔案                      | upstream 改動    | Bruno 改動       |
| ------------------------- | ---------------- | ---------------- |
| `src/lib/d1.db.ts`        | 兩邊都是新增檔案 | 兩邊都是新增檔案 |
| `src/lib/db.client.ts`    | +1212            | 小改             |
| `src/lib/config.ts`       | +316/−121        | +34              |
| `src/app/admin/page.tsx`  | +774             | 重寫             |
| `src/middleware.ts`       | 有改             | +123             |
| `src/app/play/page.tsx`   | +786             | 小改             |
| `src/app/search/page.tsx` | +172             | 繁轉簡           |

### 分組總表

| #   | 分組                                                          | 約幾個 commit | 幫助   | 衝突     | 風險／工作量 | 建議            |
| --- | ------------------------------------------------------------- | ------------- | ------ | -------- | ------------ | --------------- |
| G1  | 影音來源與搜尋 API                                            | 10            | 中     | 低～中   | 低／小       | **建議挑部分**  |
| G2  | 播放頁功能（跳過片頭片尾、解析度、測速、選集）                | 20            | 高     | 中       | 中／中       | 可以考慮        |
| G3  | 年份處理                                                      | 10            | 低～中 | 中       | 中／小       | 跟 G2 一起考慮  |
| G4  | VideoCard 與 UI 樣式、iOS 安全區域                            | 25            | 中     | 高       | 中／中       | 只挑小的修正    |
| G5  | 豆瓣頁改版、自訂分類                                          | 12            | 中     | 低～中   | 中／中       | 可以考慮        |
| G6  | 儲存層：upstream 版 D1、Upstash、本機快取、設定改非同步、cron | 30            | 低     | **很高** | **高／大**   | **不建議**      |
| G7  | 使用者與後台管理（改密碼、刪使用者、角色、401 自動導向登入）  | 15            | 中     | 高       | 高／大       | 只挑 401 導向   |
| G8  | 全域圖片代理、豆瓣代理                                        | 5             | 低     | 中       | 中／小       | 不建議          |
| G9  | 版本檢查                                                      | 4             | 低     | 低       | 低／小       | 不建議          |
| G10 | 建置、CI、Docker、Tailwind v4（已撤回）、README               | 35            | 低     | 中       | 低／小       | 不建議          |
| G11 | 黃色內容過濾                                                  | 2             | 看需求 | 低       | 低／小       | 看 Bruno 要不要 |

（commit 數是依訊息分類的約略數字，merge commit 不算。）

### G1 影音來源與搜尋 API（跟任務 A 最相關）

- **內容**
  - 新增來源：maotaizy、lzi（量子）、xiaomaomi
  - 移除 iqiyi
  - ruyi 改成 `http://`（b0312ef "fix: ruyi fail"）
  - 搜尋 API 加上 CDN 快取標頭（`s-maxage`、`CDN-Cache-Control`）
  - `SearchResult` 去重（ce8a01c）
  - 修 `search_title` 是 null 的情況（1e2f05b）
  - 播放頁換源搜尋最佳化（1490c06）
- **跟 A 的關係**：upstream **沒有修過**這次的合併 bug，他們的程式碼本來就是對的。upstream 修過的是 ruyi 來源，以及設定合併的邏輯。
- **新來源實測**（2026-11-07）：
  - lzi：正常，一次回 20 筆
  - maotaizy：有回應，但沒有結果
  - xiaomaomi：DNS 查不到
  - ruyi：用 https 現在也正常
  - iqiyi：upstream 移除了，但在 Bruno 這邊還是正常的
- **幫助**：加入 lzi 有實際幫助。CDN 快取標頭對 Cloudflare 有幫助，但正式版前面有 Cloudflare Access，效果要另外評估。
- **衝突**：`config.json` 只要手動加一筆就好。搜尋 API 的改動依賴 G6 的非同步 `getConfig`，不能直接 cherry-pick，要手動改寫。
- **工作量**：小（大約 1 小時以內）。

### G2 播放頁功能

- **內容**
  - 跳過片頭片尾，並可跨裝置同步（58ca3ef、b5e351b、05cb6ca、5497407、d47b72a）
  - 解析度與測速資訊、2K/4K 標示（a858a51、868ec2d、4358bb2、0ab4115、b24a676）
  - 載入階段動畫（db217eb）
  - 選集可以倒序（fc24055）
  - 記住播放速度（6989d5e）
  - 跳到最後一集的修正（10f2dc1）
  - 優選來源（367ad8a、d6467db、af2d257、cca4092）
- **幫助**：高，都是看片時直接感受得到的功能。
- **衝突**：Bruno 對 `play/page.tsx` 只有小改，但「跳過片頭片尾的設定」要存進儲存層。upstream 存在他們自己的 D1／Redis 結構裡，Bruno 的 D1 要另外加資料表和 API。Android TV 的焦點控制（Bruno 的 TV 元件）也要一起測。
- **風險／工作量**：中。建議拆成兩批：「純前端」（解析度、測速、倒序、播放速度）和「需要儲存」（跳過片頭片尾）。

### G3 年份處理

- **內容**：從詳情頁抽出年份、存進資料庫、搜尋結果把年份傳給 VideoCard、豆瓣資料帶年份。
- **衝突**：upstream 把 `getDetailFromApi` 的回傳型別從 `VideoDetail` 改成 `SearchResult`，牽涉到詳情 API 和播放頁。
- **建議**：只有在引進 G2 的時候一起帶進來。

### G4 VideoCard 與 UI 樣式

- **內容**
  - 卡片 hover 動畫、Safari 的修正
  - 圓角 icon、z-index
  - 回到頂端按鈕（090d10e）
  - iOS PWA 底部安全區域（08c979c、193902a）
  - 行動版導覽寬度
- **衝突**：高。Bruno 改過 `VideoCard`、`Sidebar`、`MobileBottomNav`（繁體文字、圖示、TV 版）。
- **建議**：只挑「iOS 安全區域」和「回到頂端」這兩個小修正，手動移植。

### G5 豆瓣頁改版

- **內容**：新的豆瓣頁和分類選擇器（e152117 等）、自訂分類（ed96ee0、636f408、a5a4e9f）、熱門節目。
- **衝突**：Bruno 對 `douban/page.tsx` 幾乎沒改，但改過 `api/douban`（海報改用 TMDB）。自訂分類依賴 G6 的後台設定。
- **工作量**：中。選擇器改版本身可以獨立引進。

### G6 儲存層與設定系統（最大的衝突來源）

- **內容**
  - upstream 版 D1（e27fdb7 等約 15 個 commit）
  - Upstash Redis（ac1cd7b）
  - 本機快取（b614308、1626cca）
  - `getConfig` 改成非同步，設定可以從資料庫覆寫（c325cfa→7ee0edb→a26f19f、00341d8）
  - 自訂設定（7b6867e）
  - Vercel／Docker cron
- **跟 Bruno 版本的根本差異**：

  | 項目          | upstream                | Bruno                               |
  | ------------- | ----------------------- | ----------------------------------- |
  | D1 綁定名稱   | `process.env.DB`        | `getRequestContext().env.moontv_db` |
  | 密碼儲存      | 以**明文**存在 users 表 | HMAC 驗證                           |
  | wrangler.toml | 刪掉                    | 保留，正式版有綁定                  |
  | 資料搬移      | 無                      | 有 localStorage→D1 的搬移流程       |
  | Edge 相容修正 | 無                      | 有一系列修正                        |

- **幫助**：低。Bruno 的版本已經有 D1，而且更安全。
- **風險**：高。引進會覆蓋 Bruno 的 D1、認證和搬移流程，正式版資料可能讀不到。
- **建議**：**不要引進**。如果想要「後台可以編輯來源」，另開一個 change，在 Bruno 的 D1 上自己做。

### G7 使用者與後台管理

- **內容**
  - 改密碼、刪除使用者（8c4c467）
  - 使用者角色（af1f47f）
  - 使用者選單（cd7f992）
  - 強制設定密碼（54d2a54）
  - 儲存類型指示器（905ee24）
  - **API 回 401 時自動導向登入頁（0bbf2b0）**
  - **全域錯誤提示（c0bba76）**
- **衝突**：高。Bruno 改寫過 login、admin、middleware。
- **建議**：只挑 0bbf2b0 和 c0bba76 的概念手動實作。這兩個也能讓「搜尋失敗」這類問題在畫面上顯示出來，不會靜悄悄地變成「沒結果」。

### G8 全域圖片代理、豆瓣代理

- **內容**：在設定裡指定圖片和豆瓣的代理。
- **衝突**：Bruno 已經有 `image-proxy`（含 SSRF 防護），也已改用 TMDB。
- **建議**：不需要。

### G9 版本檢查

- **內容**：顯示版本、檢查有沒有新版。它查的是 upstream 的版本號，對 Bruno 的 fork 沒有意義。
- **建議**：不需要。

### G10 建置、CI、Docker、文件

- **內容**：GHCR 映像、Docker 建置加速、manifest 產生、README。Tailwind v4 升級後來已經撤回，淨效果是零。
- **說明**：Bruno 部署在 Cloudflare Pages，這些幾乎用不到。
- **建議**：不需要。

### G11 黃色內容過濾

- **內容**：依 `type_name` 過濾成人內容（25c699a、774f047），有開關。
- **衝突**：低。只要改搜尋 API 加一段過濾，再加一個字詞表檔案。
- **建議**：看 Bruno 需不需要。

### 建議的引進方案（請 Bruno 選）

1. **先合併這次的搜尋修正**（8559961），不依賴 upstream。
2. 小而有用：G1 加入 lzi；G7 的 401 導向登入和全域錯誤提示；G4 的 iOS 安全區域。都是手動移植，不 cherry-pick。
3. 想要更好的看片體驗：G2 的純前端部分，加上 G3。
4. 不建議：G6、G8、G9、G10。
5. 每一組都會先用 spectra-propose 建 change，在這個分支外另開分支實作。**不會 merge 或 rebase 整個 upstream。**

---

## 三、正式版設定比對（任務 C）

用 Cloudflare API 只讀取**名稱**，沒有讀值。2026-11-07 讀取。

### 部署狀態

- Pages 專案 `moontv`，正式部署是 6a4594f，狀態 success，2026-04-07 部署
- 建置指令：`pnpm install --frozen-lockfile && pnpm run pages:build`
- 輸出目錄：`.vercel/output/static`
- compatibility_date 是 2025-06-28，flags 是 `nodejs_compat`，跟 `wrangler.toml` 一致
- 正式網址前面有 **Cloudflare Access**（302 導到 `brunoyu.cloudflareaccess.com`）。這不在 repo 裡；所以從外面用 curl 打不到 API

### D1 綁定

| 環境       | 綁定名稱    | database id                                       | 跟 wrangler.toml 比 |
| ---------- | ----------- | ------------------------------------------------- | ------------------- |
| production | `moontv_db` | 54c07ad7-9376-46a2-a399-8aec405d5b14（moontv-db） | ✅ 一致             |
| preview    | `moontv_db` | 同上（**跟正式版共用同一個資料庫**）              | ⚠️ 見下方           |

### 環境變數（程式會讀的 vs. 正式版有的）

| 變數                                  | 程式用途               | production                        | preview |
| ------------------------------------- | ---------------------- | --------------------------------- | ------- |
| `NEXT_PUBLIC_STORAGE_TYPE`            | 儲存後端               | ✅（secret）                      | ❌      |
| `PASSWORD`                            | 登入、簽章             | ✅（secret）                      | ❌      |
| `USERNAME`                            | 管理員帳號             | ✅（secret）                      | ❌      |
| `API_SECRET`                          | 公開 API 的 token 驗證 | ❌ 未設                           | ❌      |
| `TMDB_API_KEY`                        | TMDB 海報              | ❌ 未設（會用寫死在程式裡的 key） | ❌      |
| `NEXT_PUBLIC_ENABLE_REGISTER`         | 開放註冊               | ❌（預設關閉）                    | ❌      |
| `SITE_NAME`、`ANNOUNCEMENT`           | 站名、公告             | ❌（用預設值）                    | ❌      |
| `NEXT_PUBLIC_SEARCH_MAX_PAGE`         | 每個來源最多抓幾頁     | ❌（預設 5）                      | ❌      |
| `NEXT_PUBLIC_AGGREGATE_SEARCH_RESULT` | 搜尋結果聚合           | ❌（用預設值）                    | ❌      |
| `DOCKER_ENV`                          | 只在 Docker 用         | 不需要                            | 不需要  |

### 需要注意的地方

1. **🔒 Cloudflare Access 的保護有漏洞**。Access 應用程式 `moontv` 只涵蓋 `moontv-52s.pages.dev`，**沒有涵蓋 `*.moontv-52s.pages.dev`**。每個部署都有自己的 hash 網址，正式版也一樣（例如 `7bc6c262.moontv-52s.pages.dev`），從外面可以直接打：
   - 頁面會導到 `/login`，`/api/favorites` 回 401。帳號資料仍然有密碼保護。
   - 但 `/api/search`、`/api/detail`、`/api/douban`、`/api/image-proxy`、`/api/server-config` 不需要登入就能用，速率限制是每個 IP 每分鐘 60 次。
   - **建議**：在 Access 應用程式加上 `*.moontv-52s.pages.dev`。這是改 Cloudflare 設定，需要 Bruno 同意。
2. **preview 環境沒有任何變數**。push 分支後的 preview 部署會變成：沒有密碼、`localstorage` 模式。preview 網址也不在 Access 保護範圍內，所以**任何拿到網址的人都能直接使用**。用 preview 測搜尋沒問題，但**測不到 D1 和登入**。preview 跟正式版綁的是同一個 D1；只要 preview 維持 `localstorage` 模式，就不會寫到 D1。
3. `NEXT_PUBLIC_STORAGE_TYPE` 設成 secret，但**已確認建置時有讀到**：正式版登入頁的程式碼已經沒有 `'localstorage'` 預設值，使用者名稱欄位也是無條件顯示。`/api/server-config` 也回報 `cloudflare-d1`。這個疑慮已解除。
4. `TMDB_API_KEY` 沒設，所以用的是寫死在程式裡的 key（moontv.md 已經列為待辦）。
5. `API_SECRET` 沒設，公開 API 沒有 token 保護。**現在不建議設**：前端只在載入時跟 `/api/server-config` 拿一次 token，而 token 只有 ±5 分鐘有效，之後也不會更新。一設下去，頁面開超過 5 分鐘搜尋就會回 401。要先把前端改成會更新 token，或改用 Access 保護（第 1 點），才有意義。

以上**都沒有改動** Cloudflare 上的任何設定。
