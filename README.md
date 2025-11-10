# HearMeOut - Daily Mood Journal 🎙️💚

A speech-based mental health monitoring web application that helps university students track their emotional well-being through daily voice recordings.

## 🌟 Features

- **Voice-Based Mood Tracking**: Record 30-60 second daily check-ins
- **AI Emotion Analysis**: Automatic emotion detection using Hugging Face transformers
- **Speech-to-Text**: Transcription of your recordings using OpenAI Whisper
- **Interactive Calendar**: Visual mood history with emoji stickers
- **Progress Analytics**: Mood distribution charts and weekly summaries
- **Pattern Detection**: Gentle interventions when concerning patterns emerge
- **Multilingual Support**: English, Hindi, and Gujarati
- **Privacy-First**: Audio files deleted immediately after processing

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ◄────► │   Backend   │ ◄────► │ ML Service  │
│ React + TS  │   API   │ Express+TS  │  HTTP   │ Flask+Python│
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ PostgreSQL  │
                        │  (Prisma)   │
                        └─────────────┘
```

## 📦 Tech Stack

### Frontend

- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: Clerk
- **Charts**: Recharts
- **HTTP**: Axios

### Backend

- **Framework**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Auth**: Clerk Node SDK
- **Validation**: Zod
- **File Upload**: Multer

### ML Service

- **Framework**: Python Flask
- **Emotion Model**: Hugging Face wav2vec2 (`ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition`)
- **Speech-to-Text**: OpenAI Whisper (base model)
- **Audio Processing**: librosa
- **Server**: Gunicorn

### Infrastructure

- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL in Docker

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Docker** and Docker Compose
- **Clerk Account** (for authentication)

### 1. Clone Repository

```bash
git clone <repository-url>
cd HearMeOut
```

### 2. Environment Setup

Create `.env` files from examples:

```bash
# Root
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Configure Clerk Authentication

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy keys to environment files:
   - `CLERK_PUBLISHABLE_KEY` → frontend/.env and backend/.env
   - `CLERK_SECRET_KEY` → backend/.env

### 4. Install Dependencies

```bash
# Install all dependencies
make install

# Or manually:
cd backend && npm install
cd ../frontend && npm install
cd ../ml-service && pip install -r requirements.txt
```

### 5. Start Services

```bash
# Start Docker services (PostgreSQL + ML Service)
docker-compose up -d

# Run database migrations
cd backend
npx prisma migrate dev
npx prisma generate

# Start backend (in backend directory)
npm run dev

# Start frontend (in frontend directory)
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **ML Service**: http://localhost:8000

## 🗂️ Project Structure

```
HearMeOut/
├── docker-compose.yml          # Docker orchestration
├── Makefile                    # Development commands
├── .env.example                # Environment template
│
├── backend/                    # Express backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── middleware/        # Auth, error handling, file upload
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   ├── app.ts            # Express app setup
│   │   └── server.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── ml-service/                # Python ML service
│   ├── utils/
│   │   ├── audio_processor.py    # Audio feature extraction
│   │   ├── emotion_detector.py   # Emotion classification
│   │   └── emoji_mapper.py       # Emotion→Emoji mapping
│   ├── app.py                # Flask application
│   ├── config.py             # Configuration
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Container setup
│
└── frontend/                  # React frontend
    ├── src/
    │   ├── components/        # UI components
    │   │   ├── ui/           # shadcn/ui components
    │   │   ├── Calendar/     # Calendar components
    │   │   ├── Recording/    # Voice recorder
    │   │   ├── Progress/     # Charts and analytics
    │   │   └── Layout/       # Navigation, containers
    │   ├── pages/            # Route pages
    │   ├── hooks/            # Custom React hooks
    │   ├── lib/              # Utils, API client, constants
    │   ├── types/            # TypeScript types
    │   ├── App.tsx           # Main app component
    │   └── main.tsx          # Entry point
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## 📝 API Documentation

