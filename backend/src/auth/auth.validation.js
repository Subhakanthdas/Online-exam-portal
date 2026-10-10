import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Enter a valid email').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(72),
  role: z.enum(['student', 'creator']).default('student')
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(254),
  password: z.string().min(1, 'Password is required').max(72)
});

export { registerSchema, loginSchema };
