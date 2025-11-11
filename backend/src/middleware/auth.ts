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

    // Debug logging for auth verification
    console.log('[Auth] Request to:', req.method, req.path);
    console.log('[Auth] Has Authorization header:', !!req.headers.authorization);
    console.log('[Auth] Clerk auth result:', {
      hasUserId: !!auth.userId,
      hasSessionId: !!auth.sessionId,
      userId: auth.userId || 'none',
    });

    if (!auth.userId) {
      console.warn('[Auth] Authentication failed: No userId found');
      res.status(401).json({
        error: 'Unauthorized: Authentication required',
        details: 'No valid session token found'
      });
      return;
    }

    // Attach auth info to request
    (req as AuthenticatedRequest).auth = {
      userId: auth.userId,
      sessionId: auth.sessionId || '',
    };

    // Ensure user exists in our database
    await ensureUserExists(auth.userId);

    console.log('[Auth] Success: User authenticated:', auth.userId);
    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
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
  } catch (error: any) {
    // If user already exists (race condition), that's fine - we just want to ensure they exist
    if (error?.code === 'P2002' && error?.meta?.target?.includes('clerkId')) {
      console.log('[Auth] User already exists (race condition handled):', clerkId);
      return; // User exists, which is what we want
    }
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
