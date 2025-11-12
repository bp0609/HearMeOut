// Mood Entry Routes

import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { analyzeAudio } from '../services/mlService';
import { checkForPatterns } from '../services/patternDetection';
import { audioUpload, deleteAudioFile } from '../middleware/fileUpload';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createMoodSchema = z.object({
  language: z.enum(['en', 'hi', 'gu']).default('en'),
  duration: z.number().min(30).max(60),
});

const updateMoodSchema = z.object({
  selectedEmoji: z.string(),
  activityTags: z.array(z.string()).optional(),
  userNotes: z.string().optional(),
});

/**
 * POST /api/moods
 * Upload audio and create mood entry with ML analysis
 */
router.post(
  '/',
  audioUpload.single('audio'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = req.auth.userId;
    const file = req.file;

    // Debug logging for upload request
    console.log('[Upload] Request received:', {
      hasAuth: !!req.headers.authorization,
      contentType: req.headers['content-type'],
      hasFile: !!file,
      userId: userId,
    });

    if (!file) {
      throw new AppError(400, 'Audio file is required');
    }

    try {
      // Validate request body
      const body = createMoodSchema.parse({
        language: req.body.language,
        duration: parseInt(req.body.duration),
      });

      // Get today's date (midnight)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if entry already exists for today
      const existingEntry = await prisma.moodEntry.findUnique({
        where: {
          userId_entryDate: {
            userId,
            entryDate: today,
          },
        },
      });

      if (existingEntry) {
        deleteAudioFile(file.path);
        throw new AppError(409, 'Mood entry for today already exists');
      }

      // Call ML service for analysis
      console.log(`Analyzing audio for user ${userId}...`);
      const mlResult = await analyzeAudio(file.path, body.language);

      // Create mood entry in database
      const moodEntry = await prisma.moodEntry.create({
        data: {
          userId,
          entryDate: today,
          duration: body.duration,
          language: body.language,
          transcription: mlResult.transcription,
          audioFeatures: mlResult.audioFeatures as any,
          emotionScores: mlResult.emotionScores as any,
          suggestedEmojis: mlResult.suggestedEmojis,
        },
        include: {
          user: {
            select: {
              id: true,
              clerkId: true,
            },
          },
        },
      });

      // CRITICAL: Delete audio file immediately after processing
      deleteAudioFile(file.path);

      console.log(`Mood entry created for user ${userId}, audio file deleted`);

      res.status(201).json({
        success: true,
        data: {
          id: moodEntry.id,
          entryDate: moodEntry.entryDate.toISOString().split('T')[0],
          transcription: moodEntry.transcription,
          emotionScores: moodEntry.emotionScores,
          suggestedEmojis: moodEntry.suggestedEmojis,
        },
      });
    } catch (error) {
      // Ensure file is deleted even if error occurs
      deleteAudioFile(file.path);
      throw error;
    }
  })
);

/**
 * PATCH /api/moods/:id
 * Update mood entry with selected emoji and optional context
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = req.auth.userId;
    const { id } = req.params;

    // Validate request body
    const body = updateMoodSchema.parse(req.body);

    // Update mood entry
    const moodEntry = await prisma.moodEntry.update({
      where: {
        id,
        userId, // Ensure user owns this entry
      },
      data: {
        selectedEmoji: body.selectedEmoji,
        activityTags: body.activityTags || [],
        userNotes: body.userNotes,
      },
    });

    // Run pattern detection after user selects emoji
    await checkForPatterns(userId, moodEntry);

    res.json({
      success: true,
      data: {
        id: moodEntry.id,
        selectedEmoji: moodEntry.selectedEmoji,
        activityTags: moodEntry.activityTags,
      },
    });
  })
);

/**
 * GET /api/moods
 * Get mood entries for a user (with optional date range)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = req.auth.userId;
    const { startDate, endDate, limit = '30' } = req.query;

    const where: any = { userId };

    // Add date filters if provided
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) {
        where.entryDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.entryDate.lte = new Date(endDate as string);
      }
    }

    const entries = await prisma.moodEntry.findMany({
      where,
      orderBy: {
        entryDate: 'desc',
      },
      take: parseInt(limit as string),
      select: {
        id: true,
        entryDate: true,
        selectedEmoji: true,
        suggestedEmojis: true,
        activityTags: true,
        userNotes: true,
        transcription: true,
        emotionScores: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: entries.map(entry => ({
        ...entry,
        entryDate: entry.entryDate.toISOString().split('T')[0],
      })),
    });
  })
);

/**
 * GET /api/moods/:date
 * Get mood entry for a specific date
 */
router.get(
  '/date/:date',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = req.auth.userId;
    const { date } = req.params;

    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    const entry = await prisma.moodEntry.findUnique({
      where: {
        userId_entryDate: {
          userId,
          entryDate,
        },
      },
      select: {
        id: true,
        entryDate: true,
        selectedEmoji: true,
        suggestedEmojis: true,
        activityTags: true,
        userNotes: true,
        transcription: true,
        emotionScores: true,
        createdAt: true,
      },
    });

    // Return 200 with null data if no entry exists (not an error - just no data for this date)
    res.json({
      success: true,
      data: entry ? {
        ...entry,
        entryDate: entry.entryDate.toISOString().split('T')[0],
      } : null,
    });
  })
);

/**
 * DELETE /api/moods/:id
 * Delete a mood entry
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = req.auth.userId;
    const { id } = req.params;

    await prisma.moodEntry.delete({
      where: {
        id,
        userId, // Ensure user owns this entry
      },
    });

    res.json({
      success: true,
      message: 'Mood entry deleted',
    });
  })
);

export default router;
