import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { CLERK_PUBLISHABLE_KEY } from './lib/constants';
import HomePage from './pages/HomePage';
import RecordingPage from './pages/RecordingPage';
import StickerSelectionPage from './pages/StickerSelectionPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import { Toaster } from './components/ui/toaster';

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <BrowserRouter>
        <SignedIn>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/record" element={<RecordingPage />} />
            <Route path="/select-sticker/:entryId" element={<StickerSelectionPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SignedIn>

        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </BrowserRouter>

      <Toaster />
    </ClerkProvider>
  );
}

export default App;
