// API Client

import axios, { AxiosInstance } from 'axios';
import { API_URL } from './constants';
import {
  MoodEntry,
  MoodEntryCreate,
  ProgressSummary,
  PatternAlert,
  UserSettings,
  CalendarDay,
} from '../types';

class ApiClient {
  private client: AxiosInstance;
  private getTokenFn: (() => Promise<string | null>) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to dynamically add fresh token to every request
    this.client.interceptors.request.use(
      async (config) => {
        if (this.getTokenFn) {
          try {
            const token = await this.getTokenFn();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.error('Error fetching auth token:', error);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Set the token getter function (called from useAuth hook)
   */
  setTokenGetter(fn: () => Promise<string | null>) {
    this.getTokenFn = fn;
  }

  /**
   * Clear the token getter function (on sign out)
   */
  clearTokenGetter() {
    this.getTokenFn = null;
  }

  // Mood Entry endpoints

  /**
   * Upload audio and create mood entry
   */
  async createMoodEntry(
    audioFile: File,
    language: string,
    duration: number
  ): Promise<MoodEntryCreate> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);
    formData.append('duration', duration.toString());

    const response = await this.client.post('/api/moods', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Update mood entry with selected emoji
   */
  async updateMoodEntry(
    id: string,
    data: {
      selectedEmoji: string;
      activityTags?: string[];
      userNotes?: string;
    }
  ): Promise<void> {
    await this.client.patch(`/api/moods/${id}`, data);
  }

  /**
   * Get mood entries
   */
  async getMoodEntries(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<MoodEntry[]> {
    const response = await this.client.get('/api/moods', { params });
    return response.data.data;
  }

  /**
   * Get mood entry for specific date
   */
  async getMoodEntryByDate(date: string): Promise<MoodEntry> {
    const response = await this.client.get(`/api/moods/date/${date}`);
    return response.data.data;
  }

  /**
   * Delete mood entry
   */
  async deleteMoodEntry(id: string): Promise<void> {
    await this.client.delete(`/api/moods/${id}`);
  }

  // Progress endpoints

  /**
   * Get progress summary
   */
  async getProgressSummary(days: number = 30): Promise<ProgressSummary> {
    const response = await this.client.get('/api/progress/summary', {
      params: { days },
    });
    return response.data.data;
  }

  /**
   * Get calendar data for a month
   */
  async getCalendarData(year: number, month: number): Promise<CalendarDay[]> {
    const response = await this.client.get(
      `/api/progress/calendar/${year}/${month}`
    );
    return response.data.data;
  }

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<PatternAlert[]> {
    const response = await this.client.get('/api/progress/alerts');
    return response.data.data;
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(id: string): Promise<void> {
    await this.client.post(`/api/progress/alerts/${id}/dismiss`);
  }

  // Settings endpoints

  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    const response = await this.client.get('/api/settings');
    return response.data.data;
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await this.client.patch('/api/settings', settings);
    return response.data.data;
  }

  // Health check

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const api = new ApiClient();
