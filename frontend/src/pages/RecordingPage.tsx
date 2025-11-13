import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceRecorder } from '@/components/Recording/VoiceRecorder';
import { LanguageSelector } from '@/components/Recording/LanguageSelector';
import { api } from '@/lib/api';
import { blobToFile } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import type { Language } from '@/types';

export default function RecordingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'language' | 'recording' | 'uploading'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  const handleLanguageContinue = () => {
    setStep('recording');
  };

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    console.log('[Recording] Recording complete callback fired:', {
      hasBlob: !!audioBlob,
      blobSize: audioBlob?.size,
      blobType: audioBlob?.type,
      duration,
    });

    // Validate blob before proceeding
    if (!audioBlob || audioBlob.size === 0) {
      console.error('[Recording] Invalid audio blob - cannot upload');

      toast({
        title: 'Recording failed',
        description: 'No audio data was captured. Please try recording again.',
        variant: 'destructive',
      });
      return;
    }

    console.log('[Recording] Valid audio blob detected, proceeding to upload');

    setStep('uploading');

    try {
      // Convert blob to file
      const audioFile = blobToFile(audioBlob, `mood-${Date.now()}.webm`);

      // Validate file after conversion
      if (!audioFile || audioFile.size === 0) {
        console.error('[Recording] File conversion failed');
        throw new Error('Failed to create audio file');
      }

      console.log('[Recording] File created successfully:', {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        fileType: audioFile.type,
      });

      // Upload to backend
      console.log('[Recording] Uploading to backend...', {
        language: selectedLanguage,
        duration,
      });

      const result = await api.createMoodEntry(audioFile, selectedLanguage, duration);

      toast({
        title: 'Recording uploaded!',
        description: 'Now select your mood emoji',
      });

      // Navigate to sticker selection with emotion scores
      navigate(`/select-sticker/${result.id}`, {
        state: { emotionScores: result.emotionScores },
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);

      const errorMessage = error.response?.data?.error ||
        error.response?.data?.details ||
        'Failed to process your recording. Please try again.';

      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setStep('recording');
    }
  };

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

          <h1 className="text-3xl font-bold">Daily Check-in</h1>
          <p className="text-muted-foreground mt-1">
            {step === 'language' && 'Choose your language'}
            {step === 'recording' && 'Record your mood'}
            {step === 'uploading' && 'Processing your recording...'}
          </p>
        </header>

        {/* Content */}
        <div className="animate-fadeIn">
          {step === 'language' && (
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelect={setSelectedLanguage}
              onContinue={handleLanguageContinue}
            />
          )}

          {step === 'recording' && (
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              language={selectedLanguage}
            />
          )}

          {step === 'uploading' && (
            <div className="text-center py-20">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analyzing your mood...</h3>
              <p className="text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
