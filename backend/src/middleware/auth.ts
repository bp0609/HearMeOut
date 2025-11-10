// Clerk Authentication Middleware

import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/prisma';

/**
 * Middleware to verify Clerk JWT and attach user info to request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Clerk
    try {
      const session = await clerkClient.sessions.verifySession(token, token);

      if (!session || !session.userId) {
        res.status(401).json({ error: 'Invalid session' });
        return;
      }

      // Attach auth info to request
      (req as AuthenticatedRequest).auth = {
        userId: session.userId,
        sessionId: session.id,
      };

      // Ensure user exists in our database
      await ensureUserExists(session.userId);

      next();
    } catch (clerkError) {
      console.error('Clerk verification error:', clerkError);
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

/**
 * Ensures user exists in database, creates if not
 */
async function ensureUserExists(clerkId: string): Promise<void> {
  try {
    await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: {
        clerkId,
        settings: {
          create: {}, // Create default settings
        },
      },
    });
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

/**
 * Optional auth middleware - attaches user if authenticated, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await clerkClient.sessions.verifySession(token, token);

      if (session && session.userId) {
        (req as AuthenticatedRequest).auth = {
          userId: session.userId,
          sessionId: session.id,
        };
      }
    }
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}
