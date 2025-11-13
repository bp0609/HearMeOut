// Type definitions for the backend

import { Request } from 'express';

// Declare global augmentation for Express Request
// Clerk's clerkMiddleware() and getAuth() attach auth to the Request object
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

// Type alias for authenticated requests (after requireAuth middleware)
// Auth is guaranteed to exist after passing through requireAuth
export type AuthenticatedRequest = Request & {
  auth: {
    userId: string;
    sessionId: string;
  };
};

// ML Service Response Types
export interface EmotionScore {
  emotion: string;
  score: number;
}

export interface MLAnalysisResponse {
  success: boolean;
  audio_path?: string;
  predicted_emotion?: string;
  confidence?: number;
  all_scores?: Record<string, number>;
  top_emotions?: EmotionScore[];
  error?: string;
}

// API Request/Response Types
export interface CreateMoodEntryRequest {
  language: string;
  duration: number;
}

export interface UpdateMoodEntryRequest {
  selectedEmoji: string;
  activityTags?: string[];
  userNotes?: string;
}

export interface MoodEntryResponse {
  id: string;
  entryDate: string;
  selectedEmoji: string | null;
  suggestedEmojis: string[];
  transcription: string | null;
  emotionScores: EmotionScore[];
  activityTags: string[];
  userNotes: string | null;
  createdAt: string;
}

export interface ProgressSummaryResponse {
  moodDistribution: {
    emoji: string;
    count: number;
    percentage: number;
  }[];
  totalEntries: number;
  streakDays: number;
  weeklySummary: string;
  hasEnoughData: boolean;
}

export interface PatternAlertResponse {
  id: string;
  alertType: string;
  detectedAt: string;
  message: string;
  suggestions: string[];
}
