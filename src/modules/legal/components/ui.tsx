// ─── InfoChip ─────────────────────────────────────────────────────────────────

export function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60">
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </span>
  );
}

// ─── ResumenKpi ───────────────────────────────────────────────────────────────

export function ResumenKpi({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400 dark:text-white/40 mb-2">
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-build-main dark:text-white truncate">{value}</p>
    </div>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

export function LoadingSpinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-3 text-slate-400 dark:text-white/40">
        <Spinner className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
      {message}
    </div>
  );
}