### Authentication

All API endpoints require Bearer token authentication via Clerk.

```
Authorization: Bearer <clerk-session-token>
```

### Endpoints

#### Mood Entries

**POST /api/moods**
Upload audio and create mood entry

```bash
curl -X POST http://localhost:5001/api/moods \
  -H "Authorization: Bearer <token>" \
  -F "audio=@recording.wav" \
  -F "language=en" \
  -F "duration=45"
```

**PATCH /api/moods/:id**
Update mood entry with selected emoji

```json
{
  "selectedEmoji": "😊",
  "activityTags": ["exercise", "sleep_well"],
  "userNotes": "Had a great day!"
}
```

**GET /api/moods**
Get mood entries (with optional filters)

```
?startDate=2024-01-01&endDate=2024-01-31&limit=30
```

**GET /api/moods/date/:date**
Get mood entry for specific date

```
/api/moods/date/2024-01-15
```

#### Progress & Analytics

**GET /api/progress/summary**
Get mood distribution and statistics

```
?days=30
```

**GET /api/progress/calendar/:year/:month**
Get calendar data for a month

```
/api/progress/calendar/2024/1
```

**GET /api/progress/alerts**
Get active pattern alerts

**POST /api/progress/alerts/:id/dismiss**
Dismiss an alert

#### Settings

**GET /api/settings**
Get user settings

**PATCH /api/settings**
Update user settings

```json
{
  "reminderEnabled": true,
  "reminderTime": "20:00",
  "interventionThreshold": 5,
  "preferredLanguage": "en"
}
```

## 🎯 User Flows

### Primary Flow: Daily Check-In

1. **Home Page** → View calendar with mood history
2. Click **"Go for Today"** button
3. **Language Selection** → Choose recording language
4. **Recording** → Record 30-60 second voice note
   - Real-time waveform visualization
   - Timer countdown
   - Live transcription display
5. **Processing** → Audio analyzed by ML service
6. **Sticker Selection** → AI suggests 3 emojis, user selects one
7. **Optional Context** → Add activity tags and notes
8. **Done** → Return to calendar with new emoji

### Secondary Flows

- **View Progress**: Progress page shows mood distribution donut chart
- **Pattern Alerts**: Popup appears after 5+ consecutive low-mood days
- **Settings**: Customize reminder time, intervention threshold, language

## 🔒 Privacy & Security

### Audio File Handling

```
1. User records audio → Blob created in browser
2. Upload to backend → Saved to /temp_audio/
3. ML analysis → Emotion + transcription extracted
4. Store metadata only → No raw audio in database
5. DELETE audio file → Immediate permanent deletion
6. Return results → User sees suggestions
```

**CRITICAL**: Audio files are NEVER stored permanently. Only metadata (transcription, emotion scores, features) is saved.

### Authentication

- Clerk handles all user authentication
- JWT tokens validated on every request
- User data isolated by Clerk user ID
- Passwords never touch our servers

## 🧪 Development Commands

```bash
# Start all services
make start

# Stop all services
make stop

# View logs
make logs

# Run database migrations
make db-migrate

# Reset database (WARNING: deletes all data)
make db-reset

# Clean build artifacts
make clean
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps

# Restart database
docker-compose restart postgres

# Check connection
docker-compose logs postgres
```

### ML Service Not Responding

```bash
# Check ML service logs
docker-compose logs ml-service

# The first startup takes 1-2 minutes to download models
# Wait for "ML Service initialized successfully" message

# Rebuild ML service
docker-compose build ml-service
docker-compose up -d ml-service
```

### Clerk Authentication Issues

1. Verify environment variables are set correctly
2. Check Clerk dashboard for application status
3. Ensure frontend and backend have matching keys
4. Clear browser cache and try again

### Audio Recording Not Working

1. **Check microphone permissions** in browser
2. **HTTPS required** for mic access (use localhost for dev)
3. **Browser compatibility**: Chrome/Edge recommended
4. Check browser console for errors

