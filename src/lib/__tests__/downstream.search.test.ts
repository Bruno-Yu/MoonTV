/**
 * @jest-environment node
 */
// Regression test for the "search shows no results" bug (2026-11-07).
// When a source has more than one page, every page's items must be merged
// into the result list one by one. Before the fix, each extra page was pushed
// as a whole array, the API returned objects like {"0": {...}} without a
// title, and the search page crashed on `a.title.includes(...)` and showed
// nothing.
import { searchFromApi } from '@/lib/downstream';

// Only available on Cloudflare (next.config.js stubs it for non-Edge builds).
jest.mock(
  '@cloudflare/next-on-pages',
  () => ({ getRequestContext: jest.fn() }),
  {
    virtual: true,
  }
);

const site = {
  key: 'testsrc',
  name: 'Test Source',
  api: 'https://example.test/api.php/provide/vod',
  detail: '',
};

function item(id: number, name: string) {
  return {
    vod_id: String(id),
    vod_name: name,
    vod_pic: `https://img.example.test/${id}.jpg`,
    vod_year: '2024',
    vod_play_url: `第1集$https://v.example.test/${id}/index.m3u8`,
  };
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as unknown as Response;
}

function mockPages(pages: Record<number, Response>) {
  const fetchMock = jest.fn(async (url: string) => {
    const pg = Number(new URL(url).searchParams.get('pg') || '1');
    return pages[pg] ?? jsonResponse({ list: [] });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('searchFromApi multi-page merge', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns every item from all pages as well-formed results', async () => {
    mockPages({
      1: jsonResponse({
        pagecount: 3,
        list: [item(1, '海贼王 第一季'), item(2, '海贼王 第二季')],
      }),
      2: jsonResponse({
        pagecount: 3,
        list: [item(3, '海贼王 剧场版'), item(4, '海贼王 特别篇')],
      }),
      3: jsonResponse({ pagecount: 3, list: [item(5, '海贼王 红发歌姬')] }),
    });

    const results = await searchFromApi(site, '海贼王');

    expect(results).toHaveLength(5);
    for (const r of results) {
      expect(Array.isArray(r)).toBe(false);
      expect(typeof r.title).toBe('string');
      expect(r.source).toBe('testsrc');
    }
    expect(results.map((r) => r.id).sort()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('skips a failed extra page but keeps the others well-formed', async () => {
    mockPages({
      1: jsonResponse({ pagecount: 3, list: [item(1, 'A'), item(2, 'B')] }),
      2: jsonResponse({}, false),
      3: jsonResponse({ pagecount: 3, list: [item(5, 'E')] }),
    });

    const results = await searchFromApi(site, 'x');

    expect(results.map((r) => r.id).sort()).toEqual(['1', '2', '5']);
    expect(results.every((r) => typeof r.title === 'string')).toBe(true);
  });
});

// Sources index Simplified Chinese. The TV search page, history links and
// /api/search/one pass the query through as typed, so searchFromApi itself
// must convert it; a Traditional query otherwise hits far fewer sources.
describe('searchFromApi query conversion', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it.each([
    ['進擊的巨人', '进击的巨人'],
    ['进击的巨人', '进击的巨人'],
    ['Breaking Bad', 'Breaking Bad'],
  ])('sends %p to every source page as wd=%p', async (query, expected) => {
    const fetchMock = mockPages({
      1: jsonResponse({ pagecount: 2, list: [item(1, 'A')] }),
      2: jsonResponse({ pagecount: 2, list: [item(2, 'B')] }),
    });

    await searchFromApi(site, query);

    const sent = fetchMock.mock.calls.map(([url]) =>
      new URL(url as string).searchParams.get('wd')
    );
    expect(sent).toHaveLength(2);
    expect(sent.every((wd) => wd === expected)).toBe(true);
  });
});
