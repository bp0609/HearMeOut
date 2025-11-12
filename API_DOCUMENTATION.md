# API Documentation

This document provides a brief overview of all available APIs in the HearMeOut application.

**Base URL:** `http://localhost:5001` (or your configured API URL)

**Authentication:** All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <clerk_jwt_token>
```

---

## Table of Contents

- [Mood Entry APIs](#mood-entry-apis)
- [Progress & Analytics APIs](#progress--analytics-apis)
- [Settings APIs](#settings-apis)
- [Health Check API](#health-check-api)

---

## Mood Entry APIs

### 1. Create Mood Entry (Upload Audio)

Upload an audio recording and create a mood entry with ML analysis.

**Endpoint:** `POST /api/moods`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**

- `audio` (File): Audio file (WAV, WEBM, OGG, MP3) - Max 10MB
- `language` (string): Language code - `en`, `hi`, or `gu`
- `duration` (number): Recording duration in seconds (30-60)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mood-entry-id",
    "entryDate": "2024-01-15",
    "transcription": "I had a great day today...",
    "emotionScores": [
      { "emotion": "happy", "score": 0.85 },
      { "emotion": "neutral", "score": 0.1 }
    ],
    "suggestedEmojis": ["😊", "😄", "🥰"]
  }
}
```

**Example:**

```javascript
const formData = new FormData();
formData.append("audio", audioFile);
formData.append("language", "en");
formData.append("duration", "45");

const response = await fetch("http://localhost:5001/api/moods", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

**Error Responses:**

- `400`: Invalid file or missing required fields
- `409`: Mood entry for today already exists
- `500`: Server error or ML service unavailable

---

### 2. Update Mood Entry

Update a mood entry with selected emoji and optional context.

**Endpoint:** `PATCH /api/moods/:id`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "selectedEmoji": "😊",
  "activityTags": ["exercise", "social_time"],
  "userNotes": "Had a great workout today!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mood-entry-id",
    "selectedEmoji": "😊",
    "activityTags": ["exercise", "social_time"]
  }
}
```

**Example:**

```javascript
const response = await fetch("http://localhost:5001/api/moods/mood-entry-id", {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    selectedEmoji: "😊",
    activityTags: ["exercise"],
    userNotes: "Great day!",
  }),
});
```

---

### 3. Get Mood Entries

Retrieve mood entries for the authenticated user with optional date filtering.

**Endpoint:** `GET /api/moods`

**Query Parameters:**

- `startDate` (optional): Start date filter (ISO format: `YYYY-MM-DD`)
- `endDate` (optional): End date filter (ISO format: `YYYY-MM-DD`)
- `limit` (optional): Maximum number of entries to return (default: 30)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "mood-entry-id",
      "entryDate": "2024-01-15",
      "selectedEmoji": "😊",
      "suggestedEmojis": ["😊", "😄", "🥰"],
      "activityTags": ["exercise"],
      "userNotes": "Great day!",
      "transcription": "I had a great day...",
      "emotionScores": [...],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Example:**

```javascript
// Get last 30 entries
const response = await fetch("http://localhost:5001/api/moods?limit=30", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Get entries for date range
const response = await fetch(
  "http://localhost:5001/api/moods?startDate=2024-01-01&endDate=2024-01-31",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
```

---

### 4. Get Mood Entry by Date

Get a specific mood entry for a given date.

**Endpoint:** `GET /api/moods/date/:date`

**Path Parameters:**

- `date`: Date in ISO format (`YYYY-MM-DD`)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mood-entry-id",
    "entryDate": "2024-01-15",
    "selectedEmoji": "😊",
    "suggestedEmojis": ["😊", "😄"],
    "activityTags": ["exercise"],
    "userNotes": "Great day!",
    "transcription": "I had a great day...",
    "emotionScores": [...],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Note:** Returns `null` if no entry exists for that date (not an error).

**Example:**

```javascript
const response = await fetch(
  "http://localhost:5001/api/moods/date/2024-01-15",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
```

---

### 5. Delete Mood Entry

Delete a mood entry.

**Endpoint:** `DELETE /api/moods/:id`

**Response:**

```json
{
  "success": true,
  "message": "Mood entry deleted"
}
```

**Example:**

```javascript
const response = await fetch("http://localhost:5001/api/moods/mood-entry-id", {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## Progress & Analytics APIs

### 1. Get Progress Summary

Get mood distribution, streak, and weekly summary statistics.

**Endpoint:** `GET /api/progress/summary`

**Query Parameters:**

- `days` (optional): Number of days to analyze (default: 30)

**Response:**

```json
{
  "success": true,
  "data": {
    "moodDistribution": [
      {
        "emoji": "😊",
        "count": 15,
        "percentage": 50
      },
      {
        "emoji": "😐",
        "count": 10,
        "percentage": 33
      }
    ],
    "totalEntries": 30,
    "streakDays": 7,
    "weeklySummary": "You've had a great week! Your positive energy is shining through.",
    "hasEnoughData": true
  }
}
```

**Example:**

```javascript
// Get summary for last 30 days
const response = await fetch("http://localhost:5001/api/progress/summary", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Get summary for last 60 days
const response = await fetch(
  "http://localhost:5001/api/progress/summary?days=60",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
```

---

### 2. Get Calendar Data

Get mood entries for a specific month in calendar format.

**Endpoint:** `GET /api/progress/calendar/:year/:month`

**Path Parameters:**

- `year`: Year (e.g., `2024`)
- `month`: Month (1-12)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "emoji": "😊"
    },
    {
      "date": "2024-01-16",
      "emoji": "😐"
    }
  ]
}
```

**Example:**

```javascript
// Get calendar data for January 2024
const response = await fetch(
  "http://localhost:5001/api/progress/calendar/2024/1",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
```

---

### 3. Get Active Alerts

Get all active (non-dismissed) pattern alerts for the user.

**Endpoint:** `GET /api/progress/alerts`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "alert-id",
      "alertType": "consecutive_low",
      "detectedAt": "2024-01-15T10:30:00Z",
      "message": "We've noticed you've been feeling low for 5 days in a row...",
      "suggestions": [
        "Try a 10-minute guided meditation",
        "Take a short walk outside",
        "Talk to a trusted friend or family member"
      ]
    }
  ]
}
```

**Alert Types:**

- `consecutive_low`: Multiple consecutive days with low mood
- `sudden_drop`: Sudden mood drop from positive to negative

**Example:**

```javascript
const response = await fetch("http://localhost:5001/api/progress/alerts", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 4. Dismiss Alert

Mark an alert as dismissed.

**Endpoint:** `POST /api/progress/alerts/:id/dismiss`

**Path Parameters:**

- `id`: Alert ID

**Response:**

```json
{
  "success": true,
  "message": "Alert dismissed"
}
```

**Example:**

```javascript
const response = await fetch(
  "http://localhost:5001/api/progress/alerts/alert-id/dismiss",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
```

---

## Settings APIs

### 1. Get User Settings

Retrieve user settings and preferences.

**Endpoint:** `GET /api/settings`

**Response:**

```json
{
  "success": true,
  "data": {
    "reminderEnabled": true,
    "reminderTime": "09:00",
    "interventionThreshold": 5,
    "cloudStorageEnabled": false,
    "preferredLanguage": "en"
  }
}
```

**Example:**

```javascript
const response = await fetch("http://localhost:5001/api/settings", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

### 2. Update User Settings

Update user settings and preferences.

**Endpoint:** `PATCH /api/settings`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "reminderEnabled": true,
  "reminderTime": "09:00",
  "interventionThreshold": 5,
  "cloudStorageEnabled": false,
  "preferredLanguage": "en"
}
```

**Field Descriptions:**

- `reminderEnabled` (boolean): Enable/disable daily reminders
- `reminderTime` (string): Time in 24-hour format (HH:MM)
- `interventionThreshold` (number): Days of consecutive low mood before alert (3-14)
- `cloudStorageEnabled` (boolean): Enable cloud storage (future feature)
- `preferredLanguage` (string): Language preference - `en`, `hi`, or `gu`

**Response:**

```json
{
  "success": true,
  "data": {
    "reminderEnabled": true,
    "reminderTime": "09:00",
    "interventionThreshold": 5,
    "cloudStorageEnabled": false,
    "preferredLanguage": "en"
  }
}
```

**Example:**

```javascript
const response = await fetch("http://localhost:5001/api/settings", {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    reminderEnabled: true,
    reminderTime: "09:00",
    interventionThreshold: 5,
    preferredLanguage: "en",
  }),
});
```

---

## Health Check API

### Health Check

Check the health status of the API and ML service.

**Endpoint:** `GET /health`

**No Authentication Required**

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "api": "healthy",
    "mlService": "healthy"
  }
}
```

**Example:**

```javascript
const response = await fetch("http://localhost:5001/health");
const data = await response.json();
console.log(data);
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `201`: Created (for POST requests)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing or invalid token)
- `404`: Not Found
- `409`: Conflict (e.g., duplicate entry)
- `500`: Internal Server Error
- `503`: Service Unavailable (e.g., ML service down)

---

## Notes

1. **Audio File Storage**: Audio files are temporarily stored during processing and immediately deleted after ML analysis. Only the analysis results (transcription, emotion scores, etc.) are stored in the database.

2. **Daily Entry Limit**: Only one mood entry per day is allowed per user. Attempting to create a second entry for the same day will return a 409 Conflict error.

3. **Pattern Detection**: Pattern detection (alerts) runs automatically after a user selects an emoji for their mood entry.

4. **ML Service**: The ML service must be running separately on port 8000 (or configured URL) for audio analysis to work.

5. **Authentication**: All endpoints except `/health` and `/` require valid Clerk JWT authentication.
