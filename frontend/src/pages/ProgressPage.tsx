import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { api } from '@/lib/api';
import { useActivities } from '@/hooks/useActivities';
import { useToast } from '@/hooks/useToast';
import { getTodayIST } from '@/lib/utils';
import type { ActivityMoodCorrelation } from '@/types';
import {
  DAYS_OF_WEEK,
  MONTHS,
  EMOTIONS,
  EMOTION_ORDER,
  getEmotionFromEmoji,
  getEmotionLevel,
  getEmotionLabel,
  getEmotionEmojiFromLevel,
} from '@/lib/constants';

interface MoodTrendPoint {
  date: string;
  emoji: string;
  emotionLevel: number;
  emotion: string;
  activityKeys: string[];
  hasSelectedActivity?: boolean;
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasTodayEntry, setHasTodayEntry] = useState(false);
  const [checkingToday, setCheckingToday] = useState(true);

  // Filter state
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [showOverall, setShowOverall] = useState(false);
  const [tempYear, setTempYear] = useState(currentDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(currentDate.getMonth() + 1);
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>('all');

  // Data state
  const [weekdayData, setWeekdayData] = useState<Record<string, Record<string, number>>>({});
  const [moodCounts, setMoodCounts] = useState<Record<string, number>>({});
  const [totalEntries, setTotalEntries] = useState(0);
  const [trendData, setTrendData] = useState<MoodTrendPoint[]>([]);
  const [rawTrendData, setRawTrendData] = useState<Array<{ date: string; emoji: string; activityKeys: string[] }>>([]);
  const [activityCorrelations, setActivityCorrelations] = useState<ActivityMoodCorrelation[]>([]);

  // Fetch activities for labels
  const { activitiesMap } = useActivities();

  // Check if user has checked in today
  useEffect(() => {
    async function checkTodayEntry() {
      try {
        const today = getTodayIST();
        const entry = await api.getMoodEntryByDate(today);
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

  // Fetch data when filters change
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const params = showOverall ? {} : { year: selectedYear, month: selectedMonth };

        // Fetch all data sets including activity correlations
        const [weekday, counts, trend, activityData] = await Promise.all([
          api.getWeekdayDistribution(params),
          api.getMoodCounts(params),
          api.getMoodTrend(params),
          api.getActivityMoodCorrelation(params),
        ]);

        setWeekdayData(weekday);
        setMoodCounts(counts.moodCounts);
        setTotalEntries(counts.totalEntries);
        setActivityCorrelations(activityData.correlations);

        // Store raw trend data for filtering
        setRawTrendData(trend);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load progress data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedYear, selectedMonth, showOverall, toast]);

  // Transform trend data when raw data or activity filter changes (no loading state)
  useEffect(() => {
    const transformedTrend = rawTrendData.map(point => ({
      ...point,
      emotionLevel: getEmotionLevel(point.emoji),
      emotion: getEmotionLabel(point.emoji),
      hasSelectedActivity: selectedActivityFilter === 'all' || point.activityKeys.includes(selectedActivityFilter),
    }));
    setTrendData(transformedTrend);
  }, [rawTrendData, selectedActivityFilter]);

  const handleApplyFilter = () => {
    setSelectedYear(tempYear);
    setSelectedMonth(tempMonth);
    setShowOverall(false);
  };

  const handleToggleOverall = () => {
    if (showOverall) {
      // If currently showing overall, switch back to filtered view
      setShowOverall(false);
    } else {
      // If currently showing filtered, switch to overall
      setShowOverall(true);
    }
  };

  // Generate years for dropdown (from 2020 to current year)
  const years = Array.from({ length: currentDate.getFullYear() - 2019 }, (_, i) => 2020 + i);

  // Prepare weekday bar chart data with proper averaging
  const weekdayChartData = DAYS_OF_WEEK.map(day => {
    const dayData = weekdayData[day] || {};
    const emojis = Object.keys(dayData);

    if (emojis.length === 0) {
      return {
        day,
        averageEmotionLevel: 0,
        totalCount: 0,
        mostCommonEmoji: null,
        emotion: 'No data',
        allEmojis: {},
        emojiBreakdown: [],
      };
    }

    // Calculate total entries for this day
    const totalCount = emojis.reduce((sum, emoji) => sum + dayData[emoji], 0);

    // Calculate weighted average emotion level
    let weightedSum = 0;
    emojis.forEach(emoji => {
      const level = getEmotionLevel(emoji);
      const count = dayData[emoji];
      weightedSum += level * count;
    });
    const averageEmotionLevel = weightedSum / totalCount;

    // Get most common emoji
    const mostCommonEmoji = emojis.reduce((a, b) => (dayData[a] > dayData[b] ? a : b));

    // Create breakdown of all emojis for this day
    const emojiBreakdown = emojis
      .map(emoji => ({
        emoji,
        emotion: getEmotionLabel(emoji),
        count: dayData[emoji],
        percentage: Math.round((dayData[emoji] / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      day,
      averageEmotionLevel,
      totalCount,
      mostCommonEmoji,
      emotion: getEmotionLabel(mostCommonEmoji),
      allEmojis: dayData,
      emojiBreakdown,
    };
  });

  // Prepare mood count gauge data
  const moodCountData = Object.entries(moodCounts)
    .map(([emoji, count]) => ({
      emoji,
      count,
      emotion: getEmotionLabel(emoji),
      emotionKey: getEmotionFromEmoji(emoji),
      percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  // Group by emotion category for gauge segments
  const emotionData = moodCountData.reduce((acc, item) => {
    const existing = acc.find(x => x.emotion === item.emotion);
    if (existing) {
      existing.count += item.count;
    } else {
      const emotionInfo = EMOTIONS[item.emotionKey];
      acc.push({
        emotion: item.emotion,
        count: item.count,
        color: emotionInfo.color,
        emoji: emotionInfo.emoji,
        percentage: 0, // Will be calculated below
      });
    }
    return acc;
  }, [] as Array<{ emotion: string; count: number; color: string; emoji: string; percentage: number }>);

  // Calculate percentages for emotion categories
  emotionData.forEach(emotion => {
    emotion.percentage = totalEntries > 0 ? Math.round((emotion.count / totalEntries) * 100) : 0;
  });

  // Sort emotion data by count (descending) to find dominant emotion
  emotionData.sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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

          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Your Progress</h1>
              <p className="text-muted-foreground">Track your emotional journey</p>
            </div>
          </div>

          {/* Filter Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Year:</label>
                  <select
                    value={tempYear}
                    onChange={(e) => setTempYear(parseInt(e.target.value))}
                    className={`
                      min-w-[100px] px-4 py-2 text-sm font-medium
                      border-2 border-gray-200 rounded-lg
                      bg-white hover:bg-gray-50
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      transition-all duration-200
                      ${showOverall ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    disabled={showOverall}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Month:</label>
                  <select
                    value={tempMonth}
                    onChange={(e) => setTempMonth(parseInt(e.target.value))}
                    className={`
                      min-w-[140px] px-4 py-2 text-sm font-medium
                      border-2 border-gray-200 rounded-lg
                      bg-white hover:bg-gray-50
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      transition-all duration-200
                      ${showOverall ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    disabled={showOverall}
                  >
                    {MONTHS.map((month, idx) => (
                      <option key={idx} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleApplyFilter}
                  size="sm"
                  disabled={showOverall}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply
                </Button>

                <div className="flex-1" />

                <Button
                  onClick={handleToggleOverall}
                  variant={showOverall ? 'default' : 'outline'}
                  size="sm"
                >
                  {showOverall ? 'Back to Monthly View' : 'Overall Progress'}
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className={`
                  px-4 py-2 rounded-lg text-sm font-medium
                  ${showOverall
                    ? 'bg-purple-100 text-purple-800 border-2 border-purple-200'
                    : 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                  }
                `}>
                  {showOverall ? (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      Showing all-time data
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      Viewing: <span className="font-bold">{MONTHS[selectedMonth - 1]} {selectedYear}</span>
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </header>

        {loading ? (
          <div className="text-center py-20">
            <div className="spinner mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
        ) : totalEntries === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4 emoji">📊</div>
              <h3 className="text-xl font-semibold mb-2">No data yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your moods to see visualizations
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
            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalEntries}</div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {moodCountData.length > 0 ? moodCountData[0].emoji : '😊'}
                  </div>
                  <p className="text-sm text-muted-foreground">Most Common Mood</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {emotionData.length > 0 ? emotionData[0].emotion : 'Happy'}
                  </div>
                  <p className="text-sm text-muted-foreground">Dominant Emotion</p>
                </CardContent>
              </Card>
            </div>

            {/* 1. Weekday Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Mood by Day of Week</CardTitle>
                <CardDescription>
                  See which days you feel your best
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdayChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis
                        label={{ value: 'Emotion Level', angle: -90, position: 'insideLeft' }}
                        domain={[0, 9]}
                        ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
                        width={70}
                        tick={({ x, y, payload }) => {
                          const emoji = getEmotionEmojiFromLevel(payload.value);
                          const emotion = EMOTION_ORDER.find(key => EMOTIONS[key].level === payload.value);
                          const label = emotion ? EMOTIONS[emotion].label : '';

                          return (
                            <g transform={`translate(${x},${y})`}>
                              {/* Level number - positioned to the left */}
                              <text
                                x={-30}
                                y={0}
                                dy={4}
                                textAnchor="middle"
                                fill="#999"
                                fontSize="11"
                                fontWeight="bold"
                              >
                                {payload.value}
                              </text>
                              {/* Emoji - positioned to the right of the number */}
                              <text
                                x={-10}
                                y={0}
                                dy={4}
                                textAnchor="middle"
                                fill="#666"
                                fontSize="20"
                              >
                                {emoji}
                              </text>
                              {/* Tooltip on hover */}
                              <title>{`Level ${payload.value}: ${label}`}</title>
                            </g>
                          );
                        }}
                      />
                      <Tooltip
                        content={({ payload }) => {
                          if (payload && payload.length > 0) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-4 border rounded shadow-lg max-w-xs">
                                <p className="font-semibold text-lg mb-2">{data.day}</p>
                                {data.totalCount > 0 ? (
                                  <>
                                    <div className="mb-2 pb-2 border-b">
                                      <p className="text-sm text-gray-500">Total entries: {data.totalCount}</p>
                                      <p className="text-sm text-gray-500">
                                        Average level: {data.averageEmotionLevel.toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-gray-700 mb-1">Mood breakdown:</p>
                                      {data.emojiBreakdown.map((item: any, idx: number) => {
                                        const level = getEmotionLevel(item.emoji);
                                        return (
                                          <div key={idx} className="flex items-center justify-between text-sm">
                                            <span>
                                              <span className="text-lg mr-2">{item.emoji}</span>
                                              {item.emotion}
                                              <span className="text-xs text-gray-400 ml-1">(L{level})</span>
                                            </span>
                                            <span className="text-gray-600">
                                              {item.count} ({item.percentage}%)
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-500">No data for this day</p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="averageEmotionLevel" radius={[8, 8, 0, 0]}>
                        {weekdayChartData.map((entry, index) => {
                          const emotionKey = entry.mostCommonEmoji ? getEmotionFromEmoji(entry.mostCommonEmoji) : 'neutral';
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={EMOTIONS[emotionKey].color}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Emoji legend for weekdays */}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {weekdayChartData.map(day => (
                    <div key={day.day} className="text-center">
                      <div className="text-2xl">{day.mostCommonEmoji || '—'}</div>
                      <div className="text-xs text-muted-foreground">{day.day}</div>
                      <div className="text-xs font-medium text-gray-600">{day.emotion}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 2. Mood Count Gauge / Semi-circular Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription>
                  Overall breakdown of your emotions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Semi-circular gauge chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {emotionData.map((entry, index) => (
                            <linearGradient key={`gradient-${index}`} id={`gradient-${entry.emotion}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                              <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={emotionData}
                          cx="50%"
                          cy="70%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={3}
                          dataKey="count"
                          label={({ emoji, percentage }) => `${emoji} ${percentage}%`}
                          labelLine={false}
                        >
                          {emotionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#gradient-${entry.emotion})`}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          wrapperStyle={{ zIndex: 1000 }}
                          content={({ payload }) => {
                            if (payload && payload.length > 0) {
                              const data = payload[0].payload;
                              return (
                                <div
                                  className="bg-white p-3 border-2 rounded-lg shadow-xl"
                                  style={{
                                    borderColor: data.color,
                                    zIndex: 9999,
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-3xl">{data.emoji}</span>
                                    <span className="font-semibold text-lg" style={{ color: data.color }}>
                                      {data.emotion}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <p className="font-medium">{data.count} entries ({data.percentage}%)</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Center label showing total - positioned at the base of the pie chart */}
                  <div className="absolute left-1/2 top-[60%] transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
                    <div className="text-4xl font-bold text-gray-800">{totalEntries}</div>
                    <div className="text-sm text-gray-500 font-medium">Total Entries</div>
                  </div>
                </div>



                {/* Individual emoji counts - more compact */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-4 text-center text-gray-700">Detailed Mood Breakdown</h4>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {moodCountData
                      .sort((a, b) => b.count - a.count)
                      .map(mood => {
                        const emotionColor = EMOTIONS[mood.emotionKey].color;
                        return (
                          <div
                            key={mood.emoji}
                            className="flex flex-col items-center gap-1 px-2 py-3 rounded-lg border-2 hover:shadow-lg transition-all duration-200 hover:scale-105"
                            style={{
                              borderColor: emotionColor,
                              backgroundColor: `${emotionColor}15`
                            }}
                          >
                            <span className="text-3xl">{mood.emoji}</span>
                            <span className="text-xs text-gray-600 font-medium truncate w-full text-center">
                              {mood.emotion}
                            </span>
                            <span className="text-base font-bold" style={{ color: emotionColor }}>
                              {mood.count}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {mood.percentage}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Mood Trend Line Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle>Mood Trend Over Time</CardTitle>
                    <CardDescription>
                      Track how your emotions change day by day
                      {selectedActivityFilter !== 'all' && (
                        <span className="block mt-1 text-purple-600 font-medium">
                          🎯 Highlighting days with: {activitiesMap.get(selectedActivityFilter)?.icon} {activitiesMap.get(selectedActivityFilter)?.label}
                        </span>
                      )}
                      {trendData.length > 60 && (
                        <span className="block mt-1 text-xs">
                          📊 Scroll horizontally to view all {trendData.length} entries
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  {/* Activity Filter Dropdown */}
                  <div className="flex flex-col items-end gap-2">
                    <label className="text-sm font-medium text-gray-700">Filter by Activity:</label>
                    <select
                      value={selectedActivityFilter}
                      onChange={(e) => setSelectedActivityFilter(e.target.value)}
                      className="
                        min-w-[200px] px-3 py-2 text-sm font-medium
                        border-2 border-gray-200 rounded-lg
                        bg-white hover:bg-gray-50
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                        transition-all duration-200 cursor-pointer
                      "
                    >
                      <option value="all">🗓️ All Days</option>
                      <optgroup label="Activities">
                        {Array.from(activitiesMap.values())
                          .sort((a, b) => a.order - b.order)
                          .map(activity => (
                            <option key={activity.key} value={activity.key}>
                              {activity.icon} {activity.label}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Scrollable container for large datasets */}
                <div className="overflow-x-auto">
                  <div style={{
                    minWidth: trendData.length > 60 ? `${trendData.length * 15}px` : '100%',
                    height: '320px'
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            const month = d.getMonth() + 1;
                            const day = d.getDate();

                            // For large datasets, show year occasionally
                            if (trendData.length > 180) {
                              // Show year on first day of each quarter
                              if (day === 1 && [1, 4, 7, 10].includes(month)) {
                                return `${month}/${day}\n${d.getFullYear()}`;
                              }
                              return `${month}/${day}`;
                            } else if (trendData.length > 90) {
                              // Show year on first day of each month
                              if (day === 1) {
                                return `${month}/${day}\n${d.getFullYear()}`;
                              }
                              return `${month}/${day}`;
                            } else {
                              // For smaller datasets, just month/day
                              return `${month}/${day}`;
                            }
                          }}
                          angle={trendData.length > 90 ? -45 : 0}
                          textAnchor={trendData.length > 90 ? "end" : "middle"}
                          height={trendData.length > 90 ? 80 : 60}
                          interval={trendData.length > 180 ? 14 : trendData.length > 90 ? 7 : trendData.length > 60 ? 3 : 'preserveStartEnd'}
                        />
                        <YAxis
                          domain={[0, 9]}
                          ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
                          width={70}
                          tick={({ x, y, payload }) => {
                            const emoji = getEmotionEmojiFromLevel(payload.value);
                            const emotion = EMOTION_ORDER.find(key => EMOTIONS[key].level === payload.value);
                            const label = emotion ? EMOTIONS[emotion].label : '';

                            return (
                              <g transform={`translate(${x},${y})`}>
                                {/* Level number - positioned to the left */}
                                <text
                                  x={-30}
                                  y={0}
                                  dy={4}
                                  textAnchor="middle"
                                  fill="#999"
                                  fontSize="11"
                                  fontWeight="bold"
                                >
                                  {payload.value}
                                </text>
                                {/* Emoji - positioned to the right of the number */}
                                <text
                                  x={-10}
                                  y={0}
                                  dy={4}
                                  textAnchor="middle"
                                  fill="#666"
                                  fontSize="18"
                                >
                                  {emoji}
                                </text>
                                {/* Tooltip on hover */}
                                <title>{`Level ${payload.value}: ${label}`}</title>
                              </g>
                            );
                          }}
                          label={{
                            value: 'Emotions',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 10,
                          }}
                        />
                        <Tooltip
                          content={({ payload }) => {
                            if (payload && payload.length > 0) {
                              const data = payload[0].payload as MoodTrendPoint;
                              const d = new Date(data.date);
                              const formattedDate = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

                              // Get activities for this day
                              const dayActivities = data.activityKeys
                                .map(key => activitiesMap.get(key))
                                .filter(Boolean);

                              return (
                                <div className="bg-white p-3 border rounded shadow-lg">
                                  <p className="text-sm text-gray-600">{formattedDate}</p>
                                  <p className="text-3xl my-2 text-center">{data.emoji}</p>
                                  <p className="text-sm font-medium">
                                    {data.emotion}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 text-center">
                                    Level: {data.emotionLevel}
                                  </p>

                                  {dayActivities.length > 0 && (
                                    <div className="mt-3 pt-2 border-t">
                                      <p className="text-xs font-semibold text-gray-600 mb-1">Activities:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {dayActivities.map(activity => (
                                          <span
                                            key={activity!.key}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                                            style={{
                                              backgroundColor: `${activity!.color}20`,
                                              color: activity!.color,
                                              border: `1px solid ${activity!.color}40`
                                            }}
                                          >
                                            {activity!.icon} {activity!.label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="emotionLevel"
                          stroke="#9ca3af"
                          strokeWidth={2}
                          dot={(props: any) => {
                            const { cx, cy, payload, index } = props;
                            if (!payload || !cx || !cy) return <circle key={`dot-empty-${index}`} cx={0} cy={0} r={0} />;

                            // Get the emotion color based on the emoji
                            const emotionKey = getEmotionFromEmoji(payload.emoji);
                            const color = EMOTIONS[emotionKey].color;

                            // Check if this point has the selected activity
                            const hasActivity = payload.hasSelectedActivity;
                            const isFiltered = selectedActivityFilter !== 'all';

                            // If filtering and this point has the activity, make it larger and add a ring
                            if (isFiltered && hasActivity) {
                              return (
                                <g key={`dot-group-${index}`}>
                                  {/* Outer glow ring */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={12}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={3}
                                    opacity={0.3}
                                  />
                                  {/* Main dot */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={8}
                                    fill={color}
                                    stroke="#fff"
                                    strokeWidth={3}
                                  />
                                  {/* Inner highlight */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={3}
                                    fill="#fff"
                                    opacity={0.7}
                                  />
                                </g>
                              );
                            }

                            // If filtering and this point doesn't have the activity, make it smaller and dimmed
                            if (isFiltered && !hasActivity) {
                              return (
                                <circle
                                  key={`dot-${index}`}
                                  cx={cx}
                                  cy={cy}
                                  r={4}
                                  fill={color}
                                  stroke="#fff"
                                  strokeWidth={1}
                                  opacity={0.3}
                                />
                              );
                            }

                            // Default: normal dot
                            return (
                              <circle
                                key={`dot-${index}`}
                                cx={cx}
                                cy={cy}
                                r={6}
                                fill={color}
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            );
                          }}
                          activeDot={(props: any) => {
                            const { cx, cy, payload, index } = props;
                            if (!payload || !cx || !cy) return <circle key={`active-empty-${index}`} cx={0} cy={0} r={0} />;

                            // Get the emotion color based on the emoji
                            const emotionKey = getEmotionFromEmoji(payload.emoji);
                            const color = EMOTIONS[emotionKey].color;

                            return (
                              <circle
                                key={`active-${index}`}
                                cx={cx}
                                cy={cy}
                                r={10}
                                fill={color}
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            );
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Data summary for large datasets */}
                {trendData.length > 0 && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    {(() => {
                      const firstDate = new Date(trendData[0].date);
                      const lastDate = new Date(trendData[trendData.length - 1].date);
                      return (
                        <span>
                          Showing {trendData.length} entries from {firstDate.toLocaleDateString()} to {lastDate.toLocaleDateString()}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Activity-Mood Correlation Chart */}
            {activityCorrelations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>How Activities Affect Your Mood</CardTitle>
                  <CardDescription>
                    Average mood level for each activity (higher is better)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(300, activityCorrelations.length * 40)}>
                    <BarChart
                      data={activityCorrelations}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 10]} />
                      <YAxis
                        dataKey="activityKey"
                        type="category"
                        width={150}
                        tick={(props: any) => {
                          const { x, y, payload } = props;
                          const activity = activitiesMap.get(payload.value);
                          if (!activity) return <g />;

                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text
                                x={-10}
                                y={0}
                                dy={4}
                                textAnchor="end"
                                fill="#666"
                                fontSize="14"
                              >
                                <tspan fontSize="16">{activity.icon}</tspan>
                                <tspan dx="8">{activity.label}</tspan>
                              </text>
                            </g>
                          );
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0) return null;

                          const data = payload[0].payload;
                          const activity = activitiesMap.get(data.activityKey);

                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{activity?.icon}</span>
                                <span className="font-semibold">{activity?.label}</span>
                              </div>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">Average Mood:</span>
                                  <span className="font-bold">{data.averageMood.toFixed(1)}/10</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">Entries:</span>
                                  <span>{data.count}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="averageMood"
                        radius={[0, 8, 8, 0]}
                        fill="#8884d8"
                      >
                        {activityCorrelations.map((entry, index) => {
                          const activity = activitiesMap.get(entry.activityKey);
                          const color = activity?.color || '#8884d8';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Insights */}
                  {activityCorrelations.length > 0 && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">💡</span>
                        <div>
                          <p className="font-semibold text-purple-900 mb-1">Insight</p>
                          <p className="text-sm text-purple-800">
                            {(() => {
                              const best = activityCorrelations[0];
                              const bestActivity = activitiesMap.get(best.activityKey);
                              const diffValue = activityCorrelations.length > 1
                                ? parseFloat((best.averageMood - activityCorrelations[activityCorrelations.length - 1].averageMood).toFixed(1))
                                : 0;

                              return bestActivity
                                ? `Your mood is highest when "${bestActivity.label}" (${best.averageMood.toFixed(1)}/10). ${diffValue > 0 ? `That's ${diffValue} points higher than your lowest-rated activity!` : ''
                                }`
                                : 'Track more activities to see insights!';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
