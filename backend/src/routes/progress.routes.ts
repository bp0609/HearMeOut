// Progress and Analytics Routes

import { Router, Response, Request } from 'express';
import { prisma } from '../services/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ProgressSummaryResponse } from '../types';
import { getActiveAlerts, dismissAlert } from '../services/patternDetection';
import { getDaysAgoIST, getMonthStartIST, getMonthEndIST, formatDateToString } from '../utils/dateUtils';

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
 * GET /api/progress/summary
 * Get mood distribution and weekly summary
 */
router.get(
  '/summary',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(req.auth.userId);
    const { days = '30' } = req.query;

    const daysBack = parseInt(days as string);
    const startDate = getDaysAgoIST(daysBack);

    // Get mood entries with selected emojis
    const entries = await prisma.moodEntry.findMany({
      where: {
        userId,
        selectedEmoji: {
          not: null,
        },
        entryDate: {
          gte: startDate,
        },
      },
      select: {
        selectedEmoji: true,
        entryDate: true,
      },
      orderBy: {
        entryDate: 'desc',
      },
    });

    const totalEntries = entries.length;
    const hasEnoughData = totalEntries >= 10;

    // Calculate mood distribution
    const moodCounts: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.selectedEmoji) {
        moodCounts[entry.selectedEmoji] = (moodCounts[entry.selectedEmoji] || 0) + 1;
      }
    });

    const moodDistribution = Object.entries(moodCounts)
      .map(([emoji, count]) => ({
        emoji,
        count,
        percentage: Math.round((count / totalEntries) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate streak
    const streakDays = calculateStreak(entries.map(e => e.entryDate));

    // Generate weekly summary
    const weeklySummary = generateWeeklySummary(entries, totalEntries);

    const response: ProgressSummaryResponse = {
      moodDistribution,
      totalEntries,
      streakDays,
      weeklySummary,
      hasEnoughData,
    };

    res.json({
      success: true,
      data: response,
    });
  })
);

/**
 * GET /api/progress/alerts
 * Get active pattern alerts
 */
router.get(
  '/alerts',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(req.auth.userId);
    const alerts = await getActiveAlerts(userId);

    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      alertType: alert.alertType,
      detectedAt: alert.detectedAt.toISOString(),
      message: getAlertMessage(alert.alertType, alert.patternDetails as any),
      suggestions: getAlertSuggestions(alert.alertType),
      patternDetails: alert.patternDetails,
    }));

    res.json({
      success: true,
      data: formattedAlerts,
    });
  })
);

/**
 * POST /api/progress/alerts/:id/dismiss
 * Dismiss an alert
 */
router.post(
  '/alerts/:id/dismiss',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(req.auth.userId);
    const { id } = req.params;

    await dismissAlert(id, userId);

    res.json({
      success: true,
      message: 'Alert dismissed',
    });
  })
);

/**
 * GET /api/progress/calendar/:year/:month
 * Get calendar data for a specific month
 */
router.get(
  '/calendar/:year/:month',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(req.auth.userId);
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    // Get first and last day of month in IST
    const firstDay = getMonthStartIST(year, month);
    const lastDay = getMonthEndIST(year, month);

    const entries = await prisma.moodEntry.findMany({
      where: {
        userId,
        entryDate: {
          gte: firstDay,
          lte: lastDay,
        },
        selectedEmoji: { not: null }, // Only return completed entries
      },
      select: {
        entryDate: true,
        dayOfWeek: true,
        selectedEmoji: true,
        activities: {
          include: {
            activity: true,
          },
        },
      },
      orderBy: {
        entryDate: 'asc',
      },
    });

    // Convert to calendar format
    const calendarData = entries.map(entry => ({
      date: formatDateToString(entry.entryDate),
      dayOfWeek: entry.dayOfWeek,
      emoji: entry.selectedEmoji,
      activities: entry.activities.map(a => ({
        id: a.id,
        moodEntryId: a.moodEntryId,
        activityKey: a.activityKey,
        createdAt: a.createdAt,
        activity: a.activity,
      })),
    }));

    res.json({
      success: true,
      data: calendarData,
    });
  })
);

// Helper functions

/**
 * Calculate consecutive streak of entries
 */
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  let streak = 1;
  const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime());

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    // Calculate days difference
    const diffTime = prevDate.getTime() - currDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Generate human-readable weekly summary
 */
function generateWeeklySummary(
  entries: Array<{ selectedEmoji: string | null; entryDate: Date }>,
  totalEntries: number
): string {
  if (totalEntries < 7) {
    return "Keep logging your moods to see patterns! Try to check in daily for the best insights.";
  }

  // Get last 7 days
  const lastWeek = entries.slice(0, Math.min(7, entries.length));
  const positiveMoods = ['😊', '😄', '🥰', '😁', '🤗', '🙂', '😌', '😇'];
  const negativeMoods = ['😢', '😭', '😰', '😨', '💔', '😔', '😞'];

  let positiveCount = 0;
  let negativeCount = 0;

  lastWeek.forEach(entry => {
    if (entry.selectedEmoji) {
      if (positiveMoods.includes(entry.selectedEmoji)) {
        positiveCount++;
      } else if (negativeMoods.includes(entry.selectedEmoji)) {
        negativeCount++;
      }
    }
  });

  if (positiveCount > negativeCount + 2) {
    return "You've had a great week! Your positive energy is shining through. Keep it up!";
  } else if (negativeCount > positiveCount + 2) {
    return "This week has been challenging. Remember, it's okay to have tough days. Consider reaching out to someone you trust.";
  } else {
    return "You've had a balanced week with ups and downs. That's completely normal! Keep tracking to understand your patterns.";
  }
}

