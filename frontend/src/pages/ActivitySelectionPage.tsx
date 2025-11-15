import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ActivitySelector } from '@/components/ActivitySelector';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { Activity } from '@/types';

export default function ActivitySelectionPage() {
    const navigate = useNavigate();
    const { entryId } = useParams<{ entryId: string }>();
    const { toast } = useToast();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch activities on mount
    useEffect(() => {
        async function fetchActivities() {
            try {
                const data = await api.getActivities();
                setActivities(data);
            } catch (error) {
                console.error('Error fetching activities:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load activities',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        }

        fetchActivities();
    }, [toast]);

    const handleContinue = async () => {
        if (!entryId) {
            navigate('/');
            return;
        }

        setSaving(true);

        try {
            // Update mood entry with activities
            await api.updateMoodEntry(entryId, {
                activityKeys: selectedActivities,
            });

            toast({
                title: 'Activities saved!',
                description: 'Your daily check-in is complete',
            });

            navigate('/');
        } catch (error) {
            console.error('Error saving activities:', error);
            toast({
                title: 'Error',
                description: 'Failed to save your activities',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        toast({
            title: 'Skipped',
            description: 'You can add activities later from the calendar',
        });
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl font-semibold text-purple-600 mb-2">Loading...</div>
                    <p className="text-muted-foreground">Loading activities</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="mb-2"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Skip for now
                    </Button>

                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="h-8 w-8 text-purple-500" />
                        <h1 className="text-3xl font-bold">What did you do today?</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Select activities to help us understand what affects your mood
                    </p>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Activities</CardTitle>
                        <CardDescription>
                            Select all that apply • {selectedActivities.length} selected
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <ActivitySelector
                            activities={activities}
                            selectedActivities={selectedActivities}
                            onSelectionChange={setSelectedActivities}
                        />

                        {/* Action Buttons */}
                        <div className="mt-8 flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={handleSkip}
                                disabled={saving}
                            >
                                Skip
                            </Button>

                            <Button
                                onClick={handleContinue}
                                disabled={saving}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                {saving ? (
                                    <>
                                        <div className="spinner mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Help Text */}
                        {selectedActivities.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground mt-6">
                                💡 Tip: You can select multiple activities or skip this step
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
