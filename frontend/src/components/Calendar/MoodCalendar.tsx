import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCalendarData } from '@/hooks/useMoodData';
import { useAuth } from '@/hooks/useAuth';
import { getDaysInMonth, getFirstDayOfMonth, formatDate, isToday } from '@/lib/utils';
import { DAYS_OF_WEEK, MONTHS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MoodCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { isLoaded } = useAuth();

  const { calendarData, loading } = useCalendarData(year, month + 1);

  // Show loading state while auth is initializing
  const isActuallyLoading = loading || !isLoaded;

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
            const emoji = getEmojiForDate(day);
            const isTodayDate = isToday(date);

            return (
              <div
                key={day}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all hover:border-primary/50 cursor-pointer',
                  isTodayDate
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card',
                  emoji ? 'hover:scale-105' : ''
                )}
              >
                <div className="text-sm text-muted-foreground">{day}</div>
                {emoji && (
                  <div className="text-3xl emoji mt-1">{emoji}</div>
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
    </Card>
  );
}
