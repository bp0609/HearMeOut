// Hook for fetching and managing mood data

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/lib/api';
import { MoodEntry, CalendarDay } from '@/types';

export function useMoodData() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isTokenSet } = useAuth();

  const fetchEntries = useCallback(async (params?: { startDate?: string; endDate?: string; limit?: number }) => {
    if (!isTokenSet) return; // Don't fetch until token is set

    try {
      setLoading(true);
      setError(null);
      const data = await api.getMoodEntries(params);
      setEntries(data);
    } catch (err) {
      console.error('Error fetching mood entries:', err);
      setError('Failed to load mood entries');
    } finally {
      setLoading(false);
    }
  }, [isTokenSet]);

  useEffect(() => {
    if (isTokenSet) {
      fetchEntries();
    }
  }, [fetchEntries, isTokenSet]);

  return {
    entries,
    loading,
    error,
    refetch: fetchEntries,
  };
}

export function useCalendarData(year: number, month: number) {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isTokenSet } = useAuth();

  const fetchCalendarData = useCallback(async () => {
    if (!isTokenSet) return; // Don't fetch until token is set

    try {
      setLoading(true);
      setError(null);
      const data = await api.getCalendarData(year, month);
      setCalendarData(data);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [year, month, isTokenSet]);

  useEffect(() => {
    if (isTokenSet) {
      fetchCalendarData();
    }
  }, [fetchCalendarData, isTokenSet]);

  return {
    calendarData,
    loading,
    error,
    refetch: fetchCalendarData,
  };
}

export function useMoodEntryByDate(date: string) {
  const [entry, setEntry] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isTokenSet } = useAuth();

  useEffect(() => {
    async function fetchEntry() {
      if (!isTokenSet) return; // Don't fetch until token is set

      try {
        setLoading(true);
        setError(null);
        const data = await api.getMoodEntryByDate(date);
        setEntry(data);
      } catch (err) {
        console.error('Error fetching mood entry:', err);
        setEntry(null);
        // Don't set error for 404 - it means no entry for this date
      } finally {
        setLoading(false);
      }
    }

    if (date && isTokenSet) {
      fetchEntry();
    }
  }, [date, isTokenSet]);

  return {
    entry,
    loading,
    error,
  };
}
