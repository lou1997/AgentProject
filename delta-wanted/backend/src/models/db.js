import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'delta.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS bounties (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    reward TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK(status IN ('active','hunting','completed','cancelled')),
    hunter_id TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (hunter_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bounty_comments (
    id TEXT PRIMARY KEY,
    bounty_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (bounty_id) REFERENCES bounties(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (from_id) REFERENCES users(id),
    FOREIGN KEY (to_id) REFERENCES users(id)
  );
`);

export default db;
