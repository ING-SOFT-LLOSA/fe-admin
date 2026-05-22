"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredFuncs?: string[];
  fallbackUrl?: string;
}

export default function PermissionGuard({
  children,
  requiredFuncs = [],
  fallbackUrl = "/employee/dashboard",
}: PermissionGuardProps) {
  const { perfil, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Si no tiene las funciones necesarias y no es ADMIN, redirigir
    const hasPermission =
      perfil?.rol === "ADMIN" ||
      requiredFuncs.length === 0 ||
      requiredFuncs.some((func) => perfil?.funciones?.includes(func));

    if (!hasPermission) {
      router.replace(fallbackUrl);
    }
  }, [isLoading, isAuthenticated, perfil, requiredFuncs, fallbackUrl, router]);

  if (isLoading || !isAuthenticated) return null;

  const hasPermission =
    perfil?.rol === "ADMIN" ||
    requiredFuncs.length === 0 ||
    requiredFuncs.some((func) => perfil?.funciones?.includes(func));

  if (!hasPermission) return null;

  return <>{children}</>;
}
