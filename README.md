# HearMeOut - Daily Mood Journal 🎙️💚

A speech-based mental health monitoring web application that helps university students track their emotional well-being through daily voice recordings.

## 🌟 Features

- **Voice-Based Mood Tracking** - Record 30-60 second daily check-ins
- **Live Speech-to-Text** - Real-time transcription using Web Speech API
- **AI Emotion Analysis** - Automatic emotion detection using wav2vec2 model
- **Interactive Calendar** - Visual mood history with emoji stickers
- **Activity Tracking** - Associate moods with activities (exercise, social, work, etc.)
- **Progress Analytics** - Mood distribution charts and statistics
- **Pattern Detection** - Alerts when concerning patterns emerge
- **Multilingual Support** - English, Hindi, and Gujarati
- **Privacy-First** - Audio storage is optional and user-controlled

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Installation and configuration instructions
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with examples
- **[ML Service README](ml-service/README.md)** - ML service API documentation

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
- **Speech-to-Text**: Web Speech API (browser-native)

### Backend

- **Framework**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Auth**: Clerk Node SDK
- **Validation**: Zod
- **File Upload**: Multer

### ML Service

- **Framework**: Python Flask
- **Emotion Model**: wav2vec2-lg-xlsr-en-speech-emotion-recognition
- **Audio Processing**: librosa, torch, transformers
- **Supported Formats**: WAV, MP3, WebM, OGG

### Infrastructure

- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker and Docker Compose
- Clerk account (free)

### Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd HearMeOut

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Configure Clerk (see SETUP.md for details)
# Add CLERK_SECRET_KEY to backend/.env
# Add VITE_CLERK_PUBLISHABLE_KEY to frontend/.env

# 4. Start services
docker-compose up -d          # Start PostgreSQL + ML Service
cd backend && npx prisma migrate dev && npm run dev
cd frontend && npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5001
- ML Service: http://localhost:8000

**Detailed instructions:** See [SETUP.md](SETUP.md)

## 🗂️ Project Structure

```
HearMeOut/
├── backend/                   # Express + TypeScript API
│   ├── prisma/schema.prisma  # Database schema
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic (ML, pattern detection)
│   │   ├── middleware/       # Auth, error handling, file upload
│   │   └── utils/            # Date/time utilities
│   └── temp_audio/           # Temporary audio storage
│
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── components/       # UI components
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # API client, utilities
│   └── ...
│
├── ml-service/               # Flask + PyTorch emotion detection
│   ├── app.py               # Flask API
│   ├── config.py            # Configuration
│   ├── test_api.py          # API tests
│   └── wav2vec2-lg-xlsr-en-speech-emotion-recognition/  # Model files
│
├── docker-compose.yml        # PostgreSQL + ML Service
├── Makefile                  # Development commands
├── SETUP.md                  # Setup guide
└── API_DOCUMENTATION.md      # API reference
```

## 📝 API Overview

All endpoints require Clerk JWT authentication except `/health`.

### Key Endpoints

**Mood Entries:**
- `POST /api/moods` - Upload audio and create mood entry
- `PATCH /api/moods/:id` - Update mood entry (emoji, activities)
- `GET /api/moods` - Get mood entries with filters
- `GET /api/moods/date/:date` - Get mood entry for specific date

**Progress:**
- `GET /api/progress/summary` - Mood distribution and statistics
- `GET /api/progress/calendar/:year/:month` - Calendar view data
- `GET /api/progress/alerts` - Active pattern alerts
- `POST /api/progress/alerts/:id/dismiss` - Dismiss alert

**Activities:**
- `GET /api/activities` - List available activities
- `POST /api/activities` - Create custom activity

**Settings:**
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update settings

**Complete API documentation:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🎯 User Flow

### Daily Check-In

1. **Home** - View calendar with mood history
2. **Record** - Choose language and record 30-60 second voice note with live transcription
3. **Processing** - ML service analyzes audio and suggests emojis (8 emotions)
4. **Select** - Choose emoji that represents your mood
5. **Activities** - Optionally add activity tags (exercise, social, work, etc.)
6. **Done** - Entry appears on calendar

### Other Features

- **Progress** - View mood distribution charts and statistics
- **Alerts** - Pattern detection alerts for consecutive low moods
- **Settings** - Audio storage consent, reminder preferences, language
- **Data History** - View and manage past mood entries

## 🔒 Privacy & Security

### Audio File Handling

By default, audio files are deleted immediately after ML analysis:

1. Audio uploaded → Saved to `backend/temp_audio/`
2. ML analyzes → Emotion scores extracted
3. Audio deleted → Only emoji is stored in database

**Optional Audio Storage:** Users can consent to audio storage in Settings. When enabled, audio files are retained. When disabled, all stored audio is automatically deleted.

### Authentication

- Clerk manages authentication and user sessions
- All API endpoints validate JWT tokens
- User data isolated by Clerk user ID

## 🧪 Development

### Makefile Commands

```bash
make help          # Show all commands
make install       # Install all dependencies
make docker-up     # Start Docker services
make docker-down   # Stop Docker services
make db-migrate    # Run database migrations
make test-ml       # Test ML service
make clean         # Clean temp files
```

See [SETUP.md](SETUP.md) for detailed development workflow.

## 🐛 Troubleshooting

**ML Service timeout:** First startup takes 1-2 minutes to load models. Check logs: `docker-compose logs ml-service`

**Database errors:** Ensure PostgreSQL is running: `docker ps`

**Clerk auth fails:** Verify `.env` files have correct keys from Clerk dashboard

**Microphone not working:** Use Chrome/Edge, check browser permissions, ensure HTTPS or localhost

**Complete troubleshooting guide:** [SETUP.md](SETUP.md)

## 📊 Database Schema

**User** - Clerk user references and timestamps  
**MoodEntry** - Daily entries with emoji, audio path (optional), language, activities  
**Activity** - Predefined activities (exercise, social, work, etc.)  
**MoodEntryActivity** - Many-to-many relation between moods and activities  
**PatternAlert** - Detected mood patterns requiring attention  
**UserSettings** - User preferences and privacy controls

See `backend/prisma/schema.prisma` for complete schema.

## 🌍 Supported Languages

- English (`en`)
- Hindi (`hi`)
- Gujarati (`gu`)

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Disclaimer:** This is a mood tracking tool, not a diagnostic or treatment application. If you're experiencing mental health concerns, please consult a qualified mental health professional.

**Crisis Resources:**
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- International: [findahelpline.com](https://findahelpline.com)
