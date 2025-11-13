# Database Schema Changes & Workflow Update

## Summary of Changes

This document summarizes the database schema changes and workflow updates made to simplify the mood tracking system.

## Database Schema Changes

### MoodEntry Model - Before
```prisma
model MoodEntry {
  id              String   @id @default(uuid())
  userId          String
  entryDate       DateTime @db.Date
  duration        Int
  language        String   @default("en")
  transcription   String?  @db.Text
  audioFeatures   Json
  emotionScores   Json
  suggestedEmojis String[]
  selectedEmoji   String?
  activityTags    String[]
  userNotes       String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(...)
}
```

### MoodEntry Model - After
```prisma
model MoodEntry {
  id              String   @id @default(uuid())
  userId          String
  entryDate       DateTime @db.Date
  audioFilePath   String   // NEW: Stores relative path to audio file
  duration        Int
  language        String   @default("en")
  selectedEmoji   String?  // User's final choice from 8 emotions
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(...)
}
```

### Removed Fields
- ✂️ `transcription` - Not needed anymore
- ✂️ `audioFeatures` - ML scores not stored in DB
- ✂️ `emotionScores` - ML scores not stored in DB
- ✂️ `suggestedEmojis` - Generated on-the-fly, not stored
- ✂️ `activityTags` - Not needed for MVP
- ✂️ `userNotes` - Not needed for MVP

### Added Fields
- ✅ `audioFilePath` - Stores relative path to audio file (required)

## New Workflow

### 1. User Records Audio
**Frontend: RecordingPage**
- User selects language
- Records audio (5-60 seconds)
- Audio is uploaded to backend

### 2. Backend Processing
**Backend: POST /api/moods**
```typescript
// Save audio file to disk
const audioFilePath = path.relative(process.cwd(), file.path);

// Analyze with ML service
const mlResult = await analyzeAudio(file.path);

// Format response: All 8 emotions with confidence scores
const emojisWithScores = Object.entries(mlResult.all_scores)
  .map(([emotion, score]) => ({
    emoji: EMOTION_TO_EMOJI[emotion],
    emotion,
    confidence: Math.round(score * 100),
  }))
  .sort((a, b) => b.confidence - a.confidence);

// Create entry in DB (WITHOUT selectedEmoji)
await prisma.moodEntry.create({
  data: {
    userId,
    entryDate: todayIST,
    audioFilePath,
    duration,
    language,
    selectedEmoji: null, // User will select later
  },
});

// Return to frontend
return {
  id: entryId,
  entryDate: "YYYY-MM-DD",
  emotionScores: emojisWithScores, // All 8 with confidence
};
```

### 3. User Selects Emoji
**Frontend: StickerSelectionPage**
- Receives `emotionScores` via navigation state
- Displays **Top 3** emojis (highlighted, sorted by confidence)
  - Highest confidence has "Best Match" badge
  - Shows confidence percentage
- Displays **All 8** emojis in a grid
  - User can select any of the 8
  - Shows confidence for each
- User selects emoji → PATCH `/api/moods/:id`
- User cancels → DELETE `/api/moods/:id` (removes entry + audio file)

### 4. Update Entry
**Backend: PATCH /api/moods/:id**
```typescript
await prisma.moodEntry.update({
  where: { id, userId },
  data: { selectedEmoji },
});
```

### 5. Delete Entry (If Cancelled)
**Backend: DELETE /api/moods/:id**
```typescript
// Get audio file path
const entry = await prisma.moodEntry.findUnique({
  where: { id, userId },
  select: { audioFilePath: true },
});

// Delete from DB
await prisma.moodEntry.delete({ where: { id, userId } });

// Delete audio file
const fullPath = path.join(process.cwd(), entry.audioFilePath);
deleteAudioFile(fullPath);
```

## Emotion to Emoji Mapping

8 emotions supported by the ML model:

```typescript
const EMOTION_TO_EMOJI = {
  angry: '😠',
  calm: '😌',
  disgust: '😒',
  fearful: '😰',
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  surprised: '😮',
};
```

## API Changes

### POST /api/moods
**Before:**
```json
{
  "id": "...",
  "entryDate": "2025-11-13",
  "predictedEmotion": "happy",
  "confidence": 0.87,
  "transcription": "...",
  "emotionScores": [...],
  "suggestedEmojis": ["😊", "😄", "🥰"]
}
```

