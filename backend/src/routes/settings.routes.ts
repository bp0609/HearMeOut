// User Settings Routes

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Validation schema
const updateSettingsSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  interventionThreshold: z.number().min(3).max(14).optional(),
  cloudStorageEnabled: z.boolean().optional(),
  preferredLanguage: z.enum(['en', 'hi', 'gu']).optional(),
});

/**
 * GET /api/settings
 * Get user settings
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId;

    // Get or create user with settings
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { settings: true },
    });

    if (!user) {
      // This shouldn't happen due to auth middleware, but handle it
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // If no settings exist, create default ones
    let settings = user.settings;
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: user.id },
      });
    }

    res.json({
      success: true,
      data: {
        reminderEnabled: settings.reminderEnabled,
        reminderTime: settings.reminderTime,
        interventionThreshold: settings.interventionThreshold,
        cloudStorageEnabled: settings.cloudStorageEnabled,
        preferredLanguage: settings.preferredLanguage,
      },
    });
  })
);

/**
 * PATCH /api/settings
 * Update user settings
 */
router.patch(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth.userId;

    // Validate request body
    const body = updateSettingsSchema.parse(req.body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: body,
      create: {
        userId: user.id,
        ...body,
      },
    });

    res.json({
      success: true,
      data: {
        reminderEnabled: settings.reminderEnabled,
        reminderTime: settings.reminderTime,
        interventionThreshold: settings.interventionThreshold,
        cloudStorageEnabled: settings.cloudStorageEnabled,
        preferredLanguage: settings.preferredLanguage,
      },
    });
  })
);

export default router;
