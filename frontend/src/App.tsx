import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { CLERK_PUBLISHABLE_KEY } from './lib/constants';
import { useAuth } from './hooks/useAuth';
import { api } from './lib/api';
import HomePage from './pages/HomePage';
import RecordingPage from './pages/RecordingPage';
import StickerSelectionPage from './pages/StickerSelectionPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import DataHistoryPage from './pages/DataHistoryPage';
import AudioConsentDialog from './components/AudioConsentDialog';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/useToast';
import { Button } from './components/ui/button';

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

// Component to initialize auth globally for all authenticated routes
function AuthProvider() {
  useAuth(); // Sets up token getter for API client
  return null;
}

// Component to handle consent flow
function ConsentHandler() {
  const { isLoaded, isSignedIn } = useAuth();
  const { toast } = useToast();
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkConsent() {
      if (!isLoaded || !isSignedIn) return;

      try {
        const settings = await api.getSettings();

        // If consent hasn't been asked yet (null), show dialog
        if (settings.audioStorageConsent === null) {
          setShowConsentDialog(true);
        }
      } catch (error) {
        console.error('Error checking consent:', error);
      } finally {
        setIsChecking(false);
      }
    }

    checkConsent();
  }, [isLoaded, isSignedIn]);

  const handleConsent = async (consent: boolean) => {
    setIsSubmitting(true);
    try {
      await api.setAudioConsent(consent);
      setShowConsentDialog(false);

      toast({
        title: consent ? 'Audio storage enabled' : 'Audio storage disabled',
        description: consent
          ? 'Your voice recordings will be securely stored.'
          : 'We\'ll only use your voice for analysis and delete it immediately.',
      });
    } catch (error) {
      console.error('Error setting consent:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your preference. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AudioConsentDialog
        open={showConsentDialog}
        onConsent={handleConsent}
        loading={isSubmitting}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/record" element={<RecordingPage />} />
        <Route path="/select-sticker/:entryId" element={<StickerSelectionPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/data-history" element={<DataHistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// Sign-in page component
function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          HearMeOut
        </h1>
        <p className="text-muted-foreground mb-8">
          Your personal mood tracking companion
        </p>
        <SignInButton mode="modal">
          <Button size="lg" className="w-full">
            Sign In to Continue
          </Button>
        </SignInButton>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <SignedIn>
          <AuthProvider />
          <ConsentHandler />
        </SignedIn>

        <SignedOut>
          <SignInPage />
        </SignedOut>

        <Toaster />
      </ClerkProvider>
    </BrowserRouter>
  );
}

export default App;
