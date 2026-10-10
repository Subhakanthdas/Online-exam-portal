
import express from 'express';
import cors from 'cors';
import authRoutes from './auth/auth.routes.js';
import examRoutes from './exam.routes.js';

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'examforge-api',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api', (req, res, next) => {
  const known = req.path === '/subjects' || req.path === '/exams' || req.path === '/exams/join' || req.path === '/results' || /^\/exams\/\d+(?:\/submit)?$/.test(req.path);
  if (!known) return res.status(404).json({ ok: false, error: { message: 'Route not found' } });
  next();
});
app.use('/api', examRoutes);

// JSON 404 response for unknown routes
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: { message: 'Route not found' }
  });
});

export default app;