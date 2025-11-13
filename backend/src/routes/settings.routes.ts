// User Settings Routes

import { Router, Response, Request } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../services/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schema
const updateSettingsSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
  interventionThreshold: z.number().min(3).max(14).optional(),
  audioStorageEnabled: z.boolean().optional(),
});

const consentSchema = z.object({
  consent: z.boolean(),
});

/**
 * GET /api/settings
 * Get user settings
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
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
        audioStorageConsent: settings.audioStorageConsent,
        audioStorageEnabled: settings.audioStorageEnabled,
        consentGivenAt: settings.consentGivenAt,
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
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = req.auth.userId;

    // Validate request body
    const body = updateSettingsSchema.parse(req.body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { settings: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if audio storage is being disabled
    const isDisablingAudioStorage =
      body.audioStorageEnabled === false &&
      user.settings?.audioStorageEnabled === true;

    // If disabling audio storage, delete all audio files for this user
    if (isDisablingAudioStorage) {
      console.log(`[Settings] User ${user.id} disabled audio storage, deleting all audio files...`);

      // Get all mood entries with audio files
      const moodEntries = await prisma.moodEntry.findMany({
        where: { userId: user.id },
        select: { audioFilePath: true },
      });

      // Delete audio files from disk
      for (const entry of moodEntries) {
        const fullPath = path.join(process.cwd(), entry.audioFilePath);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`[Settings] Deleted audio file: ${fullPath}`);
          }
        } catch (error) {
          console.error(`[Settings] Error deleting file ${fullPath}:`, error);
        }
      }

      console.log(`[Settings] Deleted ${moodEntries.length} audio files`);
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
        audioStorageConsent: settings.audioStorageConsent,
        audioStorageEnabled: settings.audioStorageEnabled,
        consentGivenAt: settings.consentGivenAt,
      },
    });
  })
);

/**
 * POST /api/settings/consent
 * Set audio storage consent (first-time consent)
 */
router.post(
  '/consent',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = req.auth.userId;

    // Validate request body
    const { consent } = consentSchema.parse(req.body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update settings with consent
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        audioStorageConsent: consent,
        audioStorageEnabled: consent, // Set enabled to match consent
        consentGivenAt: new Date(),
      },
      create: {
        userId: user.id,
        audioStorageConsent: consent,
        audioStorageEnabled: consent,
        consentGivenAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        audioStorageConsent: settings.audioStorageConsent,
        audioStorageEnabled: settings.audioStorageEnabled,
        consentGivenAt: settings.consentGivenAt,
      },
    });
  })
);

export default router;
