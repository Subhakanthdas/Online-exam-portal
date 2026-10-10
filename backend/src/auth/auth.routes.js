
import { Router } from 'express';
import { registerSchema, loginSchema } from './auth.validation.js';
import { registerUser, loginUser } from './auth.service.js';
import { authenticate } from './auth.middleware.js';

const router = Router();

// Register a new student account
router.post('/register', (req, res) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid registration details',
      details: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  try {
    // The requested role is constrained by the registration schema.
    const user = registerUser(validation.data);

    return res.status(201).json({
      message: `${user.role === 'creator' ? 'Creator' : 'Student'} account created successfully`,
      user
    });
  } catch (error) {
    if (error.message === 'An account with this email already exists') {
      return res.status(409).json({ error: error.message });
    }

    if (error.message === 'Password must be at least 8 characters long') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Unable to create account'
    });
  }
});

// Log in
router.post('/login', (req, res) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid login details',
      details: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  try {
    const result = loginUser(validation.data);

    return res.status(200).json({
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Unable to log in'
    });
  }
});

// Get the currently logged-in user's details
router.get('/me', authenticate, (req, res) => {
  return res.status(200).json({
    user: req.user
  });
});

export default router;