// Authentication hook using Clerk

import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { api } from '@/lib/api';

export function useAuth() {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user } = useUser();

  // Provide getToken function to API client for dynamic token fetching
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // Give API client access to getToken function
        // Token will be fetched fresh for each request via interceptor
        api.setTokenGetter(getToken);
      } else {
        // Clear token getter on sign out
        api.clearTokenGetter();
      }
    }
  }, [isLoaded, isSignedIn, getToken]);

  return {
    isLoaded,
    isSignedIn,
    user,
    userId: user?.id,
  };
}
