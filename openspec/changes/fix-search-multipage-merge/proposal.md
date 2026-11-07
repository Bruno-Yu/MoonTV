## Problem

Searching for most popular titles shows "no results". The `/api/search` endpoint returns HTTP 200, but whenever a source reports more than one result page, the response contains malformed entries shaped like `{"0": {...}, "1": {...}}` with no `title`, `source` or `episodes`. The search page sorts results with `a.title.includes(...)`, which throws `TypeError: Cannot read properties of undefined (reading 'includes')`; the surrounding `catch` then clears the result list.

Reproduced locally (2026-11-07): `/api/search?q=海贼王` returned 182 entries, 4 of them malformed; the browser console logged `搜尋請求失敗: TypeError ...` and the page rendered no results.

## Root Cause

`searchFromApi` in `src/lib/downstream.ts` fetches pages 2..N in parallel and merges them with `results.push(...additionalResults.filter((pr) => pr.length > 0))`. `additionalResults` is an array of per-page arrays, so this pushes each page array as a single element instead of its items. The upstream original used `forEach(pageResults => results.push(...pageResults))`; the regression came in commit 36f3754 (2026-01-20). Each page array then gets spread into an object by the poster-replacement `map`, producing the `{"0": ...}` shape.

Ruled out with evidence: source APIs are not all down (15 of 23 answer a simplified query with JSON), and production has no `API_SECRET` set, so API-token expiry cannot cause 401s there.

## Proposed Solution

- Flatten the additional page results into `results` item by item, so `searchFromApi` returns only well-formed `SearchResult` objects.
- Extract the search-box query normalisation (trim, collapse whitespace, Traditional→Simplified via `zhConverter.t2s`) into an exported pure function used by the search form handler, so the outgoing-query conversion is covered by tests.
- Add Jest tests for both behaviours.

## Non-Goals

- No defensive filtering on the client: the server contract is fixed at its source instead of hiding malformed data in the UI.
- No change to which sources are configured; pruning dead sources (dbzy, fczy888, mozhua, yinghua, wujin, heimuer, wolong, wwzy, tyyszy, suoni) is a separate decision for Bruno.
- No change to how `?q=` deep links or history clicks are converted, and no change to the search box echoing the simplified query; these are recorded as follow-ups.
- Design document skipped: single-module bug fix with no architectural decision.

## Success Criteria

- A unit test with a mocked source reporting `pagecount: 3` asserts that `searchFromApi` returns every item from all three pages, each with a string `title` and the source key; the test fails on the pre-fix code.
- A unit test asserts that a Traditional query such as `進擊的巨人` is normalised to `进击的巨人` before being sent, that whitespace is collapsed, and that an already-Simplified query is unchanged.
- Locally, `/api/search?q=海贼王` returns zero entries without a string `title`, and the search page renders results.
- `pnpm typecheck`, `pnpm lint` and `pnpm test` pass.

## Impact

- Affected specs: `video-search` (new)
- Affected code:
  - Modified: `src/lib/downstream.ts`, `src/app/search/page.tsx`, `src/app/search/zh-converter.ts`
  - New: `src/lib/__tests__/downstream.search.test.ts`, `src/app/search/__tests__/zh-converter.test.ts`
