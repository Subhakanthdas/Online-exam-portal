
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from '../src/db/database.js';
import { seedSubjects } from '../src/db/seed.js';

test('creates all required tables and seeds subjects', (t) => {
  const db = createDatabase(':memory:');
  t.after(() => db.close());

  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table'
  `).all().map((row) => row.name);

  const requiredTables = [
    'users',
    'subjects',
    'practice_questions',
    'bookmarks',
    'practice_attempts',
    'exams',
    'exam_questions',
    'exam_attempts',
    'exam_answers',
  ];

  for (const table of requiredTables) {
    assert.ok(tables.includes(table), `Missing table: ${table}`);
  }

  const subjects = db.prepare('SELECT name FROM subjects').all();
  assert.ok(subjects.length > 0);
});

test('seeding twice does not duplicate subjects', (t) => {
  const db = createDatabase(':memory:');
  t.after(() => db.close());

  const before = db.prepare(
    'SELECT COUNT(*) AS count FROM subjects'
  ).get().count;

  seedSubjects(db);

  const after = db.prepare(
    'SELECT COUNT(*) AS count FROM subjects'
  ).get().count;

  assert.equal(after, before);
});

test('rejects invalid roles and duplicate emails', (t) => {
  const db = createDatabase(':memory:');
  t.after(() => db.close());

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run('Test Student', 'student@example.com', 'test-hash', 'student');

  assert.throws(() => {
    insertUser.run('Another Student', 'STUDENT@example.com', 'test-hash', 'student');
  });

  assert.throws(() => {
    insertUser.run('Invalid Role', 'invalid@example.com', 'test-hash', 'admin');
  });
});

test('enforces foreign keys', (t) => {
  const db = createDatabase(':memory:');
  t.after(() => db.close());

  assert.throws(() => {
    db.prepare(`
      INSERT INTO practice_questions
        (subject_id, question_text, options_json, correct_answer)
      VALUES (?, ?, ?, ?)
    `).run(99999, 'Test question', '["A","B"]', 'A');
  });
});