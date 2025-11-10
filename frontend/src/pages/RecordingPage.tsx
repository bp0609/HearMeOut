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
  const [isUploading, setIsUploading] = useState(false);

  const handleLanguageContinue = () => {
    setStep('recording');
  };

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setStep('uploading');
    setIsUploading(true);

    try {
      // Convert blob to file
      const audioFile = blobToFile(audioBlob, `mood-${Date.now()}.webm`);

      // Upload to backend
      const result = await api.createMoodEntry(audioFile, selectedLanguage, duration);

      toast({
        title: 'Recording uploaded!',
        description: 'Now select your mood emoji',
      });

      // Navigate to sticker selection
      navigate(`/select-sticker/${result.id}`);
    } catch (error) {
      console.error('Upload error:', error);

      toast({
        title: 'Upload failed',
        description: 'Failed to process your recording. Please try again.',
        variant: 'destructive',
      });

      setStep('recording');
      setIsUploading(false);
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
            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
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
