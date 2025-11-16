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
  activities?: MoodEntryActivity[];
}

export interface Activity {
  id: string;
  key: string;
  icon: string;
  label: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntryActivity {
  id: string;
  moodEntryId: string;
  activityKey: string;
  createdAt: string;
  activity?: Activity; // Optional - included when fetched with details
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
  patternDetails?: {
    consecutiveDays?: number;
    dates?: string[];
    emojis?: string[];
    fromEmoji?: string;
    toEmoji?: string;
    fromDate?: string;
    toDate?: string;
  };
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
  activities?: MoodEntryActivity[];
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

// Activity Analytics types
export interface ActivityStats {
  activityKey: string;
  activity: Activity | null;
  count: number;
  percentage: number;
}

export interface ActivityMoodCorrelation {
  activityKey: string;
  activity: Activity | null;
  averageMood: number; // 1-10 scale
  count: number;
}

