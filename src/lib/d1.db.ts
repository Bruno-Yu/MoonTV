/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import { getRequestContext } from '@cloudflare/next-on-pages';

import { AdminConfig } from './admin.types';
import { Favorite, IStorage, PlayRecord } from './types';

const SEARCH_HISTORY_LIMIT = 20;

// Module-level flag: schema is created once per isolate lifetime
let schemaInitialised = false;

// ---------------------------------------------------------------------------
// HMAC-SHA256 helper (Edge Runtime compatible, same as auth.ts)
// ---------------------------------------------------------------------------
async function hmacHex(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// D1Storage — implements IStorage using Cloudflare D1
// ---------------------------------------------------------------------------
export class D1Storage implements IStorage {
  /**
   * Get the D1 binding from the current request context.
   * Uses a dynamic import with webpackIgnore so this module is never bundled
   * into client chunks (avoids 'server-only' build errors from next-on-pages).
   * Returns null when called outside a Cloudflare request (e.g. local dev).
   */
  private async getDb(): Promise<any | null> {
    try {
      const ctx = getRequestContext();
      const db = (ctx.env as any).moontv_db ?? null;
      if (!db) {
        console.error(
          '[D1] moontv_db binding is missing. ' +
          'Go to Cloudflare Pages Dashboard → your project → Settings → ' +
          'Functions → D1 database bindings → Add binding: ' +
          'Variable name = moontv_db, Database = moontv-db'
        );
      }
      return db;
    } catch (err) {
      console.error('[D1] getRequestContext() failed:', err);
      return null;
    }
  }

  /**
   * Create all tables if they don't exist yet.
   * Uses db.batch() with individual prepared statements because D1's exec()
   * does not reliably support multiple semicolon-separated DDL statements.
   * Guarded by a module-level flag so DDL runs at most once per isolate.
   */
  private async ensureSchema(): Promise<void> {
    if (schemaInitialised) return;
    const db = await this.getDb();
    if (!db) {
      // D1 not accessible (local dev or binding missing) — do NOT set flag
      // so the next request can retry once the binding is available.
      return;
    }
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS play_records (
        rec_key TEXT NOT NULL,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        source_name TEXT NOT NULL,
        cover TEXT NOT NULL DEFAULT '',
        episode_index INTEGER NOT NULL DEFAULT 0,
        total_episodes INTEGER NOT NULL DEFAULT 0,
        play_time REAL NOT NULL DEFAULT 0,
        total_time REAL NOT NULL DEFAULT 0,
        save_time INTEGER NOT NULL,
        PRIMARY KEY (username, rec_key)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS favorites (
        fav_key TEXT NOT NULL,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        source_name TEXT NOT NULL,
        cover TEXT NOT NULL DEFAULT '',
        total_episodes INTEGER NOT NULL DEFAULT 0,
        save_time INTEGER NOT NULL,
        PRIMARY KEY (username, fav_key)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        keyword TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS admin_config (
        id INTEGER PRIMARY KEY,
        config_json TEXT NOT NULL
      )`),
    ]);
    schemaInitialised = true;
  }

  // -------------------------------------------------------------------------
  // Play Records
  // -------------------------------------------------------------------------

  async getPlayRecord(
    userName: string,
    key: string
  ): Promise<PlayRecord | null> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return null;
      const row = await db
        .prepare(
          'SELECT title, source_name, cover, episode_index, total_episodes, play_time, total_time, save_time FROM play_records WHERE username = ? AND rec_key = ?'
        )
        .bind(userName, key)
        .first();
      if (!row) return null;
      return {
        title: row.title,
        source_name: row.source_name,
        cover: row.cover,
        index: row.episode_index,
        total_episodes: row.total_episodes,
        play_time: row.play_time,
        total_time: row.total_time,
        save_time: row.save_time,
      };
    } catch (err) {
      console.warn('[D1] getPlayRecord error:', err);
      return null;
    }
  }

  async setPlayRecord(
    userName: string,
    key: string,
    record: PlayRecord
  ): Promise<void> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return;
      await db
        .prepare(
          `INSERT OR REPLACE INTO play_records
            (rec_key, username, title, source_name, cover, episode_index, total_episodes, play_time, total_time, save_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          key,
          userName,
          record.title,
          record.source_name,
          record.cover,
          record.index,
          record.total_episodes,
          record.play_time,
          record.total_time,
          record.save_time
        )
        .run();
    } catch (err) {
      console.warn('[D1] setPlayRecord error:', err);
    }
  }

  async getAllPlayRecords(
    userName: string
  ): Promise<Record<string, PlayRecord>> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return {};
      const { results } = await db
        .prepare(
          'SELECT rec_key, title, source_name, cover, episode_index, total_episodes, play_time, total_time, save_time FROM play_records WHERE username = ?'
        )
        .bind(userName)
        .all();
      const out: Record<string, PlayRecord> = {};
      for (const row of results ?? []) {
        out[row.rec_key as string] = {
          title: row.title as string,
          source_name: row.source_name as string,
          cover: row.cover as string,
          index: row.episode_index as number,
          total_episodes: row.total_episodes as number,
          play_time: row.play_time as number,
          total_time: row.total_time as number,
          save_time: row.save_time as number,
        };
      }
      return out;
    } catch (err) {
      console.warn('[D1] getAllPlayRecords error:', err);
      return {};
    }
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return;
      await db
        .prepare(
          'DELETE FROM play_records WHERE username = ? AND rec_key = ?'
        )
        .bind(userName, key)
        .run();
    } catch (err) {
      console.warn('[D1] deletePlayRecord error:', err);
    }
  }

  // -------------------------------------------------------------------------
  // Favorites
  // -------------------------------------------------------------------------

  async getFavorite(
    userName: string,
    key: string
  ): Promise<Favorite | null> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return null;
      const row = await db
        .prepare(
          'SELECT title, source_name, cover, total_episodes, save_time FROM favorites WHERE username = ? AND fav_key = ?'
        )
        .bind(userName, key)
        .first();
      if (!row) return null;
      return {
        title: row.title,
        source_name: row.source_name,
        cover: row.cover,
        total_episodes: row.total_episodes,
        save_time: row.save_time,
      };
    } catch (err) {
      console.warn('[D1] getFavorite error:', err);
      return null;
    }
  }

  async setFavorite(
    userName: string,
    key: string,
    favorite: Favorite
  ): Promise<void> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return;
      await db
        .prepare(
          `INSERT OR REPLACE INTO favorites
            (fav_key, username, title, source_name, cover, total_episodes, save_time)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          key,
          userName,
          favorite.title,
          favorite.source_name,
          favorite.cover,
          favorite.total_episodes,
          favorite.save_time
        )
        .run();
    } catch (err) {
      console.warn('[D1] setFavorite error:', err);
    }
  }

  async getAllFavorites(
    userName: string
  ): Promise<Record<string, Favorite>> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return {};
      const { results } = await db
        .prepare(
          'SELECT fav_key, title, source_name, cover, total_episodes, save_time FROM favorites WHERE username = ?'
        )
        .bind(userName)
        .all();
      const out: Record<string, Favorite> = {};
      for (const row of results ?? []) {
        out[row.fav_key as string] = {
          title: row.title as string,
          source_name: row.source_name as string,
          cover: row.cover as string,
          total_episodes: row.total_episodes as number,
          save_time: row.save_time as number,
        };
      }
      return out;
    } catch (err) {
      console.warn('[D1] getAllFavorites error:', err);
      return {};
    }
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return;
      await db
        .prepare('DELETE FROM favorites WHERE username = ? AND fav_key = ?')
        .bind(userName, key)
        .run();
    } catch (err) {
      console.warn('[D1] deleteFavorite error:', err);
    }
  }

  // -------------------------------------------------------------------------
  // Search History
  // -------------------------------------------------------------------------

  async getSearchHistory(userName: string): Promise<string[]> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return [];
      const { results } = await db
        .prepare(
          'SELECT keyword FROM search_history WHERE username = ? ORDER BY created_at DESC LIMIT ?'
        )
        .bind(userName, SEARCH_HISTORY_LIMIT)
        .all();
      return (results ?? []).map((r: any) => r.keyword as string);
    } catch (err) {
      console.warn('[D1] getSearchHistory error:', err);
      return [];
    }
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return;
      const now = Date.now();
      // Remove existing entry for this keyword (dedup), then insert fresh
      await db.batch([
        db
          .prepare(
            'DELETE FROM search_history WHERE username = ? AND keyword = ?'
          )
          .bind(userName, keyword),
        db
          .prepare(
            'INSERT INTO search_history (username, keyword, created_at) VALUES (?, ?, ?)'
          )
          .bind(userName, keyword, now),
      ]);
      // Enforce 20-entry cap: delete oldest beyond limit
      await db
        .prepare(
          `DELETE FROM search_history WHERE username = ? AND id NOT IN (
            SELECT id FROM search_history WHERE username = ? ORDER BY created_at DESC LIMIT ?
          )`
        )
        .bind(userName, userName, SEARCH_HISTORY_LIMIT)
        .run();
    } catch (err) {
      console.warn('[D1] addSearchHistory error:', err);
    }
  }

  async deleteSearchHistory(
    userName: string,
    keyword?: string
  ): Promise<void> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return;
      if (keyword) {
        await db
          .prepare(
            'DELETE FROM search_history WHERE username = ? AND keyword = ?'
          )
          .bind(userName, keyword)
          .run();
      } else {
        await db
          .prepare('DELETE FROM search_history WHERE username = ?')
          .bind(userName)
          .run();
      }
    } catch (err) {
      console.warn('[D1] deleteSearchHistory error:', err);
    }
  }

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------

  async registerUser(userName: string, password: string): Promise<void> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return;
      const hash = await hmacHex(password, password);
      await db
        .prepare(
          'INSERT OR IGNORE INTO users (username, password_hash, created_at) VALUES (?, ?, ?)'
        )
        .bind(userName, hash, Date.now())
        .run();
    } catch (err) {
      console.warn('[D1] registerUser error:', err);
    }
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return false;
      const row = await db
        .prepare(
          'SELECT password_hash FROM users WHERE username = ?'
        )
        .bind(userName)
        .first();
      if (!row) return false;
      const hash = await hmacHex(password, password);
      return row.password_hash === hash;
    } catch (err) {
      console.warn('[D1] verifyUser error:', err);
      return false;
    }
  }

  async checkUserExist(userName: string): Promise<boolean> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return false;
      const row = await db
        .prepare('SELECT 1 FROM users WHERE username = ?')
        .bind(userName)
        .first();
      return row !== null;
    } catch (err) {
      console.warn('[D1] checkUserExist error:', err);
      return false;
    }
  }

  async getAllUsers(): Promise<string[]> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return [];
      const { results } = await db
        .prepare('SELECT username FROM users ORDER BY created_at ASC')
        .all();
      return (results ?? []).map((r: any) => r.username as string);
    } catch (err) {
      console.warn('[D1] getAllUsers error:', err);
      return [];
    }
  }

  // -------------------------------------------------------------------------
  // Admin Config
  // -------------------------------------------------------------------------

  async getAdminConfig(): Promise<AdminConfig | null> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return null;
      const row = await db
        .prepare('SELECT config_json FROM admin_config WHERE id = 1')
        .first();
      if (!row) return null;
      return JSON.parse(row.config_json as string) as AdminConfig;
    } catch (err) {
      console.warn('[D1] getAdminConfig error:', err);
      return null;
    }
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    try {
      await this.ensureSchema();
      const db = await this.getDb();
      if (!db) return;
      await db
        .prepare(
          'INSERT OR REPLACE INTO admin_config (id, config_json) VALUES (1, ?)'
        )
        .bind(JSON.stringify(config))
        .run();
    } catch (err) {
      console.warn('[D1] setAdminConfig error:', err);
    }
  }
}
