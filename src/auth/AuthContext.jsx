import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured } from '../lib/firebase';
import { demoAuth } from './demoAuth';
import { firebaseAuth } from './firebaseAuth';

const api = isFirebaseConfigured ? firebaseAuth : demoAuth;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      api.subscribe((profile) => {
        setUser(profile);
        setLoading(false);
      }),
    [],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isDemo: !isFirebaseConfigured,
      signUpEmail: async (d) => setUser(await api.signUpEmail(d)),
      signInEmail: async (d) => setUser(await api.signInEmail(d)),
      signInGoogle: async () => setUser(await api.signInGoogle()),
      signOut: api.signOut,
      userExists: api.userExists,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
