import { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ActivityEditDialog } from '@/components/ActivityEditDialog';
import { useCalendarData } from '@/hooks/useMoodData';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { getDaysInMonth, getFirstDayOfMonth, formatDate, isTodayIST } from '@/lib/utils';
import { DAYS_OF_WEEK, MONTHS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { MoodEntryActivity, MoodEntry } from '@/types';

export function MoodCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { isLoaded } = useAuth();

  const { calendarData, loading, refetch } = useCalendarData(year, month + 1);
  const { activities, activitiesMap, loading: activitiesLoading } = useActivities();

  // Show loading state while auth is initializing
  const isActuallyLoading = loading || !isLoaded || activitiesLoading;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Create calendar grid
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get emoji for a specific date
  const getEmojiForDate = (day: number): string | null => {
    const date = formatDate(new Date(year, month, day));
    const entry = calendarData.find(d => d.date === date);
    return entry?.emoji || null;
  };

  // Get activities for a specific date
  const getActivitiesForDate = (day: number): MoodEntryActivity[] => {
    const date = formatDate(new Date(year, month, day));
    const entry = calendarData.find(d => d.date === date);
    return entry?.activities || [];
  };

  // Handle day click to edit activities
  const handleDayClick = async (day: number) => {
    const dateString = formatDate(new Date(year, month, day));
    const entry = calendarData.find(d => d.date === dateString);

    if (entry && entry.emoji) {
      setSelectedDate(dateString);

      // Fetch full entry with activities
      try {
        const fullEntry = await api.getMoodEntryByDate(dateString);
        if (fullEntry) {
          setSelectedEntry(fullEntry);
          setEditDialogOpen(true);
        }
      } catch (error) {
        console.error('Error fetching entry:', error);
      }
    }
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedEntry(null);
    setSelectedDate(null);
  };

  const handleUpdate = () => {
    refetch();
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={previousMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {MONTHS[month]} {year}
          </h2>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS_OF_WEEK.map(day => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isActuallyLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading calendar...
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const date = new Date(year, month, day);
            const dateString = formatDate(date);
            const emoji = getEmojiForDate(day);
            const activities = getActivitiesForDate(day);
            const isTodayDate = isTodayIST(dateString); // Use IST-aware date checking
            const hasEntry = emoji !== null;

            return (
              <div
                key={day}
                onClick={() => hasEntry && handleDayClick(day)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all',
                  isTodayDate
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card',
                  hasEntry ? 'hover:border-primary/50 hover:scale-105 cursor-pointer group' : ''
                )}
              >
                <div className="text-sm text-muted-foreground">{day}</div>
                {emoji && (
                  <>
                    <div className="text-3xl emoji mt-1">{emoji}</div>
                    {activities.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1 max-w-full px-1">
                        {activities.slice(0, 3).map((activity) => {
                          // Use activity details from backend if available, otherwise lookup from map
                          const activityInfo = activity.activity || activitiesMap.get(activity.activityKey);
                          return activityInfo ? (
                            <div
                              key={activity.id}
                              className="text-xs emoji"
                              title={activityInfo.label}
                            >
                              {activityInfo.icon}
                            </div>
                          ) : null;
                        })}
                        {activities.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{activities.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Edit indicator on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1">
                      <Edit2 className="h-3 w-3 text-primary" />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Today button */}
      <div className="mt-6 text-center">
        <Button variant="outline" onClick={goToToday}>
          Go to Today
        </Button>
      </div>

      {/* Activity Edit Dialog */}
      <ActivityEditDialog
        open={editDialogOpen}
        onClose={handleDialogClose}
        entry={selectedEntry}
        activities={activities}
        onUpdate={handleUpdate}
      />
    </Card>
  );
}
