// Application constants

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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

// 8 Emotion categories (matching ML service emotions)
export const EMOTIONS = {
  happy: { label: 'Happy', emoji: '😊', level: 8, color: '#10b981' },
  excited: { label: 'Excited', emoji: '🤗', level: 7, color: '#84cc16' },
  neutral: { label: 'Neutral', emoji: '😐', level: 6, color: '#fbbf24' },
  calm: { label: 'Calm', emoji: '😌', level: 5, color: '#06b6d4' },
  sad: { label: 'Sad', emoji: '😢', level: 4, color: '#f97316' },
  angry: { label: 'Angry', emoji: '😠', level: 3, color: '#ef4444' },
  fearful: { label: 'Fearful', emoji: '😨', level: 2, color: '#a855f7' },
  disgusted: { label: 'Disgusted', emoji: '🤢', level: 1, color: '#ec4899' },
} as const;

export type EmotionKey = keyof typeof EMOTIONS;

// Emotion order for charts (best to worst)
export const EMOTION_ORDER: EmotionKey[] = ['happy', 'excited', 'calm', 'neutral', 'sad', 'angry', 'fearful', 'disgusted'];

// Map emoji to emotion category
export const getEmotionFromEmoji = (emoji: string): EmotionKey => {
  // Happy emojis
  if (['😊', '😄', '🥰', '😁', '😍', '🌟', '✨', '🎉'].includes(emoji)) return 'happy';
  // Excited/energetic emojis
  if (['🤗', '😎', '🙃', '🤓'].includes(emoji)) return 'excited';
  // Calm emojis
  if (['😌', '😇', '🙂', '☺️'].includes(emoji)) return 'calm';
  // Neutral emojis
  if (['😐', '😑', '🤔', '😶', '😬', '🤨'].includes(emoji)) return 'neutral';
  // Sad emojis
  if (['😢', '😭', '😔', '😞', '😟', '😥', '😓', '😪'].includes(emoji)) return 'sad';
  // Angry emojis
  if (['😠', '😡', '😤', '💢', '😖', '😩', '😫', '😣'].includes(emoji)) return 'angry';
  // Fearful emojis
  if (['😨', '😰', '😱', '😧'].includes(emoji)) return 'fearful';
  // Disgusted emojis
  if (['🤢', '🤮', '😒', '🙄', '💔'].includes(emoji)) return 'disgusted';

  // Default to neutral
  return 'neutral';
};

// Get emotion level (1-8) from emoji
export const getEmotionLevel = (emoji: string): number => {
  const emotion = getEmotionFromEmoji(emoji);
  return EMOTIONS[emotion].level;
};

// Get emotion label from emoji
export const getEmotionLabel = (emoji: string): string => {
  const emotion = getEmotionFromEmoji(emoji);
  return EMOTIONS[emotion].label;
};

// Get emotion emoji from level
export const getEmotionEmojiFromLevel = (level: number): string => {
  const emotion = EMOTION_ORDER.find(key => EMOTIONS[key].level === level);
  return emotion ? EMOTIONS[emotion].emoji : '😐';
};
