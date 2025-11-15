import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMoodTrend() {
  try {
    const entries = await prisma.moodEntry.findMany({
      where: {
        selectedEmoji: { not: null },
      },
      select: {
        entryDate: true,
        selectedEmoji: true,
        activities: {
          select: {
            activityKey: true,
          },
        },
      },
      orderBy: {
        entryDate: 'desc',
      },
      take: 5,
    });

    console.log('✅ Query successful!');
    console.log('Sample entries with activities:');
    entries.forEach(entry => {
      console.log(`  Date: ${entry.entryDate.toISOString().split('T')[0]}, Emoji: ${entry.selectedEmoji}, Activities: [${entry.activities.map((a: { activityKey: string }) => a.activityKey).join(', ')}]`);
    });
  } catch (error) {
    console.error('❌ Query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMoodTrend();
