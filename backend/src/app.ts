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
import audioRoutes from './routes/audio.routes';
import { checkMLServiceHealth } from './services/mlService';

// Load environment variables
config();

const app = express();

// CORS configuration - allow multiple origins for development
const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:5173',
  process.env.DEV_IP ? `https://${process.env.DEV_IP}:5173` : null,
  process.env.FRONTEND_URL || 'http://localhost:5173',
].filter((origin, index, self) => origin && self.indexOf(origin) === index); // Remove duplicates and nulls

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use('/api/audio', requireAuth, audioRoutes);

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
