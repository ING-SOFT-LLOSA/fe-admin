"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

const LOGIN_PATHS = new Set(["/login"]);

export default function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !LOGIN_PATHS.has(pathname)) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9fb] text-[#41484c] text-sm font-semibold">
        Cargando sesión…
      </div>
    );
  }

  if (!isAuthenticated && !LOGIN_PATHS.has(pathname)) {
    return null;
  }

  return <>{children}</>;
}
