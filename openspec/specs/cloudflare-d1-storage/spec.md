# cloudflare-d1-storage Specification

## Purpose

Defines how `D1Storage` integrates with Cloudflare D1 in a Next.js / Cloudflare Pages deployment.
Covers the D1 binding contract, schema initialisation, CRUD operations, and the critical build-time
constraints needed to avoid Edge Runtime / client-bundle conflicts with `@cloudflare/next-on-pages`.

## Requirements

### Requirement: D1Storage implements IStorage

`D1Storage` SHALL implement every method of the `IStorage` interface using Cloudflare D1 as the backing store. The binding MUST be retrieved via `getRequestContext().env.moontv_db` from `@cloudflare/next-on-pages` on each method invocation.

> **Note**: The binding variable name is `moontv_db` (matching the "Variable name" field in Cloudflare Pages → Settings → Functions → D1 database bindings). Using a different name (e.g. `DB`) will cause `getDb()` to return `null` silently.

#### Scenario: Play record round-trip

- **WHEN** `setPlayRecord` is called with a username, key, and record
- **THEN** a subsequent `getPlayRecord` with the same username and key SHALL return the same record data

#### Scenario: D1 binding unavailable

- **WHEN** `getRequestContext()` throws (e.g., outside Cloudflare runtime in local dev)
- **THEN** each D1Storage method SHALL return a safe default (null for single-item gets, empty object/array for list gets, void for writes) without throwing


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
### Requirement: Schema auto-initialisation

`D1Storage` SHALL execute `CREATE TABLE IF NOT EXISTS` for all required tables on first use within an isolate lifetime, before any read or write operation.

#### Scenario: First cold start

- **WHEN** the first D1Storage method is called after a cold start
- **THEN** all tables SHALL exist in the D1 database before the method executes its query

#### Scenario: Subsequent requests

- **WHEN** the schema init flag is already set within the same isolate
- **THEN** no DDL statements SHALL be sent to D1 (init is skipped)


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
### Requirement: Play records CRUD

`D1Storage` SHALL support creating, reading, updating, and deleting play records per username.

#### Scenario: Upsert play record

- **WHEN** `setPlayRecord` is called with a key that already exists for the same username
- **THEN** the existing record SHALL be overwritten with the new data (INSERT OR REPLACE semantics)

#### Scenario: Get all play records returns map

- **WHEN** `getAllPlayRecords` is called for a username
- **THEN** it SHALL return a `Record<string, PlayRecord>` keyed by `rec_key`

#### Scenario: Delete removes record

- **WHEN** `deletePlayRecord` is called for a username and key
- **THEN** `getPlayRecord` for the same username and key SHALL return null


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
### Requirement: Favorites CRUD

`D1Storage` SHALL support creating, reading, updating, and deleting favorites per username.

#### Scenario: Upsert favorite

- **WHEN** `setFavorite` is called with a key that already exists for the same username
- **THEN** the existing favorite SHALL be overwritten

#### Scenario: Get all favorites returns map

- **WHEN** `getAllFavorites` is called for a username
- **THEN** it SHALL return a `Record<string, Favorite>` keyed by `fav_key`


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
### Requirement: Search history per user

`D1Storage` SHALL store and retrieve ordered search history per username, capped at 20 entries.

#### Scenario: Add new keyword

- **WHEN** `addSearchHistory` is called with a keyword not already in history
- **THEN** `getSearchHistory` SHALL return the keyword as the first entry

#### Scenario: Duplicate keyword moves to top

- **WHEN** `addSearchHistory` is called with a keyword already in history
- **THEN** the existing entry SHALL be removed and the keyword re-inserted as the most recent entry

#### Scenario: History capped at 20

- **WHEN** the search history for a user already contains 20 entries and `addSearchHistory` is called
- **THEN** the oldest entry SHALL be removed so the total remains 20


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
### Requirement: User authentication in D1

`D1Storage` SHALL support registering users with hashed passwords and verifying credentials.

#### Scenario: Register then verify

- **WHEN** `registerUser` is called followed by `verifyUser` with the same username and password
- **THEN** `verifyUser` SHALL return true

#### Scenario: Wrong password

- **WHEN** `verifyUser` is called with a correct username but incorrect password
- **THEN** it SHALL return false


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
### Requirement: D1 storage type activation

When `NEXT_PUBLIC_STORAGE_TYPE` is set to `cloudflare-d1`, `createStorage()` in `src/lib/db.ts` SHALL return a `D1Storage` instance.

#### Scenario: Env var activates D1

- **WHEN** `process.env.NEXT_PUBLIC_STORAGE_TYPE === 'cloudflare-d1'`
- **THEN** `getStorage()` SHALL return an instance of `D1Storage`

<!-- @trace
source: migrate-to-cloudflare-d1
updated: 2026-04-06
code:
  - src/lib/db.ts
