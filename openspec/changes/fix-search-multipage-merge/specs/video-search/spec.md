## Purpose

Video search aggregates results from every configured Apple CMS V10 source into one list. Users type queries in Traditional Chinese while the sources index Simplified Chinese, so the outgoing query is converted before it is sent.

## ADDED Requirements

### Requirement: Multi-page source results are merged item by item

When a source reports more than one result page, `searchFromApi` SHALL fetch up to `SearchDownstreamMaxPage` pages and SHALL return a flat array in which every element is a `SearchResult` object with a string `title` and the `source` key of that source. It MUST NOT return nested arrays or objects derived from spreading an array.

#### Scenario: Source with three pages

- **WHEN** a source answers page 1 with `pagecount: 3` and pages 2 and 3 each contain items
- **THEN** the returned array contains the items of pages 1, 2 and 3, and every element has a string `title` and `source` equal to the source key

##### Example: item counts

| Page 1 items | Page 2 items | Page 3 items | Returned length |
| ------------ | ------------ | ------------ | --------------- |
| 2            | 2            | 1            | 5               |

#### Scenario: An additional page fails

- **WHEN** page 2 returns a non-OK HTTP status and page 3 succeeds
- **THEN** the returned array contains the items of pages 1 and 3 only, all well-formed

### Requirement: Search queries are sent in Simplified Chinese

The search form SHALL normalise the typed query before navigation and before calling `/api/search`: trim it, collapse internal whitespace runs into one space, and convert Traditional Chinese characters to Simplified Chinese with `zhConverter.t2s`. Characters with no Simplified mapping MUST pass through unchanged.

#### Scenario: Traditional query

- **WHEN** the user submits `進擊的巨人`
- **THEN** the query sent to `/api/search` is `进击的巨人`

##### Example: normalisation table

| Typed input       | Sent query      |
| ----------------- | --------------- |
| `進擊的巨人`      | `进击的巨人`    |
| `海賊王   劇場版` | `海贼王 剧场版` |
| `海贼王`          | `海贼王`        |
| `Breaking Bad`    | `Breaking Bad`  |
