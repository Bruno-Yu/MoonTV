## 1. Failing tests first

- [x] 1.1 Add `src/lib/__tests__/downstream.search.test.ts`: with `fetch` mocked so one source returns `pagecount: 3`, assert `searchFromApi` returns 5 well-formed items (string `title`, correct `source`), and that a failing page 2 is skipped. Verify: `pnpm test downstream.search` fails on the current merge code with malformed elements.
- [x] 1.2 Add `src/app/search/__tests__/zh-converter.test.ts` covering `normalizeSearchQuery` with the four rows of the spec's normalisation table. Verify: `pnpm test zh-converter` fails because `normalizeSearchQuery` is not exported yet.

## 2. Fix

- [x] 2.1 In `searchFromApi`, merge each additional page's items into `results` individually so the function returns a flat `SearchResult[]`. Verify: test 1.1 passes.
- [x] 2.2 Export `normalizeSearchQuery` from `src/app/search/zh-converter.ts` (trim, collapse whitespace, `t2s`) and use it in the search form submit handler instead of the inline logic, keeping the conversion behaviour identical. Verify: test 1.2 passes; manual check that submitting `進擊的巨人` in the local search page requests `/api/search?q=进击的巨人`.

## 3. Verification

- [x] 3.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`; all pass.
- [x] 3.2 Against the local dev server, `/api/search?q=海贼王` returns no entry without a string `title`, and the search page lists results with no `搜尋請求失敗` console error.
