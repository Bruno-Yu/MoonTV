/**
 * @jest-environment node
 */
// An empty result usually means the sources failed or timed out this time.
// Caching it for two hours makes the same search keep showing "no results"
// long after the sources recover, so empty answers must not be cached.
import { searchFromApi } from '@/lib/downstream';

jest.mock(
  '@cloudflare/next-on-pages',
  () => ({ getRequestContext: jest.fn() }),
  { virtual: true }
);
jest.mock('@/lib/downstream', () => ({ searchFromApi: jest.fn() }));

// Jest's node environment lacks the Fetch API globals that next/server needs.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const primitives = require('next/dist/compiled/@edge-runtime/primitives');
Object.assign(globalThis, {
  Request: primitives.Request,
  Response: primitives.Response,
  Headers: primitives.Headers,
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GET } = require('@/app/api/search/route');

const mockedSearch = searchFromApi as jest.MockedFunction<typeof searchFromApi>;

describe('GET /api/search cache headers', () => {
  it('does not cache an empty result list', async () => {
    mockedSearch.mockResolvedValue([]);

    const res = await GET(new Request('http://x/api/search?q=进击的巨人'));

    expect((await res.json()).results).toEqual([]);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('caches a non-empty result list', async () => {
    mockedSearch.mockImplementation(async (site) =>
      site.key === 'bfzy'
        ? [
            {
              id: '1',
              title: '进击的巨人',
              poster: '',
              episodes: [],
              source: 'bfzy',
              source_name: 'bfzy',
              year: '2013',
            },
          ]
        : []
    );

    const res = await GET(new Request('http://x/api/search?q=进击的巨人'));

    expect((await res.json()).results).toHaveLength(1);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=7200');
  });
});
