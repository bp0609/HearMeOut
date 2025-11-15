# Database Seeding Guide

This document provides instructions for seeding the HearMeOut database with initial data.

## Overview

The application has two main seeding scripts:
1. **Activity Seeding** - Populates the `Activity` table with predefined activities
2. **MoodEntryActivity Seeding** - Associates existing mood entries with activities

## Prerequisites

- Node.js and npm installed
- PostgreSQL database running
- Prisma migrations applied
- Environment variables configured in `.env`

## Seeding Scripts

### 1. Seed Activities

**File:** `seed-activities.ts`

**Purpose:** Creates 15 predefined activities that users can associate with their daily mood entries.

**Command:**
```bash
cd backend
npm tsx seed-activities.ts
```

**Activities Created:**

| Key | Icon | Label | Color | Order |
|-----|------|-------|-------|-------|
| social | 👥 | Meeting Friends | #FF6B6B | 1 |
| family | 👨‍👩‍👧 | Family Time | #FFA07A | 2 |
| work | 💼 | Working | #4ECDC4 | 3 |
| study | 📚 | Studying | #95E1D3 | 4 |
| workout | 🏃 | Workout | #F38181 | 5 |
| walking | 🚶 | Walking | #A8E6CF | 6 |
| gaming | 🎮 | Gaming | #BB8FCE | 7 |
| relaxing | 📺 | Relaxing | #85C1E2 | 8 |
| cooking | 🍽️ | Cooking | #FFD93D | 9 |
| creative | 🎨 | Creative Work | #FF9FF3 | 10 |
| shopping | 🛍️ | Shopping | #F9CA24 | 11 |
| home | 🏠 | At Home | #74B9FF | 12 |
| outdoor | 🌳 | Outdoor Activity | #55E6C1 | 13 |
| reading | 📖 | Reading | #FDA7DF | 14 |
| music | 🎵 | Music/Entertainment | #C7ECEE | 15 |

**Expected Output:**
```
🌱 Seeding activities...
✅ Created/Updated activity: Meeting Friends (social)
✅ Created/Updated activity: Family Time (family)
✅ Created/Updated activity: Working (work)
✅ Created/Updated activity: Studying (study)
✅ Created/Updated activity: Workout (workout)
✅ Created/Updated activity: Walking (walking)
✅ Created/Updated activity: Gaming (gaming)
✅ Created/Updated activity: Relaxing (relaxing)
✅ Created/Updated activity: Cooking (cooking)
✅ Created/Updated activity: Creative Work (creative)
✅ Created/Updated activity: Shopping (shopping)
✅ Created/Updated activity: At Home (home)
✅ Created/Updated activity: Outdoor Activity (outdoor)
✅ Created/Updated activity: Reading (reading)
✅ Created/Updated activity: Music/Entertainment (music)
✨ Activities seeded successfully!
📊 Total activities: 15
```

**Features:**
- Uses `upsert` to prevent duplicates
- Safe to run multiple times
- Updates existing activities if changes are made

### 2. Seed Mood Entry Activities

**File:** `seed-mood-entry-activities.ts`

**Purpose:** Associates existing mood entries with relevant activities based on the emoji mood.

**Command:**
```bash
cd backend
npm tsx seed-mood-entry-activities.ts
```

**Activity-Emoji Mapping:**

The script intelligently assigns activities based on the mood emoji:

| Emoji | Likely Activities |
|-------|------------------|
| 😊 | social, family, outdoor, music |
| 🤗 | family, social, creative, music |
| 😌 | relaxing, reading, music, home |
| 😢 | home, relaxing, reading |
| 😠 | workout, gaming, home |
| 😰 | work, study, home |

**Logic:**
- Each mood entry gets **1-3 random activities** from its likely activities list
- Skips mood entries that already have activities
- Only processes mood entries with a selected emoji

**Sample Output:**
```
🌱 Seeding mood entry activities...
📊 Found 286 mood entries
✅ Added 1 activities for mood entry on 2024-11-15 (😊)
✅ Added 3 activities for mood entry on 2024-11-16 (😊)
✅ Added 3 activities for mood entry on 2024-11-17 (😊)
✅ Added 2 activities for mood entry on 2024-11-18 (😌)
...
✨ Mood entry activities seeded successfully!
📊 Created 564 activity associations
⏭️  Skipped 3 entries that already had activities
```

## Complete Seeding Process

To seed a fresh database, run the scripts in this order:

```bash
# 1. Apply Prisma migrations (if not already done)
npx prisma migrate deploy

# 2. Seed activities first
npm tsx seed-activities.ts

# 3. Seed mood entry activities (only if you have existing mood entries)
npm tsx seed-mood-entry-activities.ts
```

## Verification

After seeding, you can verify the data:

### Check Activities
```bash
npx prisma studio
```
Navigate to the `Activity` table - you should see 15 activities.

### Check Activity Associations
```sql
-- Count total activity associations
SELECT COUNT(*) FROM "MoodEntryActivity";

-- Count activities per mood entry
SELECT "moodEntryId", COUNT(*) as activity_count
FROM "MoodEntryActivity"
GROUP BY "moodEntryId"
ORDER BY activity_count DESC;

-- Get most popular activities
SELECT a.label, COUNT(*) as usage_count
FROM "MoodEntryActivity" mea
JOIN "Activity" a ON mea."activityKey" = a.key
GROUP BY a.label
ORDER BY usage_count DESC;
```

## Database Schema

### Activity Table
```prisma
model Activity {
  id        String   @id @default(uuid())
  key       String   @unique
  icon      String
  label     String
  color     String
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  moodEntryActivities MoodEntryActivity[]
}
```

### MoodEntryActivity Table
```prisma
model MoodEntryActivity {
  id          String   @id @default(uuid())
  moodEntryId String
  activityKey String
  createdAt   DateTime @default(now())

  moodEntry MoodEntry @relation(...)
  activity  Activity  @relation(...)

  @@unique([moodEntryId, activityKey])
}
```

## Troubleshooting

### Error: "Property 'moodEntryActivity' does not exist"

**Solution:** Regenerate Prisma Client
```bash
npx prisma generate
```

### Activities already exist warning

This is normal - the activity seeder uses `upsert` and will update existing records. No action needed.

## Re-seeding

Both scripts are safe to run multiple times:

- **Activity Seeder**: Uses `upsert` - will update existing activities
- **MoodEntryActivity Seeder**: Checks for existing associations - will skip entries that already have activities

To completely re-seed MoodEntryActivities:

```bash
# Delete existing associations
npx prisma studio
# Delete all records from MoodEntryActivity table

# Re-run seeder
npm tsx seed-mood-entry-activities.ts
```

## Notes

- Activities are **global** - shared by all users
- Activity associations are **user-specific** through MoodEntry
- The seeding is **idempotent** - safe to run multiple times
- Activities use **emoji icons** for visual appeal
- Each activity has a **unique color** for data visualization
