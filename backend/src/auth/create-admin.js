
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password) {
  console.error(
    'Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script.'
  );
  process.exitCode = 1;
} else if (password.length < 12) {
  console.error('Admin password must be at least 12 characters long.');
  process.exitCode = 1;
} else {
  try {
    const passwordHash = bcrypt.hashSync(password, 12);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'creator')
    `).run(name, email, passwordHash);

    console.log(`Admin account created successfully. User ID: ${result.lastInsertRowid}`);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error('An account with this email already exists.');
    } else {
  console.error('Unable to create admin account:', error.message);
}

    process.exitCode = 1;
  }
}