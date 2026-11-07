## Problem

Only the web search form converts the query from Traditional to Simplified Chinese. Every other entry point sends the query as typed:

- the TV search page, which navigates to `/search?q=<typed text>&tv=1`
- clicking a search-history item, or opening a `/search?q=` link
- `/api/search/one`, the OrionTV-compatible endpoint
- the detail fallback search in the fetch-video-detail helpers

The sources index Simplified Chinese, so a Traditional query finds far fewer results. Measured on the local workerd build (2026-11-07): `/api/search?q=進擊的巨人` returned results from 1 source, while `进击的巨人` returned results from 13 sources.

## Root Cause

The conversion lives only in the search page's submit handler (`normalizeSearchQuery`). The server-side search path (`searchFromApi` in `src/lib/downstream.ts`) forwards the raw query to the sources.

## Proposed Solution

Convert the query with `zhConverter.t2s` inside `searchFromApi` before building the source URLs. This one function is shared by `/api/search`, `/api/search/one` and the detail fallback, so every client is covered, including the Android TV app and future clients. `/api/search/one` also compares titles against the Simplified query, because its exact-title filter would otherwise never match a Traditional query. The client-side conversion stays as it is. The conversion is idempotent on Simplified text, so converting twice is safe.

## Non-Goals

- No change to what the UI displays: the search box and result titles render exactly as they do today.
- No change to stored search history.
- Design document skipped: a single-function change.

## Success Criteria

- A unit test calls `searchFromApi` with `進擊的巨人` and asserts that the outgoing source URL contains the encoded `进击的巨人`; the test fails before the change.
- A unit test asserts that a Simplified query reaches the source unchanged.
- On the local workerd build, `/api/search?q=進擊的巨人` returns results from the same number of sources as `进击的巨人`.
- `pnpm typecheck`, `pnpm lint` and `pnpm test` pass.

## Impact

- Affected specs: `video-search` (modified; introduced by the fix-search-multipage-merge change)
- Affected code:
  - Modified: `src/lib/downstream.ts`, `src/lib/__tests__/downstream.search.test.ts`, `src/app/api/search/one/route.ts`
