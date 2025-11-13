import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Database, Trash2 } from 'lucide-react';

interface AudioConsentDialogProps {
    open: boolean;
    onConsent: (consent: boolean) => void;
    loading?: boolean;
}

export default function AudioConsentDialog({
    open,
    onConsent,
    loading = false,
}: AudioConsentDialogProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConsent = async (consent: boolean) => {
        setIsProcessing(true);
        await onConsent(consent);
        setIsProcessing(false);
    };

    return (
        <Dialog open={open} onOpenChange={() => { }} /* Prevent closing without making a decision */>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-8 w-8 text-primary" />
                        <DialogTitle className="text-2xl">Audio Storage Consent</DialogTitle>
                    </div>
                    <DialogDescription className="text-base pt-4">
                        Welcome to HearMeOut! To help you track your emotional journey, we'd like your permission to store your voice recordings.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                            <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold mb-1">If you agree:</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your voice recordings will be securely stored and available in the Data History page.
                                    You can review or delete individual recordings anytime.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <Trash2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold mb-1">If you decline:</h4>
                                <p className="text-sm text-muted-foreground">
                                    We'll only use your voice for analysis and delete it immediately after.
                                    Your mood data and insights will still be saved.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            💡 <strong>Note:</strong> You can change this setting anytime in Settings.
                            Disabling storage later will delete all previously stored recordings.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => handleConsent(false)}
                        disabled={isProcessing || loading}
                        className="flex-1 sm:flex-none"
                    >
                        Decline
                    </Button>
                    <Button
                        onClick={() => handleConsent(true)}
                        disabled={isProcessing || loading}
                        className="flex-1 sm:flex-none"
                    >
                        {isProcessing || loading ? 'Processing...' : 'I Agree'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
