"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedTipos: string[];
  fallbackUrl?: string;
}

export default function RoleGuard({
  children,
  allowedTipos,
  fallbackUrl = "/login",
}: RoleGuardProps) {
  const { perfil, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    if (perfil && !allowedTipos.includes(perfil.tipoUsuario)) {
      router.replace(fallbackUrl);
    }
  }, [isLoading, isAuthenticated, perfil, allowedTipos, fallbackUrl, router]);

  if (isLoading || !isAuthenticated) return null;
  if (perfil && !allowedTipos.includes(perfil.tipoUsuario)) return null;

  return <>{children}</>;
}
