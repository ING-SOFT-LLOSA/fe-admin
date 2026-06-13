"use client";
 
import type { ClienteRow } from "@/types/user";
 
type ClientHeaderProps = {
  client: ClienteRow;
  hasActiveProperties: boolean;
  onEdit: () => void;
  onDelete: () => void;
};
 
export default function ClientHeader({
  client,
  hasActiveProperties,
  onEdit,
  onDelete,
}: ClientHeaderProps) {
  const initials = client.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
 
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
      {/* Avatar + Name */}
      <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center border-b border-slate-100 dark:border-white/10">
        <div className="w-16 h-16 rounded-full bg-build-main/10 dark:bg-white/10 flex items-center justify-center mb-3">
          <span className="text-xl font-bold text-build-main dark:text-white">{initials}</span>
        </div>
        <h3 className="text-base font-bold text-build-main dark:text-white leading-tight">
          {client.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{client.email}</p>
        {client.phone && client.phone !== "—" && (
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{client.phone}</p>
        )}
      </div>
 
      {/* Info rows */}
      <div className="px-6 py-4 space-y-2 border-b border-slate-100 dark:border-white/10">
        <InfoRow icon="badge" label="DNI / CE" value={client.dni} />
        <InfoRow icon="calendar_today" label="Registro" value={client.createdAt ?? "—"} />
        <InfoRow
          icon="circle"
          label="Estado"
          value={client.status}
          valueClassName={
            client.status === "ACTIVO" || client.status === "Activo" || client.status === "Registrado"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-400 dark:text-white/40"
          }
        />
      </div>
 
      {/* Actions */}
      <div className="px-6 py-4 space-y-2">
        {/* Edit — secondary */}
        <button
          type="button"
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-build-main dark:text-white rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Editar información
        </button>
 
        {/* Delete — destructive, subtle */}
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Eliminar cliente
        </button>
      </div>
    </div>
  );
}
 
// ── Helper ────────────────────────────────────────────────────────────────────
 
function InfoRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: string;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40 shrink-0">
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
        {label}
      </div>
      <span className={`text-xs font-semibold text-slate-700 dark:text-white/80 truncate ${valueClassName ?? ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}
 