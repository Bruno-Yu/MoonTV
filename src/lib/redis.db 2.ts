/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { RedisClientType } from '@redis/client';
import { AdminConfig } from './admin.types';
import { Favorite, IStorage, PlayRecord } from './types';

const SEARCH_HISTORY_LIMIT = 20;

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err: any) {
      const isLastAttempt = i === maxRetries - 1;
      const isConnectionError =
        err.message?.includes('Connection') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('ENOTFOUND') ||
        err.code === 'ECONNRESET' ||
        err.code === 'EPIPE';

      if (isConnectionError && !isLastAttempt) {
        console.log(`Redis operation failed, retrying... (${i + 1}/${maxRetries})`);
        console.error('Error:', err.message);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }

      throw err;
    }
  }

  throw new Error('Max retries exceeded');
}

export class RedisStorage implements IStorage {
  private client: any;

  constructor() {
    this.client = (global as any).__MOONTV_REDIS_CLIENT__;
  }

  private prKey(user: string, key: string) {
    return `u:${user}:pr:${key}`;
  }

  async getPlayRecord(userName: string, key: string): Promise<PlayRecord | null> {
    const val = await withRetry(() => this.client.get(this.prKey(userName, key)));
    return val ? (JSON.parse(val) as PlayRecord) : null;
  }

  async setPlayRecord(userName: string, key: string, record: PlayRecord): Promise<void> {
    await withRetry(() => this.client.set(this.prKey(userName, key), JSON.stringify(record)));
  }

  async getAllPlayRecords(userName: string): Promise<Record<string, PlayRecord>> {
    const pattern = `u:${userName}:pr:*`;
    const keys: string[] = await withRetry(() => this.client.keys(pattern));
    if (keys.length === 0) return {};
    const values = await withRetry(() => this.client.mGet(keys));
    const result: Record<string, PlayRecord> = {};
    keys.forEach((fullKey: string, idx: number) => {
      const raw = values[idx];
      if (raw) {
        const rec = JSON.parse(raw) as PlayRecord;
        const keyPart = fullKey.replace(`u:${userName}:pr:`, '');
        result[keyPart] = rec;
      }
    });
    return result;
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    await withRetry(() => this.client.del(this.prKey(userName, key)));
  }

  private favKey(user: string, key: string) {
    return `u:${user}:fav:${key}`;
  }

  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    const val = await withRetry(() => this.client.get(this.favKey(userName, key)));
    return val ? (JSON.parse(val) as Favorite) : null;
  }

  async setFavorite(userName: string, key: string, favorite: Favorite): Promise<void> {
    await withRetry(() => this.client.set(this.favKey(userName, key), JSON.stringify(favorite)));
  }

  async getAllFavorites(userName: string): Promise<Record<string, Favorite>> {
    const pattern = `u:${userName}:fav:*`;
    const keys: string[] = await withRetry(() => this.client.keys(pattern));
    if (keys.length === 0) return {};
    const values = await withRetry(() => this.client.mGet(keys));
    const result: Record<string, Favorite> = {};
    keys.forEach((fullKey: string, idx: number) => {
      const raw = values[idx];
      if (raw) {
        const fav = JSON.parse(raw) as Favorite;
        const keyPart = fullKey.replace(`u:${userName}:fav:`, '');
        result[keyPart] = fav;
      }
    });
    return result;
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    await withRetry(() => this.client.del(this.favKey(userName, key)));
  }

  private userPwdKey(user: string) {
    return `u:${user}:pwd`;
  }

  async registerUser(userName: string, password: string): Promise<void> {
    await withRetry(() => this.client.set(this.userPwdKey(userName), password)));
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    const stored = await withRetry(() => this.client.get(this.userPwdKey(userName))));
    if (stored === null) return false;
    return stored === password;
  }

  async checkUserExist(userName: string): Promise<boolean> {
    const exists = await withRetry(() => this.client.exists(this.userPwdKey(userName))));
    return exists === 1;
  }

  private shKey(user: string) {
    return `u:${user}:sh`;
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    return withRetry(() => this.client.lRange(this.shKey(userName), 0, -1) as Promise<string[]>);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    const key = this.shKey(userName);
    await withRetry(() => this.client.lRem(key, 0, keyword));
    await withRetry(() => this.client.lPush(key, keyword)));
    await withRetry(() => this.client.lTrim(key, 0, SEARCH_HISTORY_LIMIT - 1));
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    const key = this.shKey(userName);
    if (keyword) {
      await withRetry(() => this.client.lRem(key, 0, keyword));
    } else {
      await withRetry(() => this.client.del(key)));
    }
  }

  async getAllUsers(): Promise<string[]> {
    const keys = await withRetry(() => this.client.keys('u:*:pwd'));
    return keys
      .map((k) => {
        const match = k.match(/^u:(.+?):pwd$/);
        return match ? match[1] : undefined;
      })
      .filter((u): u is string => typeof u === 'string');
  }

  private adminConfigKey() {
    return 'admin:config';
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    const val = await withRetry(() => this.client.get(this.adminConfigKey()));
    return val ? (JSON.parse(val) as AdminConfig) : null;
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    await withRetry(() => this.client.set(this.adminConfigKey(), JSON.stringify(config)));
  }
}
