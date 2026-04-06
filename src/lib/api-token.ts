'use client';

/**
 * Client-side API token management.
 * Token is fetched from /api/server-config on app init and stored here.
 * All calls to public API routes should use apiFetch() to include X-API-Token.
 */

let _apiToken = '';

export function setApiToken(token: string): void {
  _apiToken = token;
}

export function getApiToken(): string {
  return _apiToken;
}

/**
 * Wrapper around fetch that automatically includes X-API-Token header
 * when a token is available.
 */
export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  if (!_apiToken) return fetch(input, init);
  const headers = new Headers(init?.headers);
  headers.set('X-API-Token', _apiToken);
  return fetch(input, { ...init, headers });
}
