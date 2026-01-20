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

/**
 * 從 TMDB API 獲取替代的海報圖片 URL
 */
export async function fetchAlternativePosterUrl(
  title: string,
  year?: string
): Promise<string> {
  try {
    console.log('🔍 獲取替代海報:', { title, year });

    const TMDB_API_KEY =
      process.env.TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    const searchUrl = new URL(`${TMDB_BASE_URL}/search/multi`);
    searchUrl.searchParams.append('api_key', TMDB_API_KEY);
    searchUrl.searchParams.append('query', title);
    searchUrl.searchParams.append('language', 'zh-TW');
    if (year) {
      searchUrl.searchParams.append('year', year);
    }
    searchUrl.searchParams.append('include_adult', 'false');
    searchUrl.searchParams.append('page', '1');

    console.log('📡 TMDB 搜索 URL:', searchUrl.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(searchUrl.toString(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('❌ TMDB API 請求失敗:', response.status);
      return '';
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('⚠️  TMDB 未找到結果:', { title, year });
      return '';
    }

    const firstResult = data.results[0];
    const posterPath = firstResult.poster_path || firstResult.backdrop_path;

    if (!posterPath) {
      console.log('⚠️  TMDB 結果沒有海報:', firstResult);
      return '';
    }

    const resultUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
    console.log('✅ TMDB 替換成功:', {
      originalTitle: title,
      newUrl: resultUrl,
    });
    return resultUrl;
  } catch (error) {
    console.warn('❌ 獲取替代海報失敗:', { title, error });
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

  console.log('🎯 檢測到豆瓣圖片:', {
    posterUrl,
    title,
    year,
  });

  const alternativeUrl = await fetchAlternativePosterUrl(title, year);

  if (alternativeUrl) {
    console.log('✅ 圖片已替換:', {
      original: posterUrl,
      replacement: alternativeUrl,
    });
  } else {
    console.log('⚠️  未找到替代圖片，保留原始 URL');
  }

  return alternativeUrl || posterUrl;
}

/**
 * 同步版本的海報 URL 獲取（用於客戶端無法使用 async 的場景）
 */
export function getPosterUrlSync(posterUrl: string): string {
  return posterUrl;
}
