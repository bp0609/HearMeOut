import { useState, useEffect } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ActivitySelector } from '@/components/ActivitySelector';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { Activity, MoodEntry } from '@/types';

interface ActivityEditDialogProps {
    open: boolean;
    onClose: () => void;
    entry: MoodEntry | null;
    activities: Activity[];
    onUpdate: () => void;
}

export function ActivityEditDialog({
    open,
    onClose,
    entry,
    activities,
    onUpdate,
}: ActivityEditDialogProps) {
    const { toast } = useToast();
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Initialize selected activities when entry changes
    useEffect(() => {
        if (entry && entry.activities) {
            setSelectedActivities(entry.activities.map(a => a.activityKey));
        } else {
            setSelectedActivities([]);
        }
    }, [entry]);

    const handleSave = async () => {
        if (!entry) return;

        setSaving(true);
        try {
            await api.updateMoodEntry(entry.id, {
                activityKeys: selectedActivities,
            });

            toast({
                title: 'Activities updated!',
                description: 'Your activities have been saved',
            });

            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error updating activities:', error);
            toast({
                title: 'Error',
                description: 'Failed to update activities',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            onClose();
        }
    };

    if (!entry) return null;

    // Format date nicely
    const dateObj = new Date(entry.entryDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Calendar className="h-6 w-6 text-primary" />
                        Edit Activities
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-3xl emoji">{entry.selectedEmoji}</span>
                        <span className="text-base text-muted-foreground">{formattedDate}</span>
                    </div>
                </DialogHeader>

                <div className="mt-4">
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            Select activities • {selectedActivities.length} selected
                        </h3>
                    </div>

                    <ActivitySelector
                        activities={activities}
                        selectedActivities={selectedActivities}
                        onSelectionChange={setSelectedActivities}
                    />

                    <div className="mt-6 flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={saving}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>

                        <Button
                            onClick={handleSave}
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
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Activities
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
