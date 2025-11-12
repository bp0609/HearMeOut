// Type definitions for frontend

export interface EmotionScore {
  emotion: string;
  score: number;
}

export interface MoodEntry {
  id: string;
  entryDate: string;
  selectedEmoji: string | null;
  suggestedEmojis: string[];
  activityTags: string[];
  userNotes: string | null;
  transcription: string | null;
  emotionScores: EmotionScore[];
  createdAt: string;
}

export interface MoodEntryCreate {
  transcription: string | null;
  emotionScores: EmotionScore[];
  suggestedEmojis: string[];
  predictedEmotion?: string;
  confidence?: number;
  id: string;
  entryDate: string;
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
  cloudStorageEnabled: boolean;
  preferredLanguage: 'en' | 'hi' | 'gu';
}

export interface CalendarDay {
  date: string;
  emoji: string | null;
}

// UI State types
export type Language = 'en' | 'hi' | 'gu';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
}
