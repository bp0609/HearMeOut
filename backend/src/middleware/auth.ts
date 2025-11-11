// Clerk Authentication Middleware

import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/prisma';

/**
 * Middleware to verify authentication and ensure user exists in database
 * Should be used after clerkMiddleware() in the chain
 * 
 * This is a custom middleware that checks req.auth (populated by clerkMiddleware)
 * and returns an error instead of redirecting (different from default requireAuth behavior)
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use getAuth() from @clerk/express to get auth state
    const auth = getAuth(req);

    // Check if user is authenticated
    if (!auth?.userId) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    // Attach auth to request for downstream handlers
    (req as AuthenticatedRequest).auth = auth;

    // Ensure user exists in our database (fallback in case webhook didn't fire)
    // Primary user creation happens via webhook at signup
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
 * Should be used after clerkMiddleware() in the chain
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use getAuth() from @clerk/express to get auth state
    const auth = getAuth(req);

    // Attach auth to request
    (req as AuthenticatedRequest).auth = auth;

    // If authenticated, ensure user exists in database
    if (auth?.userId) {
      await ensureUserExists(auth.userId);
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}
