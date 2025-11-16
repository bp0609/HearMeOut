// Pattern Detection Service - Identifies concerning mood trends

import { prisma } from './prisma';
import { MoodEntry } from '@prisma/client';

// Define low-mood emojis (from the 8 emotions used in the app)
// Low moods: sad, fearful, angry, disgust
const LOW_MOOD_EMOJIS = ['😢', '😰', '😠', '😒'];

/**
 * Checks for consecutive low-mood days and creates alerts if threshold is exceeded
 * @param userId - User ID to check
 * @param newEntry - The newly created mood entry
 */
export async function checkForPatterns(
  userId: string,
  newEntry: MoodEntry
): Promise<void> {
  try {
    // Get user's intervention threshold setting
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    const threshold = userSettings?.interventionThreshold || 5;

    // Get last 14 days of mood entries
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentMoods = await prisma.moodEntry.findMany({
      where: {
        userId,
        entryDate: {
          gte: fourteenDaysAgo,
        },
        selectedEmoji: {
          not: null,
        },
      },
      orderBy: {
        entryDate: 'desc',
      },
      take: 14,
    });

    // Count consecutive low-mood days from most recent
    let consecutiveLowDays = 0;
    const lowMoodDates: Date[] = [];

    for (const mood of recentMoods) {
      if (mood.selectedEmoji && LOW_MOOD_EMOJIS.includes(mood.selectedEmoji)) {
        consecutiveLowDays++;
        lowMoodDates.push(mood.entryDate);
      } else {
        break; // Stop at first non-low mood
      }
    }

    // Trigger alert if threshold is exceeded
    if (consecutiveLowDays >= threshold) {
      // Check if similar alert already exists and is not dismissed
      const existingAlert = await prisma.patternAlert.findFirst({
        where: {
          userId,
          alertType: 'consecutive_low',
          dismissed: false,
          detectedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
          },
        },
      });

      // Only create new alert if none exists
      if (!existingAlert) {
        await prisma.patternAlert.create({
          data: {
            userId,
            alertType: 'consecutive_low',
            patternDetails: {
              consecutiveDays: consecutiveLowDays,
              dates: lowMoodDates.map(d => d.toISOString()),
              emojis: recentMoods
                .slice(0, consecutiveLowDays)
                .map(m => m.selectedEmoji),
            },
          },
        });

        console.log(`Pattern alert created for user ${userId}: ${consecutiveLowDays} consecutive low-mood days`);
      }
    }

    // Additional pattern: Sudden drop (good/great to low/terrible in 2 days)
    await detectSuddenMoodDrop(userId, recentMoods, threshold);

  } catch (error) {
    console.error('Pattern detection error:', error);
    // Don't throw - pattern detection failure shouldn't block mood entry
  }
}

/**
 * Detects sudden mood drops (from positive to negative)
 */
async function detectSuddenMoodDrop(
  userId: string,
  recentMoods: MoodEntry[],
  threshold: number
): Promise<void> {
  if (recentMoods.length < 2) return;

  // From the 8 emotions: happy, calm are positive
  const POSITIVE_EMOJIS = ['😊', '😌'];
  // Sad and fearful are the most concerning negative emotions
  const NEGATIVE_EMOJIS = ['😢', '😰'];

  const latest = recentMoods[0];
  const previous = recentMoods[1];

  if (
    latest.selectedEmoji &&
    previous.selectedEmoji &&
    NEGATIVE_EMOJIS.includes(latest.selectedEmoji) &&
    POSITIVE_EMOJIS.includes(previous.selectedEmoji)
  ) {
    // Check if alert already exists
    const existingAlert = await prisma.patternAlert.findFirst({
      where: {
        userId,
        alertType: 'sudden_drop',
        dismissed: false,
        detectedAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Within last 3 days
        },
      },
    });

    if (!existingAlert) {
      await prisma.patternAlert.create({
        data: {
          userId,
          alertType: 'sudden_drop',
          patternDetails: {
            fromEmoji: previous.selectedEmoji,
            toEmoji: latest.selectedEmoji,
            fromDate: previous.entryDate.toISOString(),
            toDate: latest.entryDate.toISOString(),
          },
        },
      });

      console.log(`Sudden mood drop alert created for user ${userId}`);
    }
  }
}

/**
 * Gets active (non-dismissed) alerts for a user
 */
export async function getActiveAlerts(userId: string) {
  return prisma.patternAlert.findMany({
    where: {
      userId,
      dismissed: false,
    },
    orderBy: {
      detectedAt: 'desc',
    },
  });
}

/**
 * Dismisses an alert
 */
export async function dismissAlert(alertId: string, userId: string) {
  return prisma.patternAlert.update({
    where: {
      id: alertId,
      userId, // Ensure user owns this alert
    },
    data: {
      dismissed: true,
      dismissedAt: new Date(),
    },
  });
}
