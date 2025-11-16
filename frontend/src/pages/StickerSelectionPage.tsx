import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sparkles, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { getEmotionFromEmoji, EMOTIONS } from '@/lib/constants';
import type { EmotionScoreWithEmoji } from '@/types';

export default function StickerSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entryId } = useParams<{ entryId: string }>();
  const { toast } = useToast();

  // Get emotion scores from location state (passed from RecordingPage)
  const emotionScores = location.state?.emotionScores as EmotionScoreWithEmoji[] | undefined;

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If no emotion scores in state, something went wrong - go back home
    if (!emotionScores || emotionScores.length === 0) {
      toast({
        title: 'Error',
        description: 'No emotion data found',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [emotionScores, navigate, toast]);

  // Handle save
  const handleSave = async () => {
    if (!selectedEmoji || !entryId) return;

    setSaving(true);

    try {
      await api.updateMoodEntry(entryId, {
        selectedEmoji,
      });

      toast({
        title: 'Mood saved!',
        description: 'Now tell us about your activities',
      });

      // Get mood color from the selected emoji
      const emotionKey = getEmotionFromEmoji(selectedEmoji);
      const moodColor = EMOTIONS[emotionKey].color;

      // Navigate to activity selection page with mood color
      navigate(`/select-activities/${entryId}`, {
        state: { moodColor, selectedEmoji },
      });
    } catch (error) {
      console.error('Error saving mood:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your mood',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel - delete the entry
  const handleCancel = async () => {
    if (!entryId) {
      navigate('/');
      return;
    }

    try {
      await api.deleteMoodEntry(entryId);
      toast({
        title: 'Cancelled',
        description: 'Your recording has been deleted',
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
    }

    navigate('/');
  };

  if (!emotionScores || emotionScores.length === 0) {
    return null; // Will redirect in useEffect
  }

  // Top 3 emojis (already sorted by confidence from backend)
  const topThree = emotionScores.slice(0, 3);
  const allEight = emotionScores;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">How are you feeling?</CardTitle>
            <CardDescription>
              Select an emoji that best represents your mood today
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* AI Suggestions - Top 3 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="font-semibold text-lg">AI Suggestions (Top 3)</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {topThree.map((item, index) => (
                  <button
                    key={item.emoji}
                    onClick={() => setSelectedEmoji(item.emoji)}
                    className={cn(
                      'relative p-6 rounded-xl border-2 transition-all hover:scale-105',
                      selectedEmoji === item.emoji
                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                        : 'border-border bg-card hover:border-primary/50',
                      index === 0 && 'ring-2 ring-primary/30' // Highlight highest confidence
                    )}
                  >
                    {/* Highest confidence badge */}
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full px-2 py-1">
                        Best Match
                      </div>
                    )}

                    <div className="text-6xl emoji mb-2">{item.emoji}</div>
                    <div className="text-sm font-medium text-muted-foreground capitalize">
                      {item.emotion}
                    </div>
                    <div className="text-xs font-bold text-primary">
                      {item.confidence}%
                    </div>

                    {selectedEmoji === item.emoji && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* All 8 Emotions */}
            <div>
              <p className="font-semibold mb-3">Or choose from all emotions:</p>

              <div className="grid grid-cols-4 gap-3">
                {allEight.map((item) => (
                  <button
                    key={item.emoji}
                    onClick={() => setSelectedEmoji(item.emoji)}
                    className={cn(
                      'relative p-4 rounded-lg border-2 transition-all hover:scale-105',
                      selectedEmoji === item.emoji
                        ? 'border-primary bg-primary/10 shadow-md scale-105'
                        : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <div className="text-4xl emoji mb-1">{item.emoji}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {item.emotion}
                    </div>
                    <div className="text-xs font-semibold text-primary">
                      {item.confidence}%
                    </div>

                    {selectedEmoji === item.emoji && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedEmoji || saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save My Mood'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
