# API Documentation

Complete API reference for HearMeOut backend.

**Base URL:** `http://localhost:5001`

```
Authorization: Bearer <clerk_jwt_token>
```

---

## Table of Contents

1. [Mood Entry APIs](#mood-entry-apis) - Create, update, retrieve, and delete mood entries
2. [Progress & Analytics APIs](#progress--analytics-apis) - Get insights, trends, and pattern alerts
3. [Activities APIs](#activities-apis) - Manage activities and view statistics
4. [Settings APIs](#settings-apis) - User preferences and consent management
5. [Audio Recording APIs](#audio-recording-apis) - Manage stored audio recordings
6. [Error Responses](#error-responses) - Standard error formats
7. [Important Notes](#important-notes) - Key information about the API
8. [Quick Reference](#quick-reference) - All endpoints at a glance

---

## Mood Entry APIs

### Create Mood Entry

`POST /api/moods`

Upload audio and create mood entry with ML analysis.

**Request:**

```bash
curl -X POST http://localhost:5001/api/moods \
  -H "Authorization: Bearer <token>" \
  -F "audio=@recording.webm" \
  -F "language=en" \
  -F "duration=45"
```

**Request Fields:**

- `audio` (file): Audio file (WAV, WEBM, OGG, MP3) - Max 10MB
- `language` (string): `en`, `hi`, or `gu`
- `duration` (number): 30-60 seconds

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "clp8k9xyz...",
    "entryDate": "2024-11-16",
    "emotionScores": [
      { "emoji": "😊", "emotion": "happy", "confidence": 85 },
      { "emoji": "😌", "emotion": "calm", "confidence": 10 },
      { "emoji": "😐", "emotion": "neutral", "confidence": 3 },
      { "emoji": "😮", "emotion": "surprised", "confidence": 1 },
      { "emoji": "😢", "emotion": "sad", "confidence": 1 },
      { "emoji": "😠", "emotion": "angry", "confidence": 0 },
      { "emoji": "😒", "emotion": "disgust", "confidence": 0 },
      { "emoji": "😰", "emotion": "fearful", "confidence": 0 }
    ]
  }
}
```

**Errors:**

- `400` - Invalid file or missing fields
- `409` - Entry already exists for today
- `500` - ML service unavailable

---

### Update Mood Entry

`PATCH /api/moods/:id`

Update mood entry with selected emoji and activities.

**Request:**

```bash
curl -X PATCH http://localhost:5001/api/moods/clp8k9xyz... \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedEmoji": "😊",
    "activityKeys": ["exercise", "social"]
  }'
```

**Request Body:**

```json
{
  "selectedEmoji": "😊",
  "activityKeys": ["exercise", "social", "work"]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clp8k9xyz...",
    "selectedEmoji": "😊",
    "activities": [
      { "key": "exercise", "label": "Exercise", "icon": "🏃" },
      { "key": "social", "label": "Social Time", "icon": "👥" }
    ]
  }
}
```

---

### Get Mood Entries

`GET /api/moods`

Get mood entries with optional date filtering.

**Query Parameters:**

- `startDate` (optional): `YYYY-MM-DD`
- `endDate` (optional): `YYYY-MM-DD`
- `limit` (optional): Max entries (default: 30)

**Request:**

```bash
curl http://localhost:5001/api/moods?startDate=2024-11-01&limit=10 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clp8k9xyz...",
      "entryDate": "2024-11-16",
      "dayOfWeek": "Sat",
      "selectedEmoji": "😊",
      "activities": [{ "key": "exercise", "label": "Exercise", "icon": "🏃" }],
      "duration": 45,
      "language": "en",
      "createdAt": "2024-11-16T10:30:00Z"
    }
  ]
}
```

---

### Get Mood Entry by Date

`GET /api/moods/date/:date`

Get entry for specific date.

**Request:**

```bash
curl http://localhost:5001/api/moods/date/2024-11-16 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clp8k9xyz...",
    "entryDate": "2024-11-16",
    "selectedEmoji": "😊",
    "activities": [...],
    "createdAt": "2024-11-16T10:30:00Z"
  }
}
```

Returns `data: null` if no entry exists.

---

### Delete Mood Entry

`DELETE /api/moods/:id`

Delete a mood entry and associated audio file (if stored).

**Request:**

```bash
curl -X DELETE http://localhost:5001/api/moods/clp8k9xyz... \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Mood entry deleted successfully"
}
```

---

## Progress & Analytics APIs

### Get Progress Summary

`GET /api/progress/summary`

Mood distribution and statistics.

**Query Parameters:**

- `days` (optional): Analysis period (default: 30)

**Request:**

```bash
curl http://localhost:5001/api/progress/summary?days=30 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "moodDistribution": [
      { "emoji": "😊", "count": 15, "percentage": 50 },
      { "emoji": "😐", "count": 10, "percentage": 33 },
      { "emoji": "😢", "count": 5, "percentage": 17 }
    ],
    "totalEntries": 30,
    "streakDays": 7,
    "hasEnoughData": true
  }
}
```

---

### Get Calendar Data

`GET /api/progress/calendar/:year/:month`

Mood entries for calendar view.

**Request:**

```bash
curl http://localhost:5001/api/progress/calendar/2024/11 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    { "date": "2024-11-15", "emoji": "😊" },
    { "date": "2024-11-16", "emoji": "😌" }
  ]
}
```

---

### Get Active Alerts

`GET /api/progress/alerts`

Pattern detection alerts (non-dismissed).

**Request:**

```bash
curl http://localhost:5001/api/progress/alerts \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "alert_123",
      "alertType": "consecutive_low",
      "detectedAt": "2024-11-16T10:30:00Z",
      "patternDetails": {
        "consecutiveDays": 5,
        "emotions": ["sad", "sad", "fearful", "sad", "sad"]
      }
    }
  ]
}
```

**Alert Types:**

- `consecutive_low` - Multiple low mood days in a row
- `sudden_drop` - Abrupt change from positive to negative

---

### Dismiss Alert

`POST /api/progress/alerts/:id/dismiss`

Mark alert as dismissed.

**Request:**

```bash
curl -X POST http://localhost:5001/api/progress/alerts/alert_123/dismiss \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Alert dismissed successfully"
}
```

---

### Get Weekday Distribution

`GET /api/progress/weekday-distribution`

Get mood distribution grouped by day of week.

**Query Parameters:**

- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)

**Request:**

```bash
curl http://localhost:5001/api/progress/weekday-distribution?year=2024&month=11 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "Sun": { "😊": 2, "😐": 1 },
    "Mon": { "😢": 3, "😐": 2 },
    "Tue": { "😊": 4, "😌": 1 },
    "Wed": { "😐": 3 },
    "Thu": { "😊": 2, "😢": 1 },
    "Fri": { "😊": 5 },
    "Sat": { "😌": 3, "😊": 2 }
  }
}
```

---

### Get Mood Trend

`GET /api/progress/mood-trend`

Get mood trend over time with associated activities (for line charts).

**Query Parameters:**

- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)

**Request:**

```bash
curl http://localhost:5001/api/progress/mood-trend?year=2024&month=11 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-11-01",
      "emoji": "😊",
      "activityKeys": ["exercise", "social"]
    },
    {
      "date": "2024-11-02",
      "emoji": "😐",
      "activityKeys": ["work"]
    }
  ]
}
```

---

### Get Mood Counts

`GET /api/progress/mood-counts`

Get total count for each mood emoji.

**Query Parameters:**

- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)

**Request:**

```bash
curl http://localhost:5001/api/progress/mood-counts?year=2024 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "moodCounts": {
      "😊": 45,
      "😐": 20,
      "😢": 10,
      "😌": 15,
      "😠": 5
    },
    "totalEntries": 95
  }
}
```

---

## Activities APIs

### Get Activities

`GET /api/activities`

List all available activities.

**Request:**

```bash
curl http://localhost:5001/api/activities \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
[
  {
    "key": "exercise",
    "label": "Exercise",
    "icon": "🏃",
    "color": "#10B981",
    "order": 1
  },
  {
    "key": "social",
    "label": "Social Time",
    "icon": "👥",
    "color": "#3B82F6",
    "order": 2
  },
  {
    "key": "work",
    "label": "Work/Study",
    "icon": "💼",
    "color": "#8B5CF6",
    "order": 3
  }
]
```

---

### Get Activity Statistics

`GET /api/activities/stats`

Get activity frequency statistics for the authenticated user.

**Query Parameters:**

- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)

**Request:**

```bash
curl http://localhost:5001/api/activities/stats?year=2024&month=11 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "stats": [
    {
      "activityKey": "exercise",
      "activity": {
        "key": "exercise",
        "label": "Exercise",
        "icon": "🏃",
        "color": "#10B981"
      },
      "count": 15,
      "percentage": 50
    },
    {
      "activityKey": "social",
      "activity": {
        "key": "social",
        "label": "Social Time",
        "icon": "👥",
        "color": "#3B82F6"
      },
      "count": 10,
      "percentage": 33
    }
  ],
  "totalEntries": 30
}
```

---

### Get Mood-Activity Correlation

`GET /api/activities/mood-correlation`

Get correlation data showing average mood level for each activity.

**Query Parameters:**

- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)

**Request:**

```bash
curl http://localhost:5001/api/activities/mood-correlation?year=2024 \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "correlations": [
    {
      "activityKey": "exercise",
      "activity": { "key": "exercise", "label": "Exercise", "icon": "🏃" },
      "averageMood": 7.5,
      "count": 15
    },
    {
      "activityKey": "work",
      "activity": { "key": "work", "label": "Work/Study", "icon": "💼" },
      "averageMood": 5.2,
      "count": 20
    }
  ],
  "totalEntries": 30
}
```

**Note:** Mood levels range from 1 (angry) to 9 (very calm/happy), with 5 being neutral.

---

## Settings APIs

### Get Settings

`GET /api/settings`

Get user settings and preferences.

**Request:**

```bash
curl http://localhost:5001/api/settings \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "reminderEnabled": false,
    "reminderTime": "20:00",
    "interventionThreshold": 5,
    "audioStorageEnabled": false,
    "audioStorageConsent": null,
    "preferredLanguage": "en"
  }
}
```

---

### Update Settings

`PATCH /api/settings`

Update user settings.

**Request:**

```bash
curl -X PATCH http://localhost:5001/api/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reminderEnabled": true,
    "reminderTime": "09:00",
    "interventionThreshold": 3,
    "audioStorageEnabled": true,
    "preferredLanguage": "en"
  }'
