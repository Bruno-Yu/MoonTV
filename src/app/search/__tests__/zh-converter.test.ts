// The UI shows Traditional Chinese, but the video source APIs index Simplified
// Chinese. A Traditional query sent as-is finds far fewer (often zero) results,
// so the search form must convert the query to Simplified before sending it.
// These tests guard that conversion against regressions.
import { normalizeSearchQuery, zhConverter } from '../zh-converter';

describe('normalizeSearchQuery (outgoing search query)', () => {
  it.each([
    ['進擊的巨人', '进击的巨人'],
    ['  進擊的巨人  ', '进击的巨人'],
    ['海賊王   劇場版', '海贼王 剧场版'],
    ['海贼王', '海贼王'],
    ['Breaking Bad', 'Breaking Bad'],
  ])('%p is sent as %p', (input, expected) => {
    expect(normalizeSearchQuery(input)).toBe(expected);
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeSearchQuery('   ')).toBe('');
  });
});

describe('zhConverter', () => {
  it('round-trips a Traditional title through t2s and s2t', () => {
    expect(zhConverter.s2t(zhConverter.t2s('進擊的巨人'))).toBe('進擊的巨人');
  });
});
