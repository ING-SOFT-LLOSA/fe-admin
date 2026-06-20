"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/10 animate-pulse" />;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined text-[20px]">
          {resolvedTheme === "dark" ? "dark_mode" : "light_mode"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in py-1">
          <button
            onClick={() => { setTheme("light"); setIsOpen(false); }}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${theme === "light" ? "text-build-main dark:text-white font-semibold" : "text-slate-600 dark:text-white/70"}`}
          >
            <span className="material-symbols-outlined text-[18px]">light_mode</span>
            Claro
          </button>
          <button
            onClick={() => { setTheme("dark"); setIsOpen(false); }}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${theme === "dark" ? "text-build-main dark:text-white font-semibold" : "text-slate-600 dark:text-white/70"}`}
          >
            <span className="material-symbols-outlined text-[18px]">dark_mode</span>
            Oscuro
          </button>
          <button
            onClick={() => { setTheme("system"); setIsOpen(false); }}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${theme === "system" ? "text-build-main dark:text-white font-semibold" : "text-slate-600 dark:text-white/70"}`}
          >
            <span className="material-symbols-outlined text-[18px]">computer</span>
            Sistema
          </button>
        </div>
      )}
    </div>
  );
}