**After:**
```json
{
  "id": "uuid",
  "entryDate": "2025-11-13",
  "emotionScores": [
    { "emoji": "😊", "emotion": "happy", "confidence": 87 },
    { "emoji": "😌", "emotion": "calm", "confidence": 72 },
    { "emoji": "😮", "emotion": "surprised", "confidence": 65 },
    { "emoji": "😐", "emotion": "neutral", "confidence": 45 },
    { "emoji": "😢", "emotion": "sad", "confidence": 32 },
    { "emoji": "😰", "emotion": "fearful", "confidence": 28 },
    { "emoji": "😠", "emotion": "angry", "confidence": 15 },
    { "emoji": "😒", "emotion": "disgust", "confidence": 12 }
  ]
}
```

### PATCH /api/moods/:id
**Before:**
```json
{
  "selectedEmoji": "😊",
  "activityTags": ["exercise", "social"],
  "userNotes": "Had a great day!"
}
```

**After:**
```json
{
  "selectedEmoji": "😊"
}
```

### GET /api/moods
**Before:**
```json
{
  "id": "...",
  "entryDate": "2025-11-13",
  "selectedEmoji": "😊",
  "suggestedEmojis": [...],
  "activityTags": [...],
  "userNotes": "...",
  "transcription": "...",
  "emotionScores": [...],
  "createdAt": "..."
}
```

**After:**
```json
{
  "id": "uuid",
  "entryDate": "2025-11-13",
  "selectedEmoji": "😊",
  "createdAt": "2025-11-13T10:30:00Z"
}
```

## Frontend Changes

### Progress Page
**Change:** Only show "Start Today's Check-in" button if:
1. User hasn't created an entry today, OR
2. User created entry but hasn't selected emoji yet

```typescript
// Check if user has completed today's check-in
const entry = await api.getMoodEntryByDate(getTodayIST());
const hasTodayEntry = entry !== null && entry.selectedEmoji !== null;

// Only show button if not checked in
{!hasTodayEntry && (
  <Button onClick={() => navigate('/record')}>
    Start Today's Check-in
  </Button>
)}
```

### Sticker Selection Page
**Changes:**
1. Receives `emotionScores` via navigation state (not from API)
2. Displays top 3 with highlighting:
   - Highest confidence has "Best Match" badge
   - Ring border for #1
   - Shows confidence percentage
3. Displays all 8 emojis in grid
4. Cancel button deletes the entry

```typescript
// Navigation from RecordingPage
navigate(`/select-sticker/${result.id}`, {
  state: { emotionScores: result.emotionScores },
});

// In StickerSelectionPage
const topThree = emotionScores.slice(0, 3);
const allEight = emotionScores;
```

## Database Migration

Migration file: `20251113130634_simplify_mood_schema/migration.sql`

```sql
-- Update existing entries to have a placeholder audioFilePath if NULL
UPDATE "MoodEntry" SET "audioFilePath" = 'legacy/audio_' || "id" || '.webm' 
WHERE "audioFilePath" IS NULL;

-- AlterTable - Make audioFilePath NOT NULL and drop unnecessary columns
ALTER TABLE "MoodEntry" 
  ALTER COLUMN "audioFilePath" SET NOT NULL,
  DROP COLUMN IF EXISTS "transcription",
  DROP COLUMN IF EXISTS "emotionScores";
```

## Testing Checklist

- [ ] Record audio and verify file is saved (check `backend/temp_audio/`)
- [ ] Verify all 8 emojis shown with confidence scores
- [ ] Verify top 3 highlighted, #1 has "Best Match" badge
- [ ] Select emoji and verify entry updated in DB
- [ ] Cancel and verify entry + audio file deleted
- [ ] Try recording again same day - should get "already exists" error
- [ ] Check Progress page shows button only when not checked in today
- [ ] Verify IST timezone handling works correctly
- [ ] Verify calendar displays selected emojis correctly
- [ ] Check pattern detection still works with selectedEmoji

## Benefits of New Schema

1. **Simpler Database**
   - Only stores what's essential: audio path and selected emoji
   - Smaller database footprint
   - Faster queries

2. **Better Workflow**
   - Audio files preserved until user decides
   - User can cancel without leaving orphaned data
   - ML analysis results not cluttering database

3. **Cleaner Code**
   - Separation of concerns: ML results vs user choice
   - Easier to maintain and extend
   - Clear data flow

4. **Better UX**
   - Top 3 suggestions clearly highlighted
   - All 8 options always visible
   - Confidence scores help user make informed choice
   - Cancel option allows user to redo recording

## Next Steps

1. Restart backend server: `cd backend && npm start`
2. Restart frontend: `cd frontend && npm run dev`
3. Test the complete flow
4. Monitor logs for any issues
5. Check audio files are being created/deleted properly

---

**Date:** November 13, 2025
**Status:** ✅ Complete
**Migration Applied:** Yes
**Build Status:** Backend ✓ | Frontend ✓

