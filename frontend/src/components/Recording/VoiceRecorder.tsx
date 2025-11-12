import { Mic, Square, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { formatDuration } from '@/lib/utils';
import { RECORDING_CONFIG } from '@/lib/constants';
import { useEffect, useRef } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  transcription?: string;
}

export function VoiceRecorder({ onRecordingComplete, transcription }: VoiceRecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error,
  } = useAudioRecorder();

  const progress = (duration / RECORDING_CONFIG.maxDuration) * 100;
  const remainingTime = RECORDING_CONFIG.maxDuration - duration;
  const canStop = duration >= RECORDING_CONFIG.minDuration;

  // Use ref to prevent stale closure issues with callback
  const onRecordingCompleteRef = useRef(onRecordingComplete);

  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  useEffect(() => {
    if (audioBlob && !isRecording) {
      console.log('[VoiceRecorder] Triggering recording complete callback');
      onRecordingCompleteRef.current(audioBlob, duration);
    }
  }, [audioBlob, isRecording, duration]);

  return (
    <Card className="p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Status */}
        <div className="text-center">
          {error ? (
            <div className="text-destructive mb-4">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                {isRecording ? (
                  <div className="recording-pulse inline-block p-6 rounded-full bg-red-100">
                    <Mic className="h-12 w-12 text-red-500" />
                  </div>
                ) : (
                  <div className="inline-block p-6 rounded-full bg-muted">
                    <Mic className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold mb-2">
                {isRecording
                  ? isPaused
                    ? 'Paused'
                    : 'Recording...'
                  : 'Ready to Record'}
              </h3>

              {isRecording && (
                <p className="text-muted-foreground">
                  {canStop
                    ? `${remainingTime}s remaining`
                    : `${RECORDING_CONFIG.minDuration - duration}s minimum`}
                </p>
              )}
            </>
          )}
        </div>

        {/* Timer and Progress */}
        {isRecording && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold">
                {formatDuration(duration)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{RECORDING_CONFIG.minDuration}s min</span>
              <span>{RECORDING_CONFIG.maxDuration}s max</span>
            </div>
          </div>
        )}

        {/* Transcription Preview */}
        {transcription && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Live Transcription:</p>
            <p className="text-sm">{transcription}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button
              size="lg"
              onClick={startRecording}
              disabled={!!error}
              className="px-8"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={pauseRecording}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resumeRecording}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}

              <Button
                size="lg"
                onClick={stopRecording}
                disabled={!canStop}
                variant="destructive"
              >
                <Square className="mr-2 h-4 w-4" />
                {canStop ? 'Stop' : `Wait ${RECORDING_CONFIG.minDuration - duration}s`}
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        {!isRecording && !error && (
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Record a {RECORDING_CONFIG.minDuration}-{RECORDING_CONFIG.maxDuration} second voice note about your day.</p>
            <p>Speak naturally and share how you're feeling.</p>
          </div>
        )}

        {error && (
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
}
