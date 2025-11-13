// Hook for live speech recognition using Web Speech API

import { useState, useRef, useCallback, useEffect } from 'react';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

// Extend Window interface for webkit support
declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

interface UseSpeechRecognitionProps {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
    transcript: string;
    interimTranscript: string;
    isListening: boolean;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
}

export function useSpeechRecognition({
    language = 'en-US',
    continuous = true,
    interimResults = true,
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn {
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef('');
    const isManualStopRef = useRef(false);

    // Check if Web Speech API is supported
    const isSupported =
        typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Initialize recognition
    useEffect(() => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser');
            return;
        }

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();

        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = language;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('[SpeechRecognition] Started listening');
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcriptText = result[0].transcript;

                if (result.isFinal) {
                    final += transcriptText + ' ';
                } else {
                    interim += transcriptText;
                }
            }

            if (final) {
                finalTranscriptRef.current += final;
                setTranscript(finalTranscriptRef.current);
                setInterimTranscript('');
            }

            if (interim) {
                setInterimTranscript(interim);
            }

            console.log('[SpeechRecognition] Transcript:', {
                final,
                interim,
                total: finalTranscriptRef.current,
            });
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('[SpeechRecognition] Error:', event.error);

            switch (event.error) {
                case 'no-speech':
                    setError('No speech detected. Please try speaking again.');
                    break;
                case 'audio-capture':
                    setError('No microphone was found or microphone is already in use.');
                    break;
                case 'not-allowed':
                    setError('Microphone permission denied.');
                    break;
                case 'network':
                    setError('Network error occurred.');
                    break;
                case 'aborted':
                    // Ignore aborted errors (happens when stopping)
                    break;
                default:
                    setError(`Speech recognition error: ${event.error}`);
            }

            setIsListening(false);
        };

        recognition.onend = () => {
            console.log('[SpeechRecognition] Stopped listening');
            setIsListening(false);

            // Restart if continuous mode is enabled and wasn't manually stopped
            if (continuous && !isManualStopRef.current) {
                try {
                    recognition.start();
                } catch (err) {
                    console.error('[SpeechRecognition] Failed to restart:', err);
                }
            }
            isManualStopRef.current = false;
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                isManualStopRef.current = true;
                recognitionRef.current.stop();
            }
        };
    }, [language, continuous, interimResults, isSupported]);

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser');
            return;
        }

        if (!recognitionRef.current || isListening) {
            return;
        }

        try {
            recognitionRef.current.start();
            console.log('[SpeechRecognition] Starting recognition');
        } catch (err) {
            console.error('[SpeechRecognition] Error starting:', err);
            setError('Failed to start speech recognition');
        }
    }, [isListening, isSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                isManualStopRef.current = true;
                recognitionRef.current.stop();
                console.log('[SpeechRecognition] Stopping recognition');
            } catch (err) {
                console.error('[SpeechRecognition] Error stopping:', err);
            }
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        finalTranscriptRef.current = '';
    }, []);

    return {
        transcript,
        interimTranscript,
        isListening,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
        error,
    };
}
