// Clerk Authentication Middleware

import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/prisma';

/**
 * Middleware to verify Clerk JWT and attach user info to request
 * Uses networkless verification with short-lived session tokens
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use Clerk's getAuth helper for networkless JWT verification
    const auth = getAuth(req);

    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    // Attach auth info to request
    (req as AuthenticatedRequest).auth = {
      userId: auth.userId,
      sessionId: auth.sessionId || '',
    };

    // Ensure user exists in our database
    await ensureUserExists(auth.userId);

    next();
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
 * Uses networkless verification with short-lived session tokens
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = getAuth(req);

    if (auth.userId) {
      (req as AuthenticatedRequest).auth = {
        userId: auth.userId,
        sessionId: auth.sessionId || '',
      };
    }
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}
