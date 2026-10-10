import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing from the environment');
}

function registerUser({ name, email, password, role = 'student' }) {
  if (!['student', 'creator'].includes(role)) role = 'student';
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    throw new Error('Name, email, and password are required');
  }


  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(normalizedName, normalizedEmail, passwordHash, role);

    return {
      id: Number(result.lastInsertRowid),
      name: normalizedName,
      email: normalizedEmail,
      role
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('An account with this email already exists');
    }
    throw error;
  }
}

function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = db.prepare(`
    SELECT id, name, email, password_hash, role
    FROM users
    WHERE email = ?
  `).get(normalizedEmail);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { sub: String(user.id), role: user.role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export { registerUser, loginUser, verifyToken };