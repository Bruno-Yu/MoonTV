## ADDED Requirements

### Requirement: Source requests always use Simplified Chinese

`searchFromApi` SHALL convert the query to Simplified Chinese with `zhConverter.t2s` before it builds any source request URL, including the URLs for additional pages. This SHALL apply whichever client or route called it. A query that is already Simplified, or that has no Chinese characters, MUST reach the source unchanged.

#### Scenario: Traditional query from a non-web client

- **WHEN** `/api/search?q=進擊的巨人` is requested directly (for example by the TV search page or a history link)
- **THEN** every source request carries `wd=进击的巨人`

##### Example: outgoing wd parameter

| Query received | wd sent to source |
| -------------- | ----------------- |
| `進擊的巨人`   | `进击的巨人`      |
| `进击的巨人`   | `进击的巨人`      |
| `Breaking Bad` | `Breaking Bad`    |

#### Scenario: Exact-title lookup with a Traditional query

- **WHEN** `/api/search/one?q=海賊王&resourceId=bfzy` is requested
- **THEN** the route compares result titles against `海贼王` and returns the matching results with HTTP 200