/**
 * Get user-friendly alert message
 */
function getAlertMessage(alertType: string, details: any): string {
  if (alertType === 'consecutive_low') {
    const days = details.consecutiveDays || 5;
    return `We've noticed you've been feeling low for ${days} days in a row. It's important to check in with yourself.`;
  } else if (alertType === 'sudden_drop') {
    return "Your mood has changed significantly. If you'd like to talk to someone, we're here to help.";
  }
  return "We've noticed a pattern in your mood entries.";
}

/**
 * Get suggestions based on alert type
 */
function getAlertSuggestions(alertType: string): string[] {
  if (alertType === 'consecutive_low') {
    return [
      'Try a 10-minute guided meditation',
      'Take a short walk outside',
      'Talk to a trusted friend or family member',
      'Contact a mental health professional',
      'Call a crisis helpline if you need immediate support',
    ];
  } else if (alertType === 'sudden_drop') {
    return [
      'Journal about what might be causing these feelings',
      'Practice deep breathing exercises',
      'Reach out to your support network',
      'Consider professional counseling',
    ];
  }
  return ['Take care of yourself', 'Reach out if you need support'];
}

/**
 * GET /api/progress/weekday-distribution
 * Get mood distribution by day of week
 */
router.get(
  '/weekday-distribution',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(req.auth.userId);
    const { year, month } = req.query;

    let entries;

    if (year && month) {
      // Filter by specific month
      const y = parseInt(year as string);
      const m = parseInt(month as string);
      const firstDay = getMonthStartIST(y, m);
      const lastDay = getMonthEndIST(y, m);

      entries = await prisma.moodEntry.findMany({
        where: {
          userId,
          selectedEmoji: { not: null },
          entryDate: {
            gte: firstDay,
            lte: lastDay,
          },
        },
        select: {
          dayOfWeek: true,
          selectedEmoji: true,
        },
      });
    } else {
      // Use all data
      entries = await prisma.moodEntry.findMany({
        where: {
          userId,
          selectedEmoji: { not: null },
        },
        select: {
          dayOfWeek: true,
          selectedEmoji: true,
        },
      });
    }

    // Group by day of week
    const weekdayData: Record<string, Record<string, number>> = {
      Sun: {},
      Mon: {},
      Tue: {},
      Wed: {},
      Thu: {},
      Fri: {},
      Sat: {},
    };

    entries.forEach(entry => {
      if (entry.selectedEmoji && entry.dayOfWeek) {
        if (!weekdayData[entry.dayOfWeek][entry.selectedEmoji]) {
          weekdayData[entry.dayOfWeek][entry.selectedEmoji] = 0;
        }
        weekdayData[entry.dayOfWeek][entry.selectedEmoji]++;
      }
    });

    res.json({
      success: true,
      data: weekdayData,
    });
  })
);

/**
 * GET /api/progress/mood-trend
 * Get mood trend over time for line chart with activities
 */
router.get(
  '/mood-trend',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(req.auth.userId);
    const { year, month } = req.query;

    let entries;

    if (year && month) {
      // Filter by specific month
      const y = parseInt(year as string);
      const m = parseInt(month as string);
      const firstDay = getMonthStartIST(y, m);
      const lastDay = getMonthEndIST(y, m);

      entries = await prisma.moodEntry.findMany({
        where: {
          userId,
          selectedEmoji: { not: null },
          entryDate: {
            gte: firstDay,
            lte: lastDay,
          },
        },
        include: {
          activities: true,
        },
        orderBy: {
          entryDate: 'asc',
        },
      });
    } else {
      // Use all data
      entries = await prisma.moodEntry.findMany({
        where: {
          userId,
          selectedEmoji: { not: null },
        },
        include: {
          activities: true,
        },
        orderBy: {
          entryDate: 'asc',
        },
      });
    }

    const trendData = entries.map(entry => ({
      date: formatDateToString(entry.entryDate),
      emoji: entry.selectedEmoji,
      activityKeys: entry.activities.map(a => a.activityKey),
    }));

    res.json({
      success: true,
      data: trendData,
    });
  })
);

/**
 * GET /api/progress/mood-counts
 * Get total count for each mood emoji
 */
router.get(
  '/mood-counts',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.userId) {
      throw new AppError(401, 'Unauthorized: Missing user authentication');
    }
    const userId = await getUserIdFromClerk(req.auth.userId);
    const { year, month } = req.query;

    let entries;

    if (year && month) {
      // Filter by specific month
      const y = parseInt(year as string);
      const m = parseInt(month as string);
      const firstDay = getMonthStartIST(y, m);
      const lastDay = getMonthEndIST(y, m);

      entries = await prisma.moodEntry.findMany({
        where: {
          userId,
          selectedEmoji: { not: null },
          entryDate: {
            gte: firstDay,
            lte: lastDay,
          },
        },
        select: {
          selectedEmoji: true,
        },
      });
    } else {
      // Use all data
      entries = await prisma.moodEntry.findMany({
        where: {
          userId,
          selectedEmoji: { not: null },
        },
        select: {
          selectedEmoji: true,
        },
      });
    }

    const moodCounts: Record<string, number> = {};
    let totalEntries = 0;

    entries.forEach(entry => {
      if (entry.selectedEmoji) {
        moodCounts[entry.selectedEmoji] = (moodCounts[entry.selectedEmoji] || 0) + 1;
        totalEntries++;
      }
    });

    res.json({
      success: true,
      data: {
        moodCounts,
        totalEntries,
      },
    });
  })
);

export default router;
