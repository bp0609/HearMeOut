import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREDEFINED_ACTIVITIES = [
    { key: 'social', icon: '👥', label: 'Meeting Friends', color: '#FF6B6B', order: 1 },
    { key: 'family', icon: '👨‍👩‍👧', label: 'Family Time', color: '#FFA07A', order: 2 },
    { key: 'work', icon: '💼', label: 'Working', color: '#4ECDC4', order: 3 },
    { key: 'study', icon: '📚', label: 'Studying', color: '#95E1D3', order: 4 },
    { key: 'workout', icon: '🏃', label: 'Workout', color: '#F38181', order: 5 },
    { key: 'walking', icon: '🚶', label: 'Walking', color: '#A8E6CF', order: 6 },
    { key: 'gaming', icon: '🎮', label: 'Gaming', color: '#BB8FCE', order: 7 },
    { key: 'relaxing', icon: '📺', label: 'Relaxing', color: '#85C1E2', order: 8 },
    { key: 'cooking', icon: '🍽️', label: 'Cooking', color: '#FFD93D', order: 9 },
    { key: 'creative', icon: '🎨', label: 'Creative Work', color: '#FF9FF3', order: 10 },
    { key: 'shopping', icon: '🛍️', label: 'Shopping', color: '#F9CA24', order: 11 },
    { key: 'home', icon: '🏠', label: 'At Home', color: '#74B9FF', order: 12 },
    { key: 'outdoor', icon: '🌳', label: 'Outdoor Activity', color: '#55E6C1', order: 13 },
    { key: 'reading', icon: '📖', label: 'Reading', color: '#FDA7DF', order: 14 },
    { key: 'music', icon: '🎵', label: 'Music/Entertainment', color: '#C7ECEE', order: 15 },
];

async function seedActivities() {
    console.log('🌱 Seeding activities...');

    try {
        // Use upsert to avoid duplicates
        for (const activity of PREDEFINED_ACTIVITIES) {
            await prisma.activity.upsert({
                where: { key: activity.key },
                update: {
                    icon: activity.icon,
                    label: activity.label,
                    color: activity.color,
                    order: activity.order,
                },
                create: activity,
            });
            console.log(`✅ Created/Updated activity: ${activity.label} (${activity.key})`);
        }

        console.log('✨ Activities seeded successfully!');
        console.log(`📊 Total activities: ${PREDEFINED_ACTIVITIES.length}`);
    } catch (error) {
        console.error('❌ Error seeding activities:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedActivities();
