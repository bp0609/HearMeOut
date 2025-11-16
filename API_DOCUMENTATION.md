# API Documentation

Complete API reference for HearMeOut backend.

**Base URL:** `http://localhost:5001`

**Authentication:** All endpoints except `/health` require Clerk JWT token:
```
Authorization: Bearer <clerk_jwt_token>
```

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
      "activities": [
        { "key": "exercise", "label": "Exercise", "icon": "🏃" }
      ],
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
{
  "success": true,
  "data": [
    { "key": "exercise", "label": "Exercise", "icon": "🏃", "color": "#10B981" },
    { "key": "social", "label": "Social Time", "icon": "👥", "color": "#3B82F6" },
    { "key": "work", "label": "Work/Study", "icon": "💼", "color": "#8B5CF6" }
  ]
}
```

---

### Create Activity

`POST /api/activities`

Create custom activity.

**Request:**
```bash
curl -X POST http://localhost:5001/api/activities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "meditation",
    "label": "Meditation",
    "icon": "🧘",
    "color": "#A855F7"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "key": "meditation",
    "label": "Meditation",
    "icon": "🧘",
    "color": "#A855F7"
  }
}
```

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

## Health Check

`GET /health`

Check API and ML service status. **No authentication required.**

**Request:**
```bash
curl http://localhost:5001/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-11-16T10:30:00Z",
  "services": {
    "database": "healthy",
    "mlService": "healthy"
  }
}
```

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

```bash
# Authentication
Authorization: Bearer <clerk_jwt>

# Upload mood entry
POST /api/moods (multipart/form-data)

# Update entry with emoji
PATCH /api/moods/:id

# Get entries
GET /api/moods?startDate=2024-11-01&limit=30

# Get today's entry
GET /api/moods/date/2024-11-16

# Get progress
GET /api/progress/summary?days=30

# Get calendar
GET /api/progress/calendar/2024/11

# Get activities
GET /api/activities

# Update settings
PATCH /api/settings
```