-->

---
### Requirement: Static import of @cloudflare/next-on-pages

`d1.db.ts` MUST import `getRequestContext` via a **static** top-level import:

```ts
import { getRequestContext } from '@cloudflare/next-on-pages';
```

Dynamic imports annotated with `/* webpackIgnore: true */` MUST NOT be used.

#### Scenario: Dynamic webpackIgnore import fails at Cloudflare runtime

- **WHEN** `d1.db.ts` uses `await import(/* webpackIgnore: true */ '@cloudflare/next-on-pages')`
- **THEN** the Cloudflare Edge Functions runtime cannot resolve the module at path
  `__next-on-pages-dist__/functions/api/@cloudflare/next-on-pages`
- **THEN** `getDb()` catches the error and returns `null`, causing ALL D1 reads and writes to
  silently fail with no user-visible error

> **Root cause (2026-04)**: At runtime the dynamic import resolves relative to the bundled output
> directory. The package is not present at that path inside the Edge Functions bundle.

#### Scenario: Static import resolves correctly in Edge Runtime

- **WHEN** `d1.db.ts` uses a static `import { getRequestContext } from '@cloudflare/next-on-pages'`
- **THEN** the module is bundled correctly by `@cloudflare/next-on-pages` during `pages:build`
- **THEN** `getRequestContext()` returns the live Cloudflare request context and `env.moontv_db`
  is available

---
### Requirement: Webpack alias stubs @cloudflare/next-on-pages for non-Edge builds

`next.config.js` MUST configure a webpack alias that resolves `@cloudflare/next-on-pages` to
`false` (empty stub) when `nextRuntime !== 'edge'`.

```js
webpack: (config, { nextRuntime }) => {
  if (nextRuntime !== 'edge') {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@cloudflare/next-on-pages': false,
    };
  }
  return config;
},
```

#### Scenario: Client component import chain triggers server-only build error

- **WHEN** a `'use client'` page (e.g. `src/app/admin/page.tsx`) imports `src/lib/db.ts`, which
  imports `src/lib/d1.db.ts`, which statically imports `@cloudflare/next-on-pages`
- **THEN** without the alias, the Next.js client bundle build fails:
  `'server-only' cannot be imported from a Client Component module`
- **THEN** the fix is the webpack alias above, which stubs the module for the client bundle
  while leaving it intact for Edge Runtime routes

#### Scenario: Alias is not applied for Edge Runtime

- **WHEN** `nextRuntime === 'edge'`
- **THEN** the alias MUST NOT be set so the real `getRequestContext` is available in Edge API routes

---
### Requirement: Edge Runtime declaration on all D1 API routes

Every API route that calls `getRequestContext()` MUST export `runtime = 'edge'`:

```ts
export const runtime = 'edge';
```

#### Scenario: Node.js runtime route cannot access Cloudflare bindings

- **WHEN** an API route omits `export const runtime = 'edge'`
- **THEN** Next.js compiles it as a Node.js serverless function
- **THEN** `getRequestContext()` throws because the Cloudflare request context does not exist
  in a Node.js environment, and `getDb()` returns `null`

---
### Requirement: Schema DDL uses db.batch() not db.exec()

`ensureSchema()` MUST execute each `CREATE TABLE IF NOT EXISTS` statement as a separate
`db.prepare()` call inside a single `db.batch([...])` invocation.
`db.exec()` with a multi-statement semicolon-delimited SQL string MUST NOT be used.

#### Scenario: db.exec() silently stops after first statement

- **WHEN** `db.exec('CREATE TABLE a (...); CREATE TABLE b (...); ...')` is called
- **THEN** Cloudflare D1 may execute only the first statement or return an error without throwing
- **THEN** subsequent tables are never created, and all DML on those tables fails at runtime

#### Scenario: db.batch() creates all tables atomically

- **WHEN** `db.batch([ db.prepare('CREATE TABLE IF NOT EXISTS a (...)'), ... ])` is called
- **THEN** all tables are created in a single D1 round-trip before any read or write executes

---
### Requirement: Branch preview deployments do not inherit production environment variables

Cloudflare Pages branch preview deployments do NOT automatically receive environment variables
or D1 bindings configured for the "Production" environment.

#### Scenario: d1-health returns not_d1_mode on a preview URL

- **WHEN** `/api/d1-health` is called on a branch preview URL (e.g. `<hash>.project.pages.dev`)
  and `NEXT_PUBLIC_STORAGE_TYPE` is not set in the preview environment
- **THEN** the endpoint returns `{ connected: false, reason: "not_d1_mode" }`
- **THEN** this response indicates a missing environment variable in the preview, NOT a code bug

> **Guidance**: D1 functionality MUST be tested against the production URL
> (`https://<project>.pages.dev`) where production environment variables and D1 bindings are active.
> Branch previews are only reliable for testing non-D1 UI changes.