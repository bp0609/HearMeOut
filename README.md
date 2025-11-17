# HearMeOut: A mood journaling app

A speech-based mental health monitoring web application that helps university students track their emotional well-being through daily voice recordings. Record your mood in 30-60 seconds, get AI-powered emotion analysis, and track patterns over time.

---

## 🔄 User Flow Demo

<div align="center">
  <img src="AppImages/UserFlow.gif" alt="HearMeOut User Flow Demo" width="800" style="border: 3px solid #4CAF50; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
  <p><em><strong>📱 See HearMeOut in action - Complete mood tracking workflow from recording to insights</strong></em></p>
</div>
---

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Installation and configuration instructions
- **[API Documentation](API_DOCUMENTATION.md)** - Complete REST API reference with 24 endpoints covering mood entries, progress analytics, activities, settings, and audio management
- **[ML Service README](ml-service/README.md)** - ML service API documentation and emotion detection details

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: Clerk
- **Charts**: Recharts
- **Speech-to-Text**: Web Speech API (browser-native)

### Backend

- **Framework**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Auth**: Clerk Node SDK
- **File Upload**: Multer

### ML Service

- **Framework**: Python Flask
- **Model**: wav2vec2-lg-xlsr-en-speech-emotion-recognition
- **Audio Processing**: librosa, torch, transformers
- **Supported Formats**: WAV, MP3, WebM, OGG

### Infrastructure

- **Containerization**: Docker + Docker Compose

---

## 🏗️ System Architecture

### Overview

![System Architecture](SystemArchitectureImages/SysArch.png)

### Detailed Architecture

![Detailed System Architecture](<SystemArchitectureImages/sys-arch(detailed).png>)

### Docker Architecture

![Docker Architecture](SystemArchitectureImages/DockerArch.png)

### Components

#### Frontend

- React with TypeScript
- Real-time speech-to-text using Web Speech API
- Interactive calendar with mood visualization
- Progress analytics with charts
- Clerk authentication integration

#### Backend

- RESTful API with Express.js
- Prisma ORM for database operations
- Pattern detection service for mood analysis
- File upload handling with Multer
- JWT-based authentication using Clerk Node SDK

#### ML Service

- Flask API for emotion detection
- Pre-trained Wav2Vec2 model
- 8 emotion classifications
- Confidence scoring for each emotion

#### Database

- PostgreSQL with Prisma schema
- User settings and preferences
- Mood entries with activities
- Pattern alerts tracking

![Database Schema](SystemArchitectureImages/DBSchema.png)

### API Flow

![API Flows](SystemArchitectureImages/APIFlows.png)

### ML Model Output

![Model Output](SystemArchitectureImages/ModelOutput.png)

---

