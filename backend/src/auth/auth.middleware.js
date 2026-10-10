
import { verifyToken } from './auth.service.js';
import { db } from '../db/database.js';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    const user = db.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(401).json({
        error: 'User account not found'
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action'
      });
    }

    next();
  };
}

export { authenticate, requireRole };