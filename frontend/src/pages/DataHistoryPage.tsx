import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Trash2, Calendar, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { AudioRecording } from '@/types';

export default function DataHistoryPage() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [recordings, setRecordings] = useState<AudioRecording[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [audioStorageEnabled, setAudioStorageEnabled] = useState(true);
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

    useEffect(() => {
        fetchRecordings();
        checkTodayEntry();
    }, []);

    const fetchRecordings = async () => {
        try {
            setLoading(true);
            const settings = await api.getSettings();
            setAudioStorageEnabled(settings.audioStorageEnabled);

            if (settings.audioStorageEnabled) {
                const data = await api.getAudioRecordings();
                // Only show recordings where the audio file exists
                const recordingsWithFiles = data.filter(
                    (recording) => recording.fileExists && recording.audioFilePath
                );
                setRecordings(recordingsWithFiles);
            }
        } catch (error) {
            console.error('Error fetching recordings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load recordings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const checkTodayEntry = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const entry = await api.getMoodEntryByDate(today);
            setHasCheckedInToday(!!entry);
        } catch (error) {
            // If entry doesn't exist, hasCheckedInToday remains false
            setHasCheckedInToday(false);
        }
    };

    const handleDelete = async (entryId: string) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this recording? This action cannot be undone.'
        );

        if (!confirmed) return;

        setDeleting(entryId);
        try {
            await api.deleteAudioRecording(entryId);
            setRecordings(recordings.filter((r) => r.id !== entryId));

            toast({
                title: 'Recording deleted',
                description: 'The audio recording has been permanently deleted.',
            });
        } catch (error) {
            console.error('Error deleting recording:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete recording',
                variant: 'destructive',
            });
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getLanguageName = (code: string) => {
        const languages: Record<string, string> = {
            en: 'English',
            hi: 'Hindi',
            gu: 'Gujarati',
        };
        return languages[code] || code;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading recordings...</p>
                </div>
            </div>
        );
    }

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
                        <Database className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold">Data History</h1>
                            <p className="text-muted-foreground">
                                Your stored voice recordings
                            </p>
                        </div>
                    </div>
                </header>

                {/* Content */}
                {!audioStorageEnabled ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Audio Storage Disabled</h3>
                            <p className="text-muted-foreground mb-6">
                                You haven't enabled audio storage. Enable it in Settings to start storing your voice recordings.
                            </p>
                            <Button onClick={() => navigate('/settings')}>
                                Go to Settings
                            </Button>
                        </CardContent>
                    </Card>
                ) : recordings.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Recordings Yet</h3>
                            <p className="text-muted-foreground mb-6">
                                {hasCheckedInToday
                                    ? "You don't have any stored voice recordings yet."
                                    : "You don't have any stored voice recordings yet. Start recording to see your history here."
                                }
                            </p>
                            {!hasCheckedInToday && (
                                <Button onClick={() => navigate('/record')}>
                                    Start Recording
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">
                                {recordings.length} recording{recordings.length !== 1 ? 's' : ''} stored
                            </p>
                        </div>

                        {recordings.map((recording) => (
                            <Card key={recording.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                {recording.selectedEmoji && (
                                                    <span className="text-4xl">{recording.selectedEmoji}</span>
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {formatDate(recording.entryDate)}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {formatDuration(recording.duration)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Globe className="h-4 w-4" />
                                                            {getLanguageName(recording.language)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            {new Date(recording.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(recording.id)}
                                            disabled={deleting === recording.id}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {deleting === recording.id ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
