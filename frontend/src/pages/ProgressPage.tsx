import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { getTodayIST } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/constants';
import type { ProgressSummary } from '@/types';

export default function ProgressPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [hasTodayEntry, setHasTodayEntry] = useState(false);
  const [checkingToday, setCheckingToday] = useState(true);

  // Check if user has checked in today
  useEffect(() => {
    async function checkTodayEntry() {
      try {
        const today = getTodayIST();
        const entry = await api.getMoodEntryByDate(today);
        // Entry exists and has a selected emoji = checked in
        setHasTodayEntry(entry !== null && entry.selectedEmoji !== null);
      } catch (error) {
        console.error('Error checking today entry:', error);
        setHasTodayEntry(false);
      } finally {
        setCheckingToday(false);
      }
    }

    checkTodayEntry();
  }, []);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const data = await api.getProgressSummary(days);
        setSummary(data);
      } catch (error) {
        console.error('Error fetching progress:', error);
        toast({
          title: 'Error',
          description: 'Failed to load progress data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [days, toast]);

  const chartData = summary?.moodDistribution.map((item, index) => ({
    name: item.emoji,
    value: item.count,
    percentage: item.percentage,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Your Progress</h1>
              <p className="text-muted-foreground">Track your emotional journey</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20">
            <div className="spinner mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
        ) : !summary || !summary.hasEnoughData ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4 emoji">📊</div>
              <h3 className="text-xl font-semibold mb-2">Not enough data yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete at least 10 check-ins to see your progress
              </p>
              {!checkingToday && !hasTodayEntry && (
                <Button onClick={() => navigate('/record')}>
                  Start Today's Check-in
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{summary.totalEntries}</div>
                  <p className="text-sm text-muted-foreground">Total Check-ins</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{summary.streakDays} days</div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{days} days</div>
                  <p className="text-sm text-muted-foreground">Time Period</p>
                </CardContent>
              </Card>
            </div>

            {/* Mood Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
                <CardDescription>
                  How you've been feeling over the last {days} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value} days`,
                          `${name}`,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{summary.weeklySummary}</p>
              </CardContent>
            </Card>

            {/* Time Period Selector */}
            <div className="flex justify-center gap-2">
              {[7, 14, 30, 90].map((d) => (
                <Button
                  key={d}
                  variant={days === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDays(d)}
                >
                  {d} days
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
