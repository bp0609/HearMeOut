// Script to seed dummy mood data for testing
// Run with: npx tsx seed-dummy-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email to seed data for
const TEST_EMAIL = 'hitesh.kumar@iitgn.ac.in';

// The 8 specific emojis we use (one per emotion category)
const EMOTION_EMOJIS = {
    excited: '🤗',    // Level 8
    happy: '😊',      // Level 7
    calm: '😌',       // Level 5
    neutral: '😐',    // Level 6
    sad: '😢',        // Level 4
    angry: '😠',      // Level 3
    fearful: '😨',    // Level 2
    disgusted: '🤢',  // Level 1
};

// All 8 emojis as array
const ALL_EMOJIS = Object.values(EMOTION_EMOJIS);

// Days of week
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Get random item from array
function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// Get random emoji from all 8 emotions
function getRandomEmoji(): string {
    return getRandomItem(ALL_EMOJIS);
}

// Get weighted random emoji (more positive emotions)
function getWeightedRandomEmoji(): string {
    const rand = Math.random();

    if (rand < 0.3) {
        // 30% happy
        return EMOTION_EMOJIS.happy;
    } else if (rand < 0.5) {
        // 20% excited
        return EMOTION_EMOJIS.excited;
    } else if (rand < 0.65) {
        // 15% calm
        return EMOTION_EMOJIS.calm;
    } else if (rand < 0.75) {
        // 10% neutral
        return EMOTION_EMOJIS.neutral;
    } else if (rand < 0.85) {
        // 10% sad
        return EMOTION_EMOJIS.sad;
    } else if (rand < 0.92) {
        // 7% angry
        return EMOTION_EMOJIS.angry;
    } else if (rand < 0.97) {
        // 5% fearful
        return EMOTION_EMOJIS.fearful;
    } else {
        // 3% disgusted
        return EMOTION_EMOJIS.disgusted;
    }
}

// Create pattern: weekday-specific emotions (happier on weekends)
function getPatternedEmoji(dayOfWeek: string): string {
    const rand = Math.random();

    // Weekends: more positive
    if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
        if (rand < 0.6) return EMOTION_EMOJIS.happy;
        if (rand < 0.8) return EMOTION_EMOJIS.excited;
        return EMOTION_EMOJIS.calm;
    }

    // Monday: slightly more stressed
    if (dayOfWeek === 'Mon') {
        if (rand < 0.3) return EMOTION_EMOJIS.sad;
        if (rand < 0.5) return EMOTION_EMOJIS.neutral;
        return getWeightedRandomEmoji();
    }

    // Friday: more positive
    if (dayOfWeek === 'Fri') {
        if (rand < 0.5) return EMOTION_EMOJIS.happy;
        if (rand < 0.7) return EMOTION_EMOJIS.excited;
        return EMOTION_EMOJIS.calm;
    }

    // Regular weekdays
    return getWeightedRandomEmoji();
}

// Get day of week from date (in IST timezone)
function getDayOfWeek(date: Date): string {
    // Convert to IST (UTC +5:30) to get correct day
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return DAYS_OF_WEEK[istDate.getDay()];
}

// Main seeding function
async function seedDummyData() {
    console.log('🌱 Starting to seed dummy data...\n');

    try {
        // 1. Find or create user
        console.log(`📧 Looking for user with email: ${TEST_EMAIL}`);
        let user = await prisma.user.findUnique({
            where: { email: TEST_EMAIL },
        });

        if (!user) {
            console.log('❌ User not found!');
            console.log('⚠️  This user must be registered in Clerk first.');
            console.log('💡 Please sign up with this email in the app, then run this script again.');
            return;
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

        // 2. Delete existing mood entries for this user
        console.log('🗑️  Deleting existing mood entries...');
        const deleteResult = await prisma.moodEntry.deleteMany({
            where: { userId: user.id },
        });
        console.log(`   Deleted ${deleteResult.count} existing entries\n`);

        // 3. Generate mood entries for the past 365 days (1 year)
        console.log('📊 Generating mood entries for the past year...');
        // Get today's date in IST
        const today = new Date();
        const entries: any[] = [];

        for (let i = 364; i >= 0; i--) {
            // Create date properly to avoid timezone issues
            const entryDate = new Date(today);
            entryDate.setDate(today.getDate() - i);
            // Set time to noon to avoid any timezone edge cases
            entryDate.setHours(12, 0, 0, 0);

            // Skip some days randomly (75% chance of having entry, so ~25% missing)
            if (Math.random() > 0.75) {
                continue;
            }

            const dayOfWeek = getDayOfWeek(entryDate);
            const selectedEmoji = getPatternedEmoji(dayOfWeek);

            entries.push({
                userId: user.id,
                entryDate: entryDate,
                dayOfWeek: dayOfWeek,
                selectedEmoji: selectedEmoji,
                duration: Math.floor(Math.random() * 40) + 10, // 10-50 seconds
                language: 'en',
            });
        }

        console.log(`   Generated ${entries.length} entries across 365 days (~${Math.round((entries.length / 365) * 100)}% filled)\n`);

        // 4. Insert entries in batches
        console.log('💾 Inserting entries into database...');
        let inserted = 0;
        const batchSize = 20;

        for (let i = 0; i < entries.length; i += batchSize) {
            const batch = entries.slice(i, i + batchSize);
            await prisma.moodEntry.createMany({
                data: batch,
                skipDuplicates: true,
            });
            inserted += batch.length;
            console.log(`   Progress: ${inserted}/${entries.length}`);
        }

        console.log(`\n✅ Successfully inserted ${inserted} mood entries!\n`);

        // 5. Display statistics
        console.log('📈 Statistics:');
        const stats = await prisma.moodEntry.groupBy({
            by: ['selectedEmoji'],
            where: { userId: user.id },
            _count: {
                selectedEmoji: true,
            },
            orderBy: {
                _count: {
                    selectedEmoji: 'desc',
                },
            },
        });

        console.log('\n   Mood Distribution:');
        stats.forEach(stat => {
            const emoji = stat.selectedEmoji || '❓';
            const count = stat._count.selectedEmoji;
            const percentage = ((count / inserted) * 100).toFixed(1);
            console.log(`   ${emoji}  ${count.toString().padStart(3)} entries (${percentage}%)`);
        });

        // Day of week distribution
        console.log('\n   Day of Week Distribution:');
        const dayStats = await prisma.moodEntry.groupBy({
            by: ['dayOfWeek'],
            where: { userId: user.id },
            _count: {
                dayOfWeek: true,
            },
        });

        DAYS_OF_WEEK.forEach(day => {
            const stat = dayStats.find(s => s.dayOfWeek === day);
            const count = stat?._count.dayOfWeek || 0;
            console.log(`   ${day}: ${count.toString().padStart(3)} entries`);
        });

        console.log('\n✨ Dummy data seeding completed successfully!');
        console.log('🎯 You can now test the Progress page with realistic data.\n');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
seedDummyData()
    .catch((error) => {
        console.error(error);
        throw error;
    });
