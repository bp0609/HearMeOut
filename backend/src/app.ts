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
import { checkMLServiceHealth } from './services/mlService';

// Load environment variables
config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk middleware for networkless JWT verification
app.use(clerkMiddleware());

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
