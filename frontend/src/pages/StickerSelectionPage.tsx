import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { MOOD_EMOJIS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function StickerSelectionPage() {
  const navigate = useNavigate();
  const { entryId } = useParams<{ entryId: string }>();
  const { toast } = useToast();

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [suggestedEmojis, setSuggestedEmojis] = useState<string[]>([]);
  const [transcription, setTranscription] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchEntry() {
      if (!entryId) return;

      try {
        const response = await api.getMoodEntries({ limit: 100 });
        const entry = response.find(e => e.id === entryId);

        if (entry) {
          setSuggestedEmojis(entry.suggestedEmojis);
          setTranscription(entry.transcription || '');
        }
      } catch (error) {
        console.error('Error fetching entry:', error);
        toast({
          title: 'Error',
          description: 'Failed to load mood entry',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchEntry();
  }, [entryId, toast]);

  const handleSave = async () => {
    if (!selectedEmoji || !entryId) return;

    setSaving(true);

    try {
      await api.updateMoodEntry(entryId, {
        selectedEmoji,
      });

      toast({
        title: 'Mood saved!',
        description: 'Your daily check-in is complete',
      });

      navigate('/');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">How are you feeling?</CardTitle>
            <CardDescription>
              Select an emoji that best represents your mood today
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Transcription */}
            {transcription && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Your recording:</p>
                <p className="text-sm italic">"{transcription}"</p>
              </div>
            )}

            {/* AI Suggestions */}
            {suggestedEmojis.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-semibold">AI Suggestions</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {suggestedEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={cn(
                        'relative p-6 rounded-lg border-2 transition-all hover:scale-105',
                        selectedEmoji === emoji
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      <div className="text-5xl emoji">{emoji}</div>
                      {selectedEmoji === emoji && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Emojis by Category */}
            <div>
              <p className="font-semibold mb-3">Or choose from all moods:</p>

              <div className="space-y-4">
                {Object.entries(MOOD_EMOJIS).map(([category, emojis]) => (
                  <div key={category}>
                    <p className="text-sm text-muted-foreground capitalize mb-2">
                      {category}
                    </p>
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setSelectedEmoji(emoji)}
                          className={cn(
                            'relative p-3 rounded-lg border transition-all hover:scale-110',
                            selectedEmoji === emoji
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-card hover:border-primary/30'
                          )}
                        >
                          <div className="text-3xl emoji">{emoji}</div>
                          {selectedEmoji === emoji && (
                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                disabled={saving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedEmoji || saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Mood'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
