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

import { fetchPerfil } from "@/lib/auth/api";
import { toAuthErrorMessage } from "@/lib/auth/errors";
import {
  loginWithEmail,
  loginWithGoogle,
  logout as authLogout,
} from "@/lib/auth/login";
import {
  clearSession,
  getStoredPerfil,
  getStoredToken,
  saveSession,
} from "@/lib/auth/session";
import type { PerfilConPermisos } from "@/types/auth";

interface AuthContextValue {
  perfil: PerfilConPermisos | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginEmail: (email: string, password: string) => Promise<PerfilConPermisos>;
  loginGoogle: () => Promise<PerfilConPermisos>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilConPermisos | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const storedToken = getStoredToken();
      const storedPerfil = getStoredPerfil();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const fresh = await fetchPerfil(storedToken);
        saveSession(storedToken, fresh);
        setToken(storedToken);
        setPerfil(fresh);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }
    restore();
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

  const value = useMemo<AuthContextValue>(
    () => ({
      perfil,
      token,
      isLoading,
      isAuthenticated: !!perfil && !!token,
      loginEmail,
      loginGoogle,
      logout,
    }),
    [perfil, token, isLoading, loginEmail, loginGoogle, logout],
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
