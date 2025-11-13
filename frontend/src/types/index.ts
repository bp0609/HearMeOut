// Type definitions for frontend

export interface EmotionScoreWithEmoji {
  emoji: string;
  emotion: string;
  confidence: number; // 0-100
}

export interface MoodEntry {
  id: string;
  entryDate: string;
  selectedEmoji: string | null;
  createdAt: string;
}

export interface MoodEntryCreate {
  id: string;
  entryDate: string;
  emotionScores: EmotionScoreWithEmoji[]; // All 8 emojis sorted by confidence
}

export interface MoodDistribution {
  emoji: string;
  count: number;
  percentage: number;
}

export interface ProgressSummary {
  moodDistribution: MoodDistribution[];
  totalEntries: number;
  streakDays: number;
  weeklySummary: string;
  hasEnoughData: boolean;
}

export interface PatternAlert {
  id: string;
  alertType: string;
  detectedAt: string;
  message: string;
  suggestions: string[];
}

export interface UserSettings {
  reminderEnabled: boolean;
  reminderTime: string | null;
  interventionThreshold: number;
  audioStorageConsent: boolean | null; // null = not asked, true = agreed, false = denied
  audioStorageEnabled: boolean;
  consentGivenAt: string | null;
}

export interface CalendarDay {
  date: string;
  emoji: string | null;
}

export interface AudioRecording {
  id: string;
  entryDate: string;
  duration: number;
  language: string;
  selectedEmoji: string | null;
  createdAt: string;
  fileExists: boolean;
  audioFilePath: string | null;
}

// UI State types
export type Language = 'en' | 'hi' | 'gu';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
}