```

**Request Body:**

```json
{
  "reminderEnabled": true,
  "reminderTime": "09:00",
  "interventionThreshold": 5,
  "audioStorageEnabled": false,
  "preferredLanguage": "en"
}
```

**Fields:**

- `reminderEnabled` (boolean): Daily reminders
- `reminderTime` (string): 24-hour format `HH:MM`
- `interventionThreshold` (number): Days before alert (3-14)
- `audioStorageEnabled` (boolean): Store audio files
- `preferredLanguage` (string): `en`, `hi`, or `gu`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "reminderEnabled": true,
    "reminderTime": "09:00",
    "interventionThreshold": 5,
    "audioStorageEnabled": false,
    "preferredLanguage": "en"
  }
}
```

**Note:** Disabling `audioStorageEnabled` automatically deletes all stored audio files.

---

### Set Audio Storage Consent

`POST /api/settings/consent`

Set first-time audio storage consent.

**Request:**

```bash
curl -X POST http://localhost:5001/api/settings/consent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "consent": true
  }'
```

**Request Body:**

```json
{
  "consent": true
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "audioStorageConsent": true,
    "audioStorageEnabled": true,
    "consentGivenAt": "2024-11-16T10:30:00Z"
  }
}
```

**Note:** This endpoint is used when a user first enables audio storage. Setting consent to `true` also enables audio storage, while `false` keeps it disabled.

