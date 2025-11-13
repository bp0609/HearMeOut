// Application constants

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Mood emojis organized by category
export const MOOD_EMOJIS = {
  great: ['😊', '😄', '🥰', '😁', '🤗', '💚', '😍', '🌟', '✨', '🎉'],
  good: ['🙂', '😌', '😇', '🤓', '💛', '😎', '👍', '☺️', '😏', '🙃'],
  okay: ['😐', '😑', '🤔', '😶', '💙', '😏', '🙃', '😬', '🤨', '😕'],
  low: ['😔', '😞', '😕', '😟', '🧡', '😐', '😥', '😓', '😪', '😩'],
  terrible: ['😢', '😭', '😰', '😨', '💔', '😖', '😩', '😱', '😣', '😫'],
} as const;

// All emojis flattened
export const ALL_EMOJIS = [
  ...MOOD_EMOJIS.great,
  ...MOOD_EMOJIS.good,
  ...MOOD_EMOJIS.okay,
  ...MOOD_EMOJIS.low,
  ...MOOD_EMOJIS.terrible,
];

// Activity tags
export const ACTIVITY_TAGS = [
  { id: 'exercise', label: 'Exercise', icon: '🏃' },
  { id: 'sleep_well', label: 'Slept Well', icon: '😴' },
  { id: 'sleep_poor', label: 'Poor Sleep', icon: '😫' },
  { id: 'social_time', label: 'Social Time', icon: '👥' },
  { id: 'alone_time', label: 'Alone Time', icon: '🧘' },
  { id: 'work_stress', label: 'Work Stress', icon: '💼' },
  { id: 'relaxation', label: 'Relaxation', icon: '🌸' },
  { id: 'nature', label: 'Nature', icon: '🌳' },
  { id: 'creative', label: 'Creative Work', icon: '🎨' },
  { id: 'learning', label: 'Learning', icon: '📚' },
] as const;

// Languages
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
] as const;

// Recording constraints
export const RECORDING_CONFIG = {
  minDuration: 5, // seconds
  maxDuration: 60, // seconds
  sampleRate: 16000,
  mimeType: 'audio/webm;codecs=opus',
  fallbackMimeType: 'audio/webm',
};

// Chart colors for mood distribution
export const CHART_COLORS = [
  '#10b981', // green
  '#84cc16', // lime
  '#fbbf24', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

// Days of week
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Months
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
