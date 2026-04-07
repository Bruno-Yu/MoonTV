# localstorage-to-d1-migration Specification

## Purpose

TBD - created by archiving change 'migrate-to-cloudflare-d1'. Update Purpose after archive.

## Requirements

### Requirement: Migration API endpoint

`POST /api/migrate` SHALL accept a JSON body containing localStorage data and bulk-insert it into D1 for the authenticated user. The endpoint MUST be idempotent — duplicate keys SHALL be silently ignored.

#### Scenario: Successful migration import

- **WHEN** an authenticated user POSTs `{ playRecords, favorites, searchHistory }` to `/api/migrate`
- **THEN** all provided records SHALL be inserted into D1 and the response SHALL include counts of imported items per category

#### Scenario: Duplicate records ignored

- **WHEN** the same record key is POSTed to `/api/migrate` a second time
- **THEN** the existing D1 record SHALL NOT be overwritten and the endpoint SHALL return 200

#### Scenario: Unauthenticated request rejected

- **WHEN** a request to `POST /api/migrate` has no valid auth cookie
- **THEN** the endpoint SHALL return HTTP 401


<!-- @trace
source: migrate-to-cloudflare-d1
updated: 2026-04-06
code:
  - .opencode/commands/spectra-ask.md
  - .github/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-archive.md
  - .agents/skills/spectra-apply/SKILL.md
  - .kilocode/workflows/openspec-proposal.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - .opencode/commands/spectra-apply.md
  - AGENTS.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ask.prompt.md
  - .opencode/commands/spectra-audit.md
  - .opencode/commands/spectra-debug.md
  - .cursorrules
  - .github/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .opencode/commands/spectra-ingest.md
  - .github/prompts/spectra-discuss.prompt.md
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - package.json
  - .opencode/commands/spectra-discuss.md
  - .kilocode/workflows/openspec-archive.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - .kilocode/workflows/openspec-apply.md
-->

---
### Requirement: Migration prompt shown once

`MigratePrompt` SHALL display a migration banner exactly once per browser when the storage type is `cloudflare-d1` and unexported localStorage data is detected. After the user acts (migrate or skip), the banner SHALL NOT appear again.

#### Scenario: Banner shown when data exists

- **WHEN** `NEXT_PUBLIC_STORAGE_TYPE` is `cloudflare-d1` AND localStorage contains non-empty `moontv_play_records`, `moontv_favorites`, or `moontv_search_history` AND `moontv_migrated` flag is not set
- **THEN** the migration banner SHALL be visible

#### Scenario: Banner suppressed after migration

- **WHEN** the user clicks "Migrate" and `/api/migrate` returns 200
- **THEN** `moontv_migrated` SHALL be set to `'1'` in localStorage, the source keys SHALL be removed, and the banner SHALL no longer be displayed

#### Scenario: Banner suppressed after skip

- **WHEN** the user clicks "Skip"
- **THEN** `moontv_migrated` SHALL be set to `'1'` in localStorage and the banner SHALL no longer be displayed

#### Scenario: Banner not shown when already migrated

- **WHEN** `moontv_migrated` is already set to `'1'` in localStorage
- **THEN** the migration banner SHALL NOT be rendered


<!-- @trace
source: migrate-to-cloudflare-d1
updated: 2026-04-06
code:
  - .opencode/commands/spectra-ask.md
  - .github/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-archive.md
  - .agents/skills/spectra-apply/SKILL.md
  - .kilocode/workflows/openspec-proposal.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - .opencode/commands/spectra-apply.md
  - AGENTS.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ask.prompt.md
  - .opencode/commands/spectra-audit.md
  - .opencode/commands/spectra-debug.md
  - .cursorrules
  - .github/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .opencode/commands/spectra-ingest.md
  - .github/prompts/spectra-discuss.prompt.md
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - package.json
  - .opencode/commands/spectra-discuss.md
  - .kilocode/workflows/openspec-archive.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - .kilocode/workflows/openspec-apply.md
-->

---
### Requirement: Migration clears localStorage on success

After a successful migration, `MigratePrompt` SHALL remove the source localStorage keys to avoid stale data accumulation.

#### Scenario: Source keys removed after successful migrate

- **WHEN** `/api/migrate` returns HTTP 200
- **THEN** `moontv_play_records`, `moontv_favorites`, and `moontv_search_history` SHALL be removed from localStorage

<!-- @trace
source: migrate-to-cloudflare-d1
updated: 2026-04-06
code:
  - .opencode/commands/spectra-ask.md
  - .github/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-archive.md
  - .agents/skills/spectra-apply/SKILL.md
  - .kilocode/workflows/openspec-proposal.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - .opencode/commands/spectra-apply.md
  - AGENTS.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ask.prompt.md
  - .opencode/commands/spectra-audit.md
  - .opencode/commands/spectra-debug.md
  - .cursorrules
  - .github/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .opencode/commands/spectra-ingest.md
  - .github/prompts/spectra-discuss.prompt.md
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - package.json
  - .opencode/commands/spectra-discuss.md
  - .kilocode/workflows/openspec-archive.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - .kilocode/workflows/openspec-apply.md
-->