## 📊 Database Schema

### Key Tables

**Users** → Stores Clerk user references
**MoodEntry** → Daily mood entries (one per day per user)
**PatternAlert** → Detected concerning patterns
**UserSettings** → User preferences

### Key Relationships

- User → MoodEntry (one-to-many)
- User → PatternAlert (one-to-many)
- User → UserSettings (one-to-one)

## 🎨 UI Components

### Calendar

- Month grid view with emoji stickers
- Week view for current week
- Navigation between months
- Click day to view details

### Voice Recorder

- Waveform visualization during recording
- 30-60 second timer
- Pause/resume functionality
- Live transcription display

### Sticker Picker

- 30+ emoji options organized by mood
- AI suggestions highlighted
- User can override suggestions

### Progress Dashboard

- Donut chart showing mood distribution
- Streak counter
- Weekly summary text
- "Need more data" state for new users

## 🌍 Multilingual Support

Currently supported languages:

- **English (en)** - Primary
- **Hindi (hi)** - हिन्दी
- **Gujarati (gu)** - ગુજરાતી

Add new languages by:

1. Update Whisper language code
2. Add to LANGUAGES constant
3. Update Prisma enum
4. Test transcription accuracy

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Voice memos playback (optional feature)
- [ ] Export data as PDF/CSV
- [ ] Share progress with therapist
- [ ] Reminder notifications
- [ ] Dark mode
- [ ] More languages
- [ ] Improved ML model accuracy
- [ ] Sentiment analysis trends
- [ ] Correlation with activity tags

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

This is a research project for CS-435 (HCI). Contributions welcome!

## 👥 Team

Built for university students to support mental health awareness.

## 📞 Support

For issues or questions:

- Open a GitHub issue
- Check troubleshooting section above
- Review API documentation

---

**Remember**: This is a mood journal, not a diagnostic tool. If you're experiencing mental health concerns, please reach out to a mental health professional.

**Crisis Resources**:

- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- International: [findahelpline.com](https://findahelpline.com)

## 🚧 Additional Frontend Components Needed

The following React components need to be created to complete the frontend. These follow the structure outlined in the project specification:

### UI Base Components (shadcn/ui)

Create these standard UI components in `frontend/src/components/ui/`:

- `button.tsx` - Button component
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialog
- `select.tsx` - Dropdown select
- `toast.tsx` - Toast notifications
- `toaster.tsx` - Toast container

### Pages (`frontend/src/pages/`)

- `HomePage.tsx` - Main calendar view with "Go for Today" button
- `RecordingPage.tsx` - Voice recording interface
- `StickerSelectionPage.tsx` - Emoji picker after recording
- `ProgressPage.tsx` - Analytics and charts
- `SettingsPage.tsx` - User settings

### Custom Hooks (`frontend/src/hooks/`)

- `useAudioRecorder.ts` - MediaRecorder API wrapper
- `useMoodData.ts` - Fetch and manage mood entries
- `useAuth.ts` - Clerk authentication helpers

### Feature Components

**Calendar** (`frontend/src/components/Calendar/`)

- `MoodCalendar.tsx` - Main calendar component
- `DayCell.tsx` - Individual day cell with emoji
- `MonthHeader.tsx` - Month navigation

**Recording** (`frontend/src/components/Recording/`)

- `VoiceRecorder.tsx` - Recording controls
- `Waveform.tsx` - Audio visualization
- `LanguageSelector.tsx` - Language dropdown

**Progress** (`frontend/src/components/Progress/`)

- `MoodDonutChart.tsx` - Recharts donut chart
- `WeeklySummary.tsx` - Text summary card
- `AlertDialog.tsx` - Pattern alert popup

These components can be generated based on the patterns established in the backend and the design specifications provided. Use the API client (`src/lib/api.ts`) and types (`src/types/index.ts`) already created.
