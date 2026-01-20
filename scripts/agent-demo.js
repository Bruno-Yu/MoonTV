#!/usr/bin/env node
/**
 * Agent Automation Demo
 *
 * 這個腳本展示如何使用 OpenCode/Claude Code 的 Agent 功能
 * 來自動化複雜的開發任務
 *
 * 使用方式:
 *   node scripts/agent-demo.js <task-type>
 *
 * Task Types:
 *   - code-review   : 程式碼審查
 *   - refactor      : 重構任務
 *   - docs          : 文件生成
 *   - full-feature  : 完整功能開發（使用 Sub-Agent）
 */

const path = require('path');
const fs = require('fs');

const DEMO_PROMPTS = {
  'code-review': `你是一個資深 code reviewer。請對 src/app/play/page.tsx 進行程式碼審查，找出：
1. 效能問題
2. 記憶體洩漏風險
3. 程式碼規範問題
4. 安全性隱患
5. 可改進的地方

回傳 JSON 格式:
{
  "issues": [{"severity": "high|medium|low", "file": "", "line": 0, "description": ""}],
  "suggestions": [{"priority": 1-5, "description": ""}],
  "summary": "審查摘要"
}`,

  refactor: `你是一個重構專家。請分析 src/lib/utils.ts 並提出重構建議：

評估標準:
- 單一職責原則
- 可測試性
- 可維護性
- 效能影響

回傳 JSON 格式:
{
  "currentIssues": ["問題描述"],
  "refactorPlan": [{"step": 1, "description": "", "files": []}],
  "estimatedImpact": "高|中|低"
}`,

  docs: `你是一個技術文件工程師。請為 src/components/VideoCard.tsx 生成文檔：

需要包含:
1. 元件功能說明
2. Props 類型定義
3. 使用範例
4. 注意事項

回傳 Markdown 格式的完整文檔。`,

  'full-feature': `你是一個全棧開發 Architect。MoonTV 專案需要新增「我的下載」功能，讓用戶可以：

1. 下載影片資訊（標題、封面、劇集列表）
2. 離線查看下載清單
3. 刪除下載項目

請規劃完整的開發方案：

## 1. 架構設計
- 前端頁面：下載管理頁面
- 資料結構：使用 localStorage 儲存下載清單
- API：可選的伺服器端同步（未來擴充）

## 2. 需要修改的檔案清單
- 新增元件
- 修改現有元件
- 新增 API（如需要）
- 樣式檔案

## 3. 實作優先順序

## 4. 潛在挑戰與解決方案

請使用 Sub-Agent 方式，將任務拆分給：
- Frontend Agent: 處理 UI 元件開發
- Backend Agent: 處理 API 設計
- Review Agent: 審查最終實作

最後產出一個完整的實作計劃 JSON。`,
};

async function main() {
  const args = process.argv.slice(2);
  const taskType = args[0] || 'help';

  if (taskType === 'help' || !DEMO_PROMPTS[taskType]) {
    console.log(`
🤖 MoonTV Agent Automation Demo

Usage: node scripts/agent-demo.js <task-type>

Available Task Types:
  code-review   - 程式碼審查示範
  refactor      - 重構分析示範
  docs          - 文件生成示範
  full-feature  - 完整功能開發（Sub-Agent 演示）

Example:
  node scripts/agent-demo.js code-review

Note: 
  For actual agent execution, use the Task tool in Claude Code:
  /task --subagent-type=general "你的任務描述"
  
  Or explore the codebase:
  /task --subagent-type=explore --thoroughness=medium "研究某個功能"
    `);
    return;
  }

  console.log(`\n🚀 執行 Agent 任務: ${taskType}\n`);
  console.log('='.repeat(60));
  console.log(`任務類型: ${taskType}`);
  console.log('='.repeat(60));
  console.log('\n📋 任務描述:\n');
  console.log(DEMO_PROMPTS[taskType]);
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 要執行此任務，請在 Claude Code 中輸入:\n');
  console.log(
    `   /task --subagent-type=general "${DEMO_PROMPTS[taskType].substring(
      0,
      100
    )}..."\n`
  );

  // 保存任務提示到檔案，供後續使用
  const outputPath = path.join(__dirname, `agent-task-${taskType}.json`);
  const taskData = {
    taskType,
    prompt: DEMO_PROMPTS[taskType],
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  fs.writeFileSync(outputPath, JSON.stringify(taskData, null, 2));
  console.log(`📁 任務配置已保存至: ${outputPath}\n`);
}

main().catch(console.error);
