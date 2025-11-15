// Clerk Authentication Middleware

import { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
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

    // Note: We don't need to set req.auth - it's already set by clerkMiddleware()
    // We just need to ensure the user exists in our database

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
 * Fetches email from Clerk if available
 */
async function ensureUserExists(clerkId: string): Promise<void> {
  try {
    // Fetch user details from Clerk to get email
    let email: string | undefined;
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
    } catch (clerkError) {
      console.warn('[Auth] Could not fetch email from Clerk:', clerkError);
      // Continue without email - it's optional
    }

    await prisma.user.upsert({
      where: { clerkId },
      update: email ? { email } : {}, // Update email if we got it
      create: {
        clerkId,
        email,
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
