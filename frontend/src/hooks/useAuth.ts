// Authentication hook using Clerk

import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useAuth() {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user } = useUser();
  const [isTokenSet, setIsTokenSet] = useState(false);

  // Set auth token when user signs in
  useEffect(() => {
    async function setToken() {
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          api.setAuthToken(token);
          setIsTokenSet(true);
        }
      } else {
        api.removeAuthToken();
        setIsTokenSet(false);
      }
    }

    if (isLoaded) {
      setToken();
    }
  }, [isLoaded, isSignedIn, getToken]);

  return {
    isLoaded,
    isSignedIn,
    user,
    userId: user?.id,
    isTokenSet, // Export this so components know when token is ready
  };
}
