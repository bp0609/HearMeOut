// Hook for fetching and managing mood data

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { MoodEntry, CalendarDay } from '@/types';

export function useMoodData() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (params?: { startDate?: string; endDate?: string; limit?: number }) => {
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
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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

  const fetchCalendarData = useCallback(async () => {
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
  }, [year, month]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

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

  useEffect(() => {
    async function fetchEntry() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getMoodEntryByDate(date);
        // data will be null if no entry exists (200 response with data: null)
        setEntry(data);
      } catch (err) {
        // This now only catches real errors (network, server, auth failures)
        console.error('Error fetching mood entry:', err);
        setError('Failed to load mood entry');
        setEntry(null);
      } finally {
        setLoading(false);
      }
    }

    if (date) {
      fetchEntry();
    }
  }, [date]);

  return {
    entry,
    loading,
    error,
  };
}
