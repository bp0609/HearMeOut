// Mood Entry Routes

import { Router, Response, Request } from 'express';
import { z } from 'zod';
import path from 'path';
import { prisma } from '../services/prisma';
import { analyzeAudio } from '../services/mlService';
import { checkForPatterns } from '../services/patternDetection';
import { audioUpload, deleteAudioFile } from '../middleware/fileUpload';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { getTodayIST, parseDateString, formatDateToString, getCurrentISTString } from '../utils/dateUtils';

const router = Router();

// Emotion to emoji mapping (8 emotions from the model)
const EMOTION_TO_EMOJI: Record<string, string> = {
  angry: '😠',
  calm: '😌',
  disgust: '😒',
  fearful: '😰',
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  surprised: '😮',
};

// Helper function to get database user ID from Clerk ID
async function getUserIdFromClerk(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found in database');
  }

  return user.id;
}

// Validation schemas
const createMoodSchema = z.object({
  language: z.enum(['en', 'hi', 'gu']).default('en'),
  duration: z.number().min(5).max(60),
});

const updateMoodSchema = z.object({
  selectedEmoji: z.string(),
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
    const clerkId = req.auth.userId;
    const file = req.file;

    // Debug logging for upload request
    console.log('[Upload] Request received:', {
      hasAuth: !!req.headers.authorization,
      contentType: req.headers['content-type'],
      hasFile: !!file,
      clerkId: clerkId,
    });

    if (!file) {
      throw new AppError(400, 'Audio file is required');
    }

    try {
      // Get the user's database ID from Clerk ID
      const userId = await getUserIdFromClerk(clerkId);

      // Validate request body
      const body = createMoodSchema.parse({
        language: req.body.language,
        duration: parseInt(req.body.duration),
      });

      // Get today's date in IST timezone
      const todayIST = getTodayIST();
      console.log(`[IST] Current IST time: ${getCurrentISTString()}, Today's date: ${formatDateToString(todayIST)}`);

      // Check if entry already exists for today
      const existingEntry = await prisma.moodEntry.findUnique({
        where: {
          userId_entryDate: {
            userId,
            entryDate: todayIST,
          },
        },
      });

      if (existingEntry) {
        deleteAudioFile(file.path);
        throw new AppError(409, 'Mood entry for today already exists');
      }

      // Store audio file path (relative to process.cwd())
      const audioFilePath = path.relative(process.cwd(), file.path);

      // Call ML service for analysis
      console.log(`Analyzing audio for user ${userId}...`);
      const mlResult = await analyzeAudio(file.path);

      // Format emotion scores: all 8 emotions with their scores
      const emotionScores = mlResult.all_scores || {};
      
      // Get all 8 emojis with their confidence scores
      const emojisWithScores = Object.entries(emotionScores)
        .map(([emotion, score]) => ({
          emoji: EMOTION_TO_EMOJI[emotion] || '😐',
          emotion,
          confidence: Math.round((score as number) * 100),
        }))
        .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending

      // Create mood entry in database (without selectedEmoji - user will select later)
      const moodEntry = await prisma.moodEntry.create({
        data: {
          userId,
          entryDate: todayIST,
          audioFilePath: audioFilePath,
          duration: body.duration,
          language: body.language,
          selectedEmoji: null, // Will be set when user selects
        },
      });

      console.log(`Mood entry created for user ${userId}, audio file stored at: ${audioFilePath}`);

      res.status(201).json({
        success: true,
        data: {
          id: moodEntry.id,
          entryDate: formatDateToString(moodEntry.entryDate),
          emotionScores: emojisWithScores, // All 8 emojis with confidence scores
        },
      });
    } catch (error) {
      // Delete file if error occurs during processing
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
    const userId = await getUserIdFromClerk(req.auth.userId);
    const { id } = req.params;

    // Validate request body
    const body = updateMoodSchema.parse(req.body);

    // Update mood entry with selected emoji
    const moodEntry = await prisma.moodEntry.update({
      where: {
        id,
        userId, // Ensure user owns this entry
      },
      data: {
        selectedEmoji: body.selectedEmoji,
      },
    });

    // Run pattern detection after user selects emoji
    await checkForPatterns(userId, moodEntry);

    res.json({
      success: true,
      data: {
        id: moodEntry.id,
        selectedEmoji: moodEntry.selectedEmoji,
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
    const userId = await getUserIdFromClerk(req.auth.userId);
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
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: entries.map(entry => ({
        ...entry,
        entryDate: formatDateToString(entry.entryDate),
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
    const userId = await getUserIdFromClerk(req.auth.userId);
    const { date } = req.params;

    // Parse and validate date string
    try {
      var entryDate = parseDateString(date);
    } catch (err: any) {
      throw new AppError(400, `Invalid date format: ${err.message}`);
    }

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
        createdAt: true,
      },
    });

    // Return 200 with null data if no entry exists (not an error - just no data for this date)
    res.json({
      success: true,
      data: entry ? {
        ...entry,
        entryDate: formatDateToString(entry.entryDate),
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
    const userId = await getUserIdFromClerk(req.auth.userId);
    const { id } = req.params;

    // Get the entry first to get the audio file path
    const entry = await prisma.moodEntry.findUnique({
      where: { id, userId },
      select: { audioFilePath: true },
    });

    if (!entry) {
      throw new AppError(404, 'Mood entry not found');
    }

    // Delete from database
    await prisma.moodEntry.delete({
      where: {
        id,
        userId, // Ensure user owns this entry
      },
    });

    // Delete the audio file
    const fullPath = path.join(process.cwd(), entry.audioFilePath);
    deleteAudioFile(fullPath);

    console.log(`Mood entry ${id} deleted, audio file removed: ${entry.audioFilePath}`);

    res.json({
      success: true,
      message: 'Mood entry deleted',
    });
  })
);

export default router;
