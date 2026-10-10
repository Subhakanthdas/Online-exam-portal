
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { seedSubjects } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Apply additive migrations for databases created by earlier prototype versions.
// CREATE TABLE IF NOT EXISTS does not add columns to existing SQLite tables.
function migrateLegacySchema(database) {
  const tableExists = database.prepare(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?"
  );
  if (!tableExists.get('exam_attempts')) return;

  const columns = new Set(
    database.prepare('PRAGMA table_info(exam_attempts)').all().map((column) => column.name)
  );
  const migrations = [
    ['attempt_number', 'INTEGER NOT NULL DEFAULT 1'],
    ['started_at', "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'"],
    ['deadline_at', "TEXT NOT NULL DEFAULT ''"],
    ['submitted_at', 'TEXT'],
    ['status', "TEXT NOT NULL DEFAULT 'submitted'"],
    ['score', 'REAL'],
    ['max_score', 'REAL']
  ];
  for (const [name, definition] of migrations) {
    if (!columns.has(name)) {
      database.exec(`ALTER TABLE exam_attempts ADD COLUMN ${name} ${definition}`);
    }
  }
}

function createDatabase(databasePath) {
  const resolvedPath =
    databasePath === ':memory:'
      ? ':memory:'
      : path.resolve(databasePath);

  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const db = new Database(resolvedPath);

  try {
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema);
    migrateLegacySchema(db);
    seedSubjects(db);

    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

const projectRoot = path.resolve(__dirname, '../../..');
const configuredPath = process.env.DB_PATH;
const databasePath = configuredPath
  ? (path.isAbsolute(configuredPath) || configuredPath === ':memory:' ? configuredPath : path.resolve(projectRoot, configuredPath))
  : path.resolve(projectRoot, 'backend/data/examforge.sqlite');

const db = createDatabase(databasePath);

export { db, createDatabase };