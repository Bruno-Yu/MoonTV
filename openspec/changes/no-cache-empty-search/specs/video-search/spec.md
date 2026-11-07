## ADDED Requirements

### Requirement: Empty search results are not cached

`GET /api/search` SHALL respond with `Cache-Control: no-store` when the aggregated result list is empty, and with `Cache-Control: public, max-age=<cache_time>` when it contains at least one result.

#### Scenario: All sources fail

- **WHEN** every source returns no items or fails for `q=进击的巨人`
- **THEN** the response body is `{"results": []}` and the `Cache-Control` header is `no-store`

#### Scenario: Results found

- **WHEN** at least one source returns items for `q=进击的巨人`
- **THEN** the `Cache-Control` header is `public, max-age=7200` with the default `cache_time`
