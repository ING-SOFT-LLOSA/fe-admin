"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { fetchPerfil } from "@/lib/auth/api";
import {
  loginWithEmail,
  loginWithGoogle,
  logout as authLogout,
  resetPassword as authResetPassword,
} from "@/lib/auth/login";
import {
  clearSession,
  getStoredToken,
  saveSession,
} from "@/lib/auth/session";
import { getFirebaseAuth } from "@/lib/firebase";
// Removed mock imports
import type { PerfilConPermisos } from "@/types/auth";

const SESSION_TIMEOUT = 3600000; // 1 hour in ms
const LAST_ACTIVITY_KEY = "llosa_last_activity";

interface AuthContextValue {
  readonly perfil: PerfilConPermisos | null;
  readonly token: string | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly loginEmail: (email: string, password: string) => Promise<PerfilConPermisos>;
  readonly loginGoogle: () => Promise<PerfilConPermisos>;
  readonly logout: () => Promise<void>;
  readonly resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [perfil, setPerfil] = useState<PerfilConPermisos | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastActivityRef = useRef<number>(0);
  // Flag para evitar que onAuthStateChanged interfiera durante el proceso de
  // login activo. Firebase dispara el listener en cuanto autentica al usuario,
  // antes de que saveSession haya escrito la cookie, lo que causaba un signOut
  // automático por "cookie vacía".
  const isLoggingInRef = useRef(false);

  // -- Sync with Firebase auth state ----------------------------------------
  // onAuthStateChanged fires once immediately with the current user (or
  // null), then again whenever the auth state changes.  This replaces the
  // old one-shot restore() pattern and correctly handles token expiry.
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Si hay un login en curso, ignorar este disparo del listener.
      // La cookie todavía no existe porque saveSession aún no corrió.
      if (isLoggingInRef.current) return;

      const storedToken = getStoredToken();

      if (!storedToken || !firebaseUser) {
        clearSession();
        setPerfil(null);
        setToken(null);
        if (firebaseUser) {
          try {
            await signOut(auth);
          } catch {
            // ignore
          }
        }
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
        // We do not fallback to a stored profile anymore to avoid RBAC bypass.
        clearSession();
        setPerfil(null);
        setToken(null);
        try {
          await signOut(auth);
        } catch {
          // ignore
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
    globalThis.addEventListener("llosa:unauthorized", handleUnauthorized);
    return () =>
      globalThis.removeEventListener("llosa:unauthorized", handleUnauthorized);
  }, []);

  const loginEmail = useCallback(async (email: string, password: string) => {
    isLoggingInRef.current = true;
    let success = false;
    try {
      const p = await loginWithEmail(email, password);
      const t = getStoredToken();
      setPerfil(p);
      setToken(t);
      success = true;
      return p;
    } finally {
      isLoggingInRef.current = false;
      // Si el login falló (éxito = false), Firebase puede haber quedado
      // autenticado internamente. Hacemos signOut para dejarlo limpio.
      if (!success) {
        try {
          await signOut(getFirebaseAuth());
        } catch {
          // ignore — puede que no haya sesión Firebase activa
        }
      }
    }
  }, []);

  const loginGoogle = useCallback(async () => {
    isLoggingInRef.current = true;
    let success = false;
    try {
      const p = await loginWithGoogle();
      const t = getStoredToken();
      setPerfil(p);
      setToken(t);
      success = true;
      return p;
    } finally {
      isLoggingInRef.current = false;
      // Igual que loginEmail: si falló después de que Firebase autenticó,
      // limpiamos la sesión Firebase para no dejar un estado inconsistente.
      if (!success) {
        try {
          await signOut(getFirebaseAuth());
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setPerfil(null);
    setToken(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await authResetPassword(email);
  }, []);

  // -- Inactivity timeout (1 hour) ------------------------------------------
  const isAuthenticated = !!perfil && !!token;
  useEffect(() => {
    if (!isAuthenticated) return;

    const now = Date.now();
    const storedActivity = globalThis.window === undefined ? 0 : Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    lastActivityRef.current = Number.isFinite(storedActivity) && storedActivity > 0 ? storedActivity : now;

    const isInactive = () => {
      return Date.now() - lastActivityRef.current > SESSION_TIMEOUT;
    };

    const checkAndLogoutIfInactive = (): boolean => {
      if (isInactive()) {
        void logout();
        return true;
      }
      return false;
    };

    const updateActivity = () => {
      const timestamp = Date.now();
      if (timestamp - lastActivityRef.current < 1000) return;
      lastActivityRef.current = timestamp;
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
      } catch {
        // ignore
      }
    };

    if (checkAndLogoutIfInactive()) return;
    updateActivity();

    const handleActivity = () => {
      if (checkAndLogoutIfInactive()) return;
      updateActivity();
    };

    const activityEvents = ["keydown", "mousemove", "mousedown", "scroll", "touchstart"];
    activityEvents.forEach((eventName) =>
      globalThis.addEventListener(eventName, handleActivity, { passive: true })
    );

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (checkAndLogoutIfInactive()) return;
        updateActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const intervalId = globalThis.setInterval(() => {
      checkAndLogoutIfInactive();
    }, 30000); // Check every 30 seconds

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
        const parsed = Number(event.newValue);
        if (Number.isFinite(parsed) && parsed > lastActivityRef.current) {
          lastActivityRef.current = parsed;
        }
      }
    };
    globalThis.addEventListener("storage", handleStorage);

    return () => {
      activityEvents.forEach((eventName) =>
        globalThis.removeEventListener(eventName, handleActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibility);
      globalThis.clearInterval(intervalId);
      globalThis.removeEventListener("storage", handleStorage);
    };
  }, [isAuthenticated, logout]);

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