---

## Audio Recording APIs

### Get Audio Recordings

`GET /api/audio/recordings`

Get all stored audio recordings for the authenticated user.

**Request:**

```bash
curl http://localhost:5001/api/audio/recordings \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "recordings": [
      {
        "id": "clp8k9xyz...",
        "entryDate": "2024-11-16T00:00:00Z",
        "dayOfWeek": "Sat",
        "duration": 45,
        "language": "en",
        "selectedEmoji": "😊",
        "createdAt": "2024-11-16T10:30:00Z",
        "fileExists": true,
        "audioFilePath": "temp_audio/user_xxx_123456.webm"
      }
    ],
    "totalCount": 1
  }
}
```

**Note:** Returns empty array if audio storage is not enabled.

---

### Play Audio Recording

`GET /api/audio/recordings/:entryId/play`

Stream audio file for playback.

**Request:**

```bash
curl http://localhost:5001/api/audio/recordings/clp8k9xyz.../play \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

Returns audio stream with headers:

- `Content-Type: audio/webm`
- `Content-Length: <file_size>`
- `Accept-Ranges: bytes`
- `Cache-Control: no-cache`

**Errors:**

- `403` - Unauthorized to access this recording
- `404` - Recording not found or audio file doesn't exist

---

### Delete Audio Recording

`DELETE /api/audio/recordings/:entryId`

Delete a specific audio recording file (keeps the mood entry).

**Request:**

```bash
curl -X DELETE http://localhost:5001/api/audio/recordings/clp8k9xyz... \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Audio recording deleted successfully"
}
```

**Note:** This only deletes the audio file, not the mood entry itself. Use `DELETE /api/moods/:id` to delete the entire mood entry.

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error
- `503` - Service Unavailable (ML service down)

---

## Important Notes

1. **Audio Storage**: By default, audio is deleted after analysis. Users can enable storage in Settings.

2. **Daily Limit**: One mood entry per user per day. Second attempt returns `409 Conflict`.

3. **Pattern Detection**: Automatically runs after emoji selection to detect concerning patterns.

4. **Time Zone**: All dates use IST (Indian Standard Time) for consistency.

5. **Authentication**: Clerk JWT required for all endpoints except `/health`.

---

## Quick Reference

### Mood Entry Endpoints

```bash
POST   /api/moods                    # Upload audio and create mood entry
PATCH  /api/moods/:id                # Update entry with emoji/activities
GET    /api/moods                    # Get mood entries (with filters)
GET    /api/moods/date/:date         # Get entry for specific date
DELETE /api/moods/:id                # Delete mood entry
```

### Progress & Analytics Endpoints

```bash
GET    /api/progress/summary                  # Get mood distribution & stats
GET    /api/progress/calendar/:year/:month    # Get calendar data
GET    /api/progress/alerts                   # Get active pattern alerts
POST   /api/progress/alerts/:id/dismiss       # Dismiss an alert
GET    /api/progress/weekday-distribution     # Mood by day of week
GET    /api/progress/mood-trend               # Mood trend over time
GET    /api/progress/mood-counts              # Total count per emoji
```

### Activity Endpoints

```bash
GET    /api/activities                # Get all activities
GET    /api/activities/stats          # Get activity statistics
GET    /api/activities/mood-correlation  # Mood-activity correlation
```

### Settings Endpoints

```bash
GET    /api/settings         # Get user settings
PATCH  /api/settings         # Update settings
POST   /api/settings/consent # Set audio storage consent
```

### Audio Recording Endpoints

```bash
GET    /api/audio/recordings                # Get all recordings
GET    /api/audio/recordings/:entryId/play # Stream audio file
DELETE /api/audio/recordings/:entryId      # Delete audio file
```

### Authentication

All endpoints except `/health` require:

```bash
Authorization: Bearer <clerk_jwt_token>
```
