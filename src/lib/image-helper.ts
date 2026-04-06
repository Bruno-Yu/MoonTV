/**
 * 圖片處理工具函數
 */

/**
 * 清理並驗證圖片 URL
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return '';

  const cleaned = url.trim();

  if (!cleaned) return '';

  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    console.warn('無效的圖片 URL (缺少協議):', url);
    return '';
  }

  if (cleaned.startsWith('http://')) {
    const httpsUrl = cleaned.replace('http://', 'https://');
    console.log('HTTP 圖片 URL 嘗試轉為 HTTPS:', url, '→', httpsUrl);
    return httpsUrl;
  }

  return cleaned;
}

/**
 * 獲取圖片回退 URL
 */
export function getFallbackImage(title?: string): string {
  if (title) {
    return `https://placehold.co/400x600?text=${encodeURIComponent(title)}`;
  }
  return 'https://placehold.co/400x600?text=No+Image';
}

/**
 * 判斷 URL 是否有效
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 提取圖片域名（用於調試）
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * 檢查是否為支持的圖片格式
 */
export function isSupportedImageFormat(url: string): boolean {
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return supportedFormats.some((ext) => url.toLowerCase().includes(ext));
}

/**
 * 記錄圖片載入錯誤
 */
export function logImageError(url: string, error: any) {
  const domain = extractDomain(url);
  console.error('圖片載入失敗:', {
    url,
    domain,
    error: error?.message || error,
    format: isSupportedImageFormat(url) ? 'supported' : 'unsupported',
  });
}

/**
 * 檢查是否為豆瓣圖片 URL
 */
export function isDoubanImageUrl(url: string): boolean {
  return url.includes('doubanio.com');
}

// ---------------------------------------------------------------------------
// TMDB poster search helpers
// ---------------------------------------------------------------------------

const TMDB_API_KEY =
  process.env.TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * In-memory poster cache (Edge-compatible module-level Map).
 * Key: `${cleanedTitle}:${year}`. Value: TMDB poster URL or '' on miss.
 * Resets on cold start — acceptable for a best-effort cache.
 */
const posterCache = new Map<string, string>();
const MAX_CACHE_SIZE = 200;

function setCached(key: string, value: string): void {
  if (posterCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    const firstKey = posterCache.keys().next().value;
    if (firstKey !== undefined) posterCache.delete(firstKey);
  }
  posterCache.set(key, value);
}

/**
 * Clean a raw video title before submitting to TMDB.
 * Removes year markers, episode markers, and enclosing brackets that degrade search precision.
 */
export function cleanTitleForSearch(title: string): string {
  const cleaned = title
    // Strip trailing (YYYY) or （YYYY）
    .replace(/[（(]\d{4}[）)]/g, '')
    // Strip season markers: 第一季 第二季 第三季 … 第十季 第N季
    .replace(/第[一二三四五六七八九十百千万\d]+季/g, '')
    // Strip episode markers: 第N集, EP01, E01, S01E01
    .replace(/第\d+集/g, '')
    .replace(/[Ss]\d+[Ee]\d+/g, '')
    .replace(/[Ss]\d+/g, '')
    .replace(/[Ee][Pp]?\d+/g, '')
    // Strip square/angle bracket content: [tag], 【tag】
    .replace(/[【[][^\]】]*[】\]]/g, '')
    // Strip full-width parenthesis sequences
    .replace(/（[^）]*）/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Fall back to original if cleaning produces empty string
  return cleaned || title.trim();
}

/**
 * Simple title similarity: common character overlap / max length (0–1).
 * Case-insensitive, spaces stripped.
 */
export function titleSimilarity(a: string, b: string): number {
  const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, '');
  const na = normalise(a);
  const nb = normalise(b);
  if (!na || !nb) return 0;

  let common = 0;
  const counted = new Set<number>();
  for (const ch of na) {
    const idx = nb.indexOf(ch);
    if (idx !== -1 && !counted.has(idx)) {
      common++;
      counted.add(idx);
    }
  }
  return common / Math.max(na.length, nb.length);
}

/**
 * Pick the best TMDB result from a results array against the cleaned title.
 * Returns the poster URL of the best result if similarity ≥ 0.5, otherwise ''.
 */
function pickBestPoster(
  results: any[],
  cleanedTitle: string
): string {
  let best = '';
  let bestScore = 0;

  for (const item of results) {
    const candidateTitle: string =
      item.title || item.name || item.original_title || item.original_name || '';
    const score = titleSimilarity(cleanedTitle, candidateTitle);
    if (score > bestScore) {
      bestScore = score;
      best = item.poster_path || item.backdrop_path || '';
    }
  }

  if (bestScore < 0.4 || !best) return '';
  return `https://image.tmdb.org/t/p/w500${best}`;
}

/**
 * Query a single TMDB endpoint and return the best poster URL or ''.
 */
async function queryTmdbEndpoint(
  endpoint: string,
  params: Record<string, string>,
  cleanedTitle: string,
  signal: AbortSignal
): Promise<string> {
  const url = new URL(`${TMDB_BASE_URL}/${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('query', cleanedTitle);
  url.searchParams.set('language', 'zh-CN');
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('page', '1');
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) return '';

  const data = await response.json();
  if (!Array.isArray(data.results) || data.results.length === 0) return '';

  return pickBestPoster(data.results, cleanedTitle);
}

/**
 * 從 TMDB API 獲取替代的海報圖片 URL.
 * Strategy: /search/movie → /search/tv → /search/multi (fallback without year).
 * Results cached in module-level Map.
 */
export async function fetchAlternativePosterUrl(
  title: string,
  year?: string
): Promise<string> {
  const cleanedTitle = cleanTitleForSearch(title);
  const cacheKey = `${cleanedTitle}:${year ?? ''}`;

  // Cache hit
  const cached = posterCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const yearParam = year ?? '';

    // 1. Try /search/movie with year
    const movieResult = await queryTmdbEndpoint(
      'search/movie',
      yearParam ? { year: yearParam } : {},
      cleanedTitle,
      controller.signal
    );
    if (movieResult) {
      clearTimeout(timeoutId);
      setCached(cacheKey, movieResult);
      return movieResult;
    }

    // 2. Try /search/tv with year
    const tvResult = await queryTmdbEndpoint(
      'search/tv',
      yearParam ? { first_air_date_year: yearParam } : {},
      cleanedTitle,
      controller.signal
    );
    if (tvResult) {
      clearTimeout(timeoutId);
      setCached(cacheKey, tvResult);
      return tvResult;
    }

    // 3. Fallback: /search/multi without year
    const multiResult = await queryTmdbEndpoint(
      'search/multi',
      {},
      cleanedTitle,
      controller.signal
    );
    clearTimeout(timeoutId);
    setCached(cacheKey, multiResult);
    return multiResult;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('❌ 獲取替代海報失敗:', { title, error });
    setCached(cacheKey, '');
    return '';
  }
}

/**
 * 獲取最終的海報 URL
 * 如果是豆瓣圖片，嘗試從 TMDB 獲取替代，失敗則返回原始 URL
 */
export async function getPosterUrl(
  posterUrl: string,
  title: string,
  year?: string
): Promise<string> {
  if (!posterUrl || !isDoubanImageUrl(posterUrl)) {
    return posterUrl;
  }

  const alternativeUrl = await fetchAlternativePosterUrl(title, year);
  return alternativeUrl || posterUrl;
}

/**
 * 同步版本的海報 URL 獲取（用於客戶端無法使用 async 的場景）
 */
export function getPosterUrlSync(posterUrl: string): string {
  return posterUrl;
}
