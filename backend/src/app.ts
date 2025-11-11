// Express Application Setup

import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import moodRoutes from './routes/mood.routes';
import progressRoutes from './routes/progress.routes';
import settingsRoutes from './routes/settings.routes';
import webhookRoutes from './routes/webhook.routes';
import { checkMLServiceHealth } from './services/mlService';

// Load environment variables
config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://172.18.0.1:5173', // Docker network IP
    'http://10.7.14.58:5173', // Network IP
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Webhook routes - Use express.raw() for Svix signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk middleware - must be before routes that use req.auth
// Configure for development with proper domain handling
app.use(clerkMiddleware({
  // Use Authorization header instead of cookies for development
  // This avoids cookie domain issues between localhost and 172.18.0.1
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    origin: req.headers.origin,
    auth: req.headers.authorization ? 'Present' : 'Missing',
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  const mlServiceHealthy = await checkMLServiceHealth();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      mlService: mlServiceHealthy ? 'healthy' : 'unhealthy',
    },
  });
});

// Public routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Daily Mood Journal API',
    version: '1.0.0',
    description: 'Backend API for speech-based mental health monitoring',
  });
});

// Test auth endpoint
app.get('/api/test-auth', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as any;
  res.json({
    success: true,
    message: 'Authentication successful!',
    userId: authReq.auth?.userId,
    timestamp: new Date().toISOString(),
  });
});

// Protected routes (require authentication)
app.use('/api/moods', requireAuth, moodRoutes);
app.use('/api/progress', requireAuth, progressRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
