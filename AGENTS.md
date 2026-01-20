# Agent Configuration

This document describes how to use Agents for automated development tasks.

## Overview

MoonTV supports automated development workflows using Claude Code's Agent system:

### Available Agents

| Agent Type | Purpose                        | Use Case                                                |
| ---------- | ------------------------------ | ------------------------------------------------------- |
| `general`  | General-purpose task execution | Complex multi-step tasks, refactoring, new features     |
| `explore`  | Codebase exploration           | Understanding existing code, finding patterns, research |

### Task Command Format

```bash
/task --subagent-type=<agent> --session_id=<id> "task description"
```

## Sub-Agent Orchestration Strategy

### Simple Tasks (Single Agent)

```
/task --subagent-type=general "Fix the TypeScript error in VideoCard.tsx"
```

### Complex Tasks (Multi-Agent)

For complex features, orchestrate multiple agents:

```bash
# 1. Planning Agent - 產生開發計劃
/task --subagent-type=general "規劃新增用戶評論功能，輸出開發計劃JSON"

/task --subagent-type=explore --thoroughness=very "研究現有的收藏功能實作方式"

/task --subagent-type=general "根據研究結果和計劃，實作用戶評論功能"

/task --subagent-type=general "審查實作結果，確保符合MoonTV的程式碼規範"
```

### Agent Communication Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    主協調者 (人類/腳本)                   │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │ Planning│     │Frontend │     │ Backend │
   │  Agent  │────▶│  Agent  │────▶│  Agent  │
   └─────────┘     └─────────┘     └─────────┘
        │                              │
        └──────────────┬───────────────┘
                       ▼
              ┌─────────────────┐
              │  Review Agent   │
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   任務完成 ✅    │
              └─────────────────┘
```

## Predefined Agent Tasks

### Task Library

預設的自動化任務腳本：

```bash
# 程式碼審查
node scripts/agent-demo.js code-review

# 重構分析
node scripts/agent-demo.js refactor

# 文檔生成
node scripts/agent-demo.js docs

# 完整功能規劃（Sub-Agent 演示）
node scripts/agent-demo.js full-feature
```

### Custom Task Creation

在 `scripts/tasks/` 目錄下新增自訂任務：

```javascript
// scripts/tasks/feature-template.js
module.exports = {
  name: 'new-feature',
  description: '生成新功能模板',
  prompts: [
    {
      type: 'input',
      name: 'featureName',
      message: '功能名稱 (camelCase):',
    },
    {
      type: 'input',
      name: 'componentName',
      message: '元件名稱 (PascalCase):',
    },
  ],
  generate: (answers) => {
    // 生成檔案邏輯
  },
};
```

## Session Management

### Continuing a Task Session

```bash
# 使用相同的 session_id 繼續之前的任務
/task --subagent-type=general --session_id="abc123" "繼續實作剩餘部分"
```

### Session Cleanup

會話結束後，Claude Code 會自動清理臨時狀態。

## Best Practices

### 1. Task Decomposition

```bad
/task --subagent-type=general "做所有事情"
```

```good
/task --subagent-type=general "實作搜尋頁面UI"

/task --subagent-type=general "實作搜尋API路由"

/task --subagent-type=general "整合前後端"
```

### 2. Clear Success Criteria

```good
/task --subagent-type=general "實作 VideoCard 元件，需符合：
- 使用 TypeScript interface 定義 props
- 支援 poster 圖片載入顯示
- 點擊可導航到播放頁面
- 使用 tailwind 的 dark: 樣式前綴
"
```

### 3. Progress Tracking

```bash
# 記錄任務狀態
echo '{"status": "in_progress", "agent": "frontend", "step": 2}' > .agent-state.json

# 繼續任務
/task --subagent-type=general --session_id="feature-123" "繼續步驟2"
```

## Error Handling

### Retry Strategy

```bash
# 如果任務失敗，重新嘗試
/task --subagent-type=general "重試：修正類型錯誤"
```

### Fallback to Manual

```bash
# 遇到複雜問題時，切換到手動處理
# 然後使用 agent 完成簡單任務
/task --subagent-type=general "執行單元測試"
```

## Integration with CI/CD

```yaml
# .github/workflows/agent-review.yml
name: Agent Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Agent Review
        run: |
          # 使用 task tool 進行自動化審查
          # 注意：這需要在 Claude Code 環境中執行
```

## Monitoring & Analytics

### Task Logging

所有 agent 任務會記錄到：

- Claude Code 內建日誌
- 可選：外部日誌服務

### Performance Metrics

追蹤指標：

- 任務完成時間
- 子任務數量
- 重試次數

## Security Considerations

1. **環境變數保護**：Agent 無法直接存取敏感環境變數
2. **檔案權限**：Agent 操作受限於專案目錄
3. **網路請求**：Agent 只能發送 HTTP 請求到配置的端點

## Troubleshooting

### 常見問題

| 問題               | 解決方案                       |
| ------------------ | ------------------------------ |
| Agent 無法讀取檔案 | 確認檔案路徑正確，使用相對路徑 |
| 任務卡住           | 使用新的 session 重新開始      |
| 結果不符合預期     | 提供更明確的成功標準           |

### Debug Mode

```bash
# 啟用詳細輸出
/task --subagent-type=general --verbose "debug task"
```
