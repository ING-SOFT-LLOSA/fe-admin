"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { fetchPerfil } from "@/lib/auth/api";
import { toAuthErrorMessage } from "@/lib/auth/errors";
import {
  loginWithEmail,
  loginWithGoogle,
  logout as authLogout,
  resetPassword as authResetPassword,
} from "@/lib/auth/login";
import {
  clearSession,
  getStoredPerfil,
  getStoredToken,
  saveSession,
} from "@/lib/auth/session";
import { getFirebaseAuth } from "@/lib/firebase";
// Removed mock imports
import type { PerfilConPermisos } from "@/types/auth";

interface AuthContextValue {
  perfil: PerfilConPermisos | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginEmail: (email: string, password: string) => Promise<PerfilConPermisos>;
  loginGoogle: () => Promise<PerfilConPermisos>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilConPermisos | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -- Sync with Firebase auth state ----------------------------------------
  // onAuthStateChanged fires once immediately with the current user (or
  // null), then again whenever the auth state changes.  This replaces the
  // old one-shot restore() pattern and correctly handles token expiry.
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase session ended (logout, token revoked, or never existed).
        clearSession();
        setPerfil(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        // Force-refresh so we always hold a valid, non-expired JWT.
        const freshToken = await firebaseUser.getIdToken(true);
        const fresh = await fetchPerfil(freshToken);
        saveSession(freshToken, fresh);
        setToken(freshToken);
        setPerfil(fresh);
      } catch {
        // fetchPerfil failed (network error, backend down, etc.).
        // Fall back to the stored profile so the user isn't ejected on
        // a transient error, but clear the session if there's nothing stored.
        const cached = getStoredPerfil();
        if (cached) {
          const storedToken = getStoredToken();
          setPerfil(cached);
          setToken(storedToken);
        } else {
          clearSession();
          setPerfil(null);
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // -- React to 401 responses from the API ----------------------------------
  // http.ts dispatches this event when the backend rejects the token.
  // Clearing React state here makes isAuthenticated -> false which
  // causes AuthGuard to redirect to /login.
  useEffect(() => {
    function handleUnauthorized() {
      setPerfil(null);
      setToken(null);
    }
    window.addEventListener("llosa:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("llosa:unauthorized", handleUnauthorized);
  }, []);

  const loginEmail = useCallback(async (email: string, password: string) => {
    const p = await loginWithEmail(email, password);
    const t = getStoredToken();
    setPerfil(p);
    setToken(t);
    return p;
  }, []);

  const loginGoogle = useCallback(async () => {
    const p = await loginWithGoogle();
    const t = getStoredToken();
    setPerfil(p);
    setToken(t);
    return p;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setPerfil(null);
    setToken(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await authResetPassword(email);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      perfil,
      token,
      isLoading,
      isAuthenticated: !!perfil && !!token,
      loginEmail,
      loginGoogle,
      logout,
      resetPassword,
    }),
    [perfil, token, isLoading, loginEmail, loginGoogle, logout, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
