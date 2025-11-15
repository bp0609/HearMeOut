import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { prisma } from '../services/prisma';
import { getAuth } from '@clerk/express';

const router = Router();

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

/**
 * GET /api/activities
 * Get all predefined activities
 */
router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const activities = await prisma.activity.findMany({
        orderBy: { order: 'asc' },
    });

    res.json(activities);
}));

/**
 * GET /api/activities/stats
 * Get activity statistics for the authenticated user
 * Optional query params: year, month (for filtering)
 */
router.get('/stats', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(auth.userId);
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    // Build date filter if year/month provided
    let dateFilter: any = {};
    if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        dateFilter = {
            entryDate: {
                gte: startDate,
                lte: endDate,
            },
        };
    } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        dateFilter = {
            entryDate: {
                gte: startDate,
                lte: endDate,
            },
        };
    }

    // Get all mood entries with activities for this user
    const moodEntries = await prisma.moodEntry.findMany({
        where: {
            userId,
            ...dateFilter,
            selectedEmoji: { not: null }, // Only count completed entries
        },
        include: {
            activities: true,
        },
    });

    // Calculate activity frequency
    const activityCounts: Record<string, number> = {};
    moodEntries.forEach(entry => {
        entry.activities.forEach((activity: any) => {
            activityCounts[activity.activityKey] = (activityCounts[activity.activityKey] || 0) + 1;
        });
    });

    // Get activity details
    const activities = await prisma.activity.findMany();
    const activityMap = new Map(activities.map((a: any) => [a.key, a]));

    // Build response with activity stats
    const stats = Object.entries(activityCounts).map(([key, count]) => {
        const activity = activityMap.get(key);
        return {
            activityKey: key,
            activity: activity || null,
            count,
            percentage: Math.round((count / moodEntries.length) * 100),
        };
    }).sort((a, b) => b.count - a.count);

    res.json({
        stats,
        totalEntries: moodEntries.length,
    });
}));

/**
 * GET /api/activities/mood-correlation
 * Get mood-activity correlation data
 * Shows average mood level for each activity
 */
router.get('/mood-correlation', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(auth.userId);
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    // Build date filter
    let dateFilter: any = {};
    if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        dateFilter = {
            entryDate: {
                gte: startDate,
                lte: endDate,
            },
        };
    } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        dateFilter = {
            entryDate: {
                gte: startDate,
                lte: endDate,
            },
        };
    }

    // Get all mood entries with activities
    const moodEntries = await prisma.moodEntry.findMany({
        where: {
            userId,
            ...dateFilter,
            selectedEmoji: { not: null },
        },
        include: {
            activities: true,
        },
    });

    // Emotion level mapping (same as frontend)
    const getEmotionLevel = (emoji: string): number => {
        const levels: Record<string, number> = {
            '😡': 1, '🤬': 1, // angry
            '😢': 2, '😭': 2, // sad
            '😰': 3, '😱': 3, // fearful
            '🤢': 4, '🤮': 4, // disgusted
            '😐': 5, '😑': 5, // neutral
            '😊': 6, '😄': 7, // happy
            '😌': 8, '🥰': 9, // calm
            '😮': 6, '😲': 6, // surprised
        };
        return levels[emoji] || 5;
    };

    // Calculate average mood for each activity
    const activityMoodData: Record<string, { sum: number; count: number }> = {};

    moodEntries.forEach(entry => {
        const moodLevel = getEmotionLevel(entry.selectedEmoji!);
        entry.activities.forEach((activity: any) => {
            if (!activityMoodData[activity.activityKey]) {
                activityMoodData[activity.activityKey] = { sum: 0, count: 0 };
            }
            activityMoodData[activity.activityKey].sum += moodLevel;
            activityMoodData[activity.activityKey].count += 1;
        });
    });

    // Get activity details
    const activities = await prisma.activity.findMany();
    const activityMap = new Map(activities.map((a: any) => [a.key, a]));

    // Build correlation response
    const correlations = Object.entries(activityMoodData).map(([key, data]) => {
        const activity = activityMap.get(key);
        const averageMood = data.sum / data.count;

        return {
            activityKey: key,
            activity: activity || null,
            averageMood: parseFloat(averageMood.toFixed(2)),
            count: data.count,
        };
    }).sort((a, b) => b.averageMood - a.averageMood);

    res.json({
        correlations,
        totalEntries: moodEntries.length,
    });
}));

export default router;
