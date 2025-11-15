import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map emojis to likely activities (for realistic seed data)
const emojiToActivities: Record<string, string[]> = {
    '😊': ['social', 'family', 'dancing', 'music', 'sports'],
    '🤗': ['family', 'social', 'creative', 'music'],
    '😌': ['relaxing', 'reading', 'music', 'singing'],
    '😢': ['writing', 'relaxing', 'reading'],
    '😠': ['workout', 'gaming', 'sports'],
    '😰': ['work', 'study', 'writing'],
};

// Get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function seedMoodEntryActivities() {
    console.log('🌱 Seeding mood entry activities...');

    try {
        // Get all mood entries
        const moodEntries = await prisma.moodEntry.findMany({
            select: {
                id: true,
                selectedEmoji: true,
                entryDate: true,
            },
            where: {
                selectedEmoji: {
                    not: null,
                },
            },
        });

        console.log(`📊 Found ${moodEntries.length} mood entries`);

        let created = 0;
        let skipped = 0;

        for (const entry of moodEntries) {
            // Check if this mood entry already has activities
            const existing = await prisma.moodEntryActivity.findFirst({
                where: { moodEntryId: entry.id },
            });

            if (existing) {
                skipped++;
                continue;
            }

            // Get likely activities for this emoji
            const likelyActivities = emojiToActivities[entry.selectedEmoji || ''] || ['relaxing'];

            // Randomly select 1-3 activities
            const activityCount = Math.floor(Math.random() * 3) + 1;
            const selectedActivities = getRandomItems(likelyActivities, activityCount);

            // Create activity entries
            for (const activityKey of selectedActivities) {
                await prisma.moodEntryActivity.create({
                    data: {
                        moodEntryId: entry.id,
                        activityKey: activityKey,
                    },
                });
                created++;
            }

            console.log(`✅ Added ${selectedActivities.length} activities for mood entry on ${entry.entryDate?.toISOString().split('T')[0]} (${entry.selectedEmoji})`);
        }

        console.log('✨ Mood entry activities seeded successfully!');
        console.log(`📊 Created ${created} activity associations`);
        console.log(`⏭️  Skipped ${skipped} entries that already had activities`);
    } catch (error) {
        console.error('❌ Error seeding mood entry activities:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedMoodEntryActivities();
