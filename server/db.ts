import { mkdirSync } from "node:fs"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"

const DB_PATH = process.env.LEADER_DB ?? path.join(import.meta.dirname, "..", "data", "leader.db")

if (DB_PATH !== ":memory:") mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)
export const dbPath = DB_PATH

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`)

// Schema migrations, applied in order and tracked with SQLite's user_version.
const migrations: string[] = [
  `
  CREATE TABLE events (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    date        TEXT NOT NULL,              -- YYYY-MM-DD
    start_time  TEXT NOT NULL DEFAULT '',   -- HH:MM or ''
    end_time    TEXT NOT NULL DEFAULT '',
    location    TEXT NOT NULL DEFAULT '',
    capacity    INTEGER,
    description TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL
  );
  CREATE INDEX events_date ON events (date);

  -- One row per imported CSV file. Columns are kept as the file had them.
  CREATE TABLE guest_lists (
    id          TEXT PRIMARY KEY,
    file_name   TEXT NOT NULL,
    columns     TEXT NOT NULL,              -- JSON array of header names
    row_count   INTEGER NOT NULL,
    created_at  TEXT NOT NULL
  );

  -- One row per guest; values is a JSON array aligned with guest_lists.columns.
  CREATE TABLE guests (
    list_id     TEXT NOT NULL REFERENCES guest_lists (id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    "values"    TEXT NOT NULL,
    PRIMARY KEY (list_id, position)
  );
  `,
]

const { user_version: current } = db.prepare("PRAGMA user_version").get() as { user_version: number }
for (let v = current; v < migrations.length; v++) {
  db.exec("BEGIN")
  try {
    db.exec(migrations[v])
    db.exec(`PRAGMA user_version = ${v + 1}`)
    db.exec("COMMIT")
  } catch (err) {
    db.exec("ROLLBACK")
    throw err
  }
}

/** Run fn inside a transaction. */
export function tx<T>(fn: () => T): T {
  db.exec("BEGIN")
  try {
    const result = fn()
    db.exec("COMMIT")
    return result
  } catch (err) {
    db.exec("ROLLBACK")
    throw err
  }
}
