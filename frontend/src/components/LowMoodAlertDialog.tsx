import { Heart, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { PatternAlert } from '@/types';

interface LowMoodAlertDialogProps {
    alert: PatternAlert | null;
    open: boolean;
    onDismiss: () => void;
}

export function LowMoodAlertDialog({ alert, open, onDismiss }: LowMoodAlertDialogProps) {
    if (!alert) return null;

    const patternDetails = alert.patternDetails as any;
    const days = patternDetails?.consecutiveDays || 5;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                            <Heart className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">
                        We've noticed a pattern
                    </DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        {alert.message}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Pattern Info */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                        <p className="text-sm text-purple-900 font-medium mb-2">
                            📊 Your recent pattern:
                        </p>
                        <p className="text-sm text-purple-800">
                            {days} consecutive days of low mood
                        </p>
                        {patternDetails?.emojis && (
                            <div className="mt-2 flex gap-1">
                                {patternDetails.emojis.map((emoji: string, idx: number) => (
                                    <span key={idx} className="text-2xl">
                                        {emoji}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">
                            💜 Here are some things that might help:
                        </p>
                        <ul className="space-y-2">
                            {alert.suggestions.slice(0, 3).map((suggestion, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-purple-500 mt-0.5">•</span>
                                    <span>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Important Note */}
                    <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
                        <p className="text-xs text-pink-900">
                            <strong>Remember:</strong> It's completely okay to have difficult days. 
                            If you're struggling, please reach out to someone you trust or a mental health professional.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        <Button
                            onClick={onDismiss}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            I understand
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

