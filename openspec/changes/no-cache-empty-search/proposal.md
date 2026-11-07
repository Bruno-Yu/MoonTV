## Problem

`/api/search` sends `Cache-Control: public, max-age=7200` even when the result list is empty. When every source fails or times out once, the browser keeps that empty answer for two hours, and repeating the same search keeps showing "未找到相关结果".

Observed on the local workerd build (2026-11-07): two out of about fifteen requests had every source abort at the 8-second timeout. In the browser case the empty response then came back from cache on the next fetch of the same URL, while curl to the same server returned 267 results.

## Root Cause

The search route applies the long cache header regardless of the outcome.

## Proposed Solution

When the aggregated result list is empty, respond with `Cache-Control: no-store`. Non-empty results keep `public, max-age=<cache_time>`.

## Non-Goals

- Not addressing why all sources sometimes time out together. Production has a documented limit of 6 simultaneous outbound connections per request, which local workerd does not enforce, so that will be measured on a preview deployment before any change.
- No change to `/api/search/one` or `/api/search/resources`.
- Design document skipped: one-route change.

## Success Criteria

- A unit test asserts that `GET /api/search?q=x` with every source returning nothing responds with `Cache-Control: no-store`, and with results responds with `public, max-age=7200`.
- `pnpm typecheck`, `pnpm lint` and `pnpm test` pass.

## Impact

- Affected specs: `video-search` (modified)
- Affected code:
  - Modified: `src/app/api/search/route.ts`
  - New: `src/app/api/search/__tests__/route.test.ts`
