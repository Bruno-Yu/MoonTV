-- MoonTV D1 schema
-- Run via: wrangler d1 execute moontv-db --file=schema.sql
-- All CREATE statements are idempotent (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS play_records (
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
);

CREATE TABLE IF NOT EXISTS favorites (
  fav_key TEXT NOT NULL,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  source_name TEXT NOT NULL,
  cover TEXT NOT NULL DEFAULT '',
  total_episodes INTEGER NOT NULL DEFAULT 0,
  save_time INTEGER NOT NULL,
  PRIMARY KEY (username, fav_key)
);

CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  keyword TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  config_json TEXT NOT NULL
);
