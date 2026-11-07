## 1. Failing test first

- [x] 1.1 Add `src/app/api/search/__tests__/route.test.ts`: mock `searchFromApi` to return `[]` for every source and assert `Cache-Control: no-store`; mock one result and assert `public, max-age=7200`. Verify: `pnpm test route` fails on the empty case before the change.

## 2. Fix

- [x] 2.1 In the `/api/search` GET handler, choose `no-store` when the flattened result list is empty, otherwise keep the existing cache header. Verify: test 1.1 passes.

## 3. Verification

- [x] 3.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`; all pass.