## 🚀 Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker and Docker Compose
- Clerk account (free at [clerk.com](https://clerk.com))

### Quick Start

**1. Clone repository**

```bash
git clone <repository-url>
cd HearMeOut
```

**2. Get Clerk API Keys**

- Sign up at [clerk.com](https://clerk.com)
- Create a new application
- Copy Publishable Key and Secret Key

**3. Configure environment**

Copy example files and update with your Clerk keys:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env`:

```bash
DATABASE_URL="postgresql://admin:devpassword@localhost:5432/mood_journal"
CLERK_SECRET_KEY="sk_test_your_secret_key_here"  # Replace with your Clerk secret key
ML_SERVICE_URL="http://ml-service:8000"
PORT=5001
```

Update `frontend/.env`:

```bash
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"  # Replace with your Clerk publishable key
VITE_API_URL="http://localhost:5001"
```

**4. Install dependencies**

```bash
make install
# or manually: cd backend && npm install && cd ../frontend && npm install
```

**5. Download ML Model**

Download the pre-trained model from [OneDrive Link](https://iitgnacin-my.sharepoint.com/:u:/g/personal/22110098_iitgn_ac_in1/ERKzT030GVdHo8w0YrRFEvABpVxMuRPxxTZjXlU1SLsi7w?e=ppMZGc) and extract to `ml-service/wav2vec2-lg-xlsr-en-speech-emotion-recognition/` folder.

**6. Start services**

```bash
# Start Docker services (PostgreSQL + ML Service)
make docker-up

# Setup database (first time only)
make db-migrate

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev
```

**Access the application:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- ML Service: http://localhost:8000

> **Note:** ML service takes 1-2 minutes to load models on first startup. Check logs: `docker-compose logs -f ml-service`

For detailed instructions, see [SETUP.md](SETUP.md)

---

## ✨ Features

### Voice-Based Mood Tracking

Record 30-60 second daily check-ins with your voice.

![Recording Interface](AppImages/7.png)

### Live Speech-to-Text

Real-time transcription of your voice using Web Speech API.

![Speech-to-Text](AppImages/9.png)

### AI Emotion Analysis

Automatic emotion detection using wav2vec2 model with confidence scores for 8 emotions.

![Emotion Analysis](AppImages/13.png)

### Interactive Calendar

Visual mood history with emoji stickers for each day.

![Calendar View](AppImages/29.png)

### Activity Tracking

Associate your moods with activities like exercise, social time, work, hobbies, and more.

![Activity Selection](AppImages/16.png)

### Progress Analytics

Comprehensive analytics with multiple visualizations:

- **Mood Distribution** - Pie charts showing emotion frequency
- **Weekday Trends** - See which days you feel best/worst
- **Mood Timeline** - Track emotional changes over time
- **Mood-Activity Correlation** - Discover which activities improve your mood

![Progress Dashboard](AppImages/34.png)

![Mood Distribution](AppImages/35.png)
![Mood Distribution](AppImages/36.png)
![Mood Distribution](AppImages/39.png)

### Pattern Detection

Get alerts when concerning patterns emerge, such as consecutive low mood days.

![Pattern Alerts](AppImages/41.png)

### Privacy Controls & Audio Management

Complete control over your audio recordings:

- **Optional Audio Storage** - Choose whether to store recordings
- **Consent Management** - Clear consent process for audio storage
- **View Recordings** - Access all your stored audio files
- **Playback** - Listen to past recordings anytime
- **Delete Anytime** - Remove individual recordings or disable storage to delete all

![Privacy Settings](AppImages/25.png)
![Data History](AppImages/21.png)

---

## 📝 Detailed User Journey

### Daily Check-In Flow

1. **Home** - View calendar with mood history and current streak
2. **Record** - Choose language and record 30-60 second voice note
3. **Transcription** - Watch live speech-to-text as you speak
4. **Processing** - ML service analyzes audio and suggests emotions
5. **Select Emoji** - Choose the emoji that best represents your mood
6. **Add Activities** - Optionally tag activities related to your mood
7. **Complete** - Entry saved and appears on calendar

### Additional Features

- **Progress Tab** - View mood distribution, weekday trends, timeline charts, and activity statistics
- **Pattern Alerts** - Receive notifications for concerning mood patterns with helpful suggestions
- **Settings** - Manage audio storage consent, reminders, intervention thresholds, and language preferences
- **Audio Library** - View, playback, and manage all stored audio recordings
- **Data Management** - View, edit, and delete past mood entries

---

## 🔒 Privacy & Security

### Audio File Handling

By default, audio files are deleted immediately after ML analysis:

1. Audio uploaded → Saved to `backend/temp_audio/`
2. ML analyzes → Emotion scores extracted
3. Audio file deleted (unless storage enabled)

**Optional Audio Storage:**

- Users must explicitly consent to audio storage in Settings
- When enabled, audio files are retained and accessible via Audio Library
- Users can view all recordings, play them back, or delete individual files
- When storage is disabled, all stored audio is automatically deleted
- Provides complete transparency and control over personal data

### Authentication

- Clerk manages all authentication and user sessions
- All API endpoints validate JWT tokens
- User data is isolated by Clerk user ID
- Secure, privacy-first design

---

## 🗂️ Project Structure

```
HearMeOut/
├── backend/                   # Express + TypeScript API
│   ├── prisma/schema.prisma  # Database schema
│   ├── src/
│   │   ├── routes/           # API endpoints (mood, progress, activities, settings, audio)
│   │   ├── services/         # Business logic (ML, pattern detection, Prisma)
│   │   ├── middleware/       # Auth, error handling, file upload
│   │   └── utils/            # Date utilities
│   └── temp_audio/           # Temporary/stored audio files
│
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── components/       # UI components
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # API client, utilities
│   └── ...
│
├── ml-service/               # Flask + PyTorch
│   ├── app.py               # Flask API
│   ├── config.py            # Configuration
│   └── wav2vec2-lg-xlsr-en-speech-emotion-recognition/
│
├── docker-compose.yml        # PostgreSQL + ML Service
├── SETUP.md                  # Setup guide
├── API_DOCUMENTATION.md      # API reference
└── Makefile                  # Development commands
```

---

## 🧪 Development

### Useful Commands

```bash
# View all commands
make help

# Setup & Installation
make install        # Install all dependencies
make docker-up      # Start Docker services
make db-migrate     # Run database migrations

# Database Management
make db-reset       # Reset database (with confirmation)

# Docker Operations
make docker-down    # Stop Docker services
make docker-logs    # View Docker logs (live)

# Testing & Utilities
make test-ml        # Test ML service
make clean          # Clean temp files and build artifacts

# Manual Commands
cd backend && npx prisma migrate dev --name migration_name  # Create new migration
docker-compose ps                                           # List running services
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Disclaimer:** This is a mood tracking tool, not a diagnostic or treatment application. If you're experiencing mental health concerns, please consult a qualified mental health professional.
