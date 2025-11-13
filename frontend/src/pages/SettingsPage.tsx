import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { UserSettings } from '@/types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.getSettings();
        setSettings(data);
        setOriginalSettings(data); // Store original settings
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    if (!settings || !originalSettings) return;

    // Check if audio storage is being disabled
    const isDisablingAudioStorage =
      originalSettings.audioStorageEnabled === true &&
      settings.audioStorageEnabled === false;

    if (isDisablingAudioStorage) {
      const confirmed = window.confirm(
        'Disabling audio storage will permanently delete all your stored voice recordings. ' +
        'This action cannot be undone. Do you want to continue?'
      );

      if (!confirmed) {
        return; // User cancelled
      }
    }

    setSaving(true);

    try {
      // Only send fields that can be updated (exclude read-only fields)
      const updateData: Partial<UserSettings> = {
        reminderEnabled: settings.reminderEnabled,
        interventionThreshold: settings.interventionThreshold,
        audioStorageEnabled: settings.audioStorageEnabled,
      };

      // Only include reminderTime if it's not null
      if (settings.reminderTime !== null) {
        updateData.reminderTime = settings.reminderTime;
      }

      const updatedSettings = await api.updateSettings(updateData);
      setSettings(updatedSettings);
      setOriginalSettings(updatedSettings); // Update original settings

      toast({
        title: 'Settings saved',
        description: isDisablingAudioStorage
          ? 'Your audio recordings have been deleted.'
          : 'Your preferences have been updated',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
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
            <SettingsIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Customize your experience</p>
            </div>
          </div>
        </header>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Reminders</CardTitle>
              <CardDescription>
                Get notified to complete your daily check-in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reminderEnabled}
                  onChange={(e) => updateSetting('reminderEnabled', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="font-medium">Enable daily reminders</span>
              </label>

              {settings.reminderEnabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={settings.reminderTime || '20:00'}
                    onChange={(e) => updateSetting('reminderTime', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intervention Threshold */}
          <Card>
            <CardHeader>
              <CardTitle>Pattern Detection</CardTitle>
              <CardDescription>
                Get support suggestions when patterns are detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Alert after consecutive low-mood days
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="3"
                      max="10"
                      value={settings.interventionThreshold}
                      onChange={(e) =>
                        updateSetting('interventionThreshold', parseInt(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="font-bold text-xl w-12 text-center">
                      {settings.interventionThreshold}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You'll receive gentle suggestions if you log low mood for this many days in a row
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>
                Control how your data is stored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.audioStorageEnabled}
                    onChange={(e) => updateSetting('audioStorageEnabled', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Store voice recordings</div>
                    <p className="text-sm text-muted-foreground">
                      Keep your voice recordings for future reference. You can view and delete them anytime from the Data History page.
                    </p>
                  </div>
                </label>

                {originalSettings && originalSettings.audioStorageEnabled && !settings.audioStorageEnabled && (
                  <div className="flex gap-3 items-start bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Warning:</strong> Disabling this will permanently delete all previously stored recordings when you save settings.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
