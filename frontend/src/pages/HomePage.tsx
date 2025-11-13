import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Calendar, TrendingUp, Settings, Mic, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoodCalendar } from '@/components/Calendar/MoodCalendar';
import { getTodayIST } from '@/lib/utils';
import { useMoodEntryByDate } from '@/hooks/useMoodData';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isLoaded } = useAuth();
  const today = getTodayIST(); // Use IST timezone for current date
  const { entry } = useMoodEntryByDate(today);

  // Wait for auth to load before showing content
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-purple-600 mb-2">Loading...</div>
          <p className="text-muted-foreground">Authenticating your session</p>
        </div>
      </div>
    );
  }

  const hasTodayEntry = entry !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              HearMeOut
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName || 'there'}!
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/progress')}
              title="View Progress"
            >
              <TrendingUp className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <MoodCalendar />
          </div>

          {/* Actions Section */}
          <div className="space-y-6">
            {/* Today's Check-in Card */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-6 w-6" />
                <h3 className="text-xl font-bold">Today's Check-in</h3>
              </div>

              {hasTodayEntry ? (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <div className="text-6xl emoji mb-2">{entry.selectedEmoji}</div>
                    <p className="text-sm opacity-90">You've checked in today!</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white/20 hover:bg-white/30 border-white/30 text-white"
                    onClick={() => navigate('/progress')}
                  >
                    View Your Progress
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm opacity-90">
                    Take a moment to check in with yourself. Record a short voice note and track your mood.
                  </p>
                  <Button
                    size="lg"
                    className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold"
                    onClick={() => navigate('/record')}
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    Go for Today
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/progress')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Check Your Progress
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/data-history')}
                >
                  <Database className="mr-2 h-4 w-4" />
                  View Data History
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Adjust Settings
                </Button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Daily check-ins help you understand your emotional patterns. Try to log at least once a day!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
