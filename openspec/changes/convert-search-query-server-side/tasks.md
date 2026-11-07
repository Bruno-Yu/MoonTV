## 1. Failing test first

- [x] 1.1 Extend `src/lib/__tests__/downstream.search.test.ts`: call `searchFromApi` with `進擊的巨人` and assert that the `wd` parameter of every mocked fetch call is `进击的巨人`, and that `进击的巨人` and `Breaking Bad` reach the source unchanged. Verify: `pnpm test downstream.search` fails on the Traditional case before the change.

## 2. Fix

- [x] 2.1 In `searchFromApi`, convert the query with `zhConverter.t2s` once at the start and use it for the page-1 URL and every additional-page URL. Verify: test 1.1 passes.

- [x] 2.2 In the `/api/search/one` route, compare result titles against the Simplified form of the query, so an exact Traditional title such as `海賊王` matches the source title `海贼王`. Verify: on the local workerd build, `/api/search/one?q=海賊王&resourceId=bfzy` returns 200 like `q=海贼王`.

## 3. Verification

- [x] 3.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`; all pass.
- [x] 3.2 On the local workerd build (`pnpm pages:build`, then `npx wrangler@3 pages dev`), `/api/search?q=進擊的巨人` returns results from the same number of sources as `进击的巨人`.
