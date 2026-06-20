"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

interface RoleGuardProps {
  readonly children: React.ReactNode;
  readonly allowedTipos: string[];
  readonly fallbackUrl?: string;
}

export default function RoleGuard({
  children,
  allowedTipos,
  fallbackUrl = "/login",
}: Readonly<RoleGuardProps>) {
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
