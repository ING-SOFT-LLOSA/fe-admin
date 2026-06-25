"use client";

import Link from "next/link";
import type { ClienteRow } from "@/types/user";

type ClientHeaderProps = {
  readonly client: ClienteRow;
  readonly hasActiveProperties: boolean;
  readonly clientId?: string | number;
  readonly totalContratos?: number;
  readonly totalUnidades?: number;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onAssign?: () => void;
};

export default function ClientHeader({
  client,
  hasActiveProperties,
  clientId,
  totalContratos = 0,
  totalUnidades = 0,
  onEdit,
  onDelete,
  onAssign,
}: Readonly<ClientHeaderProps>) {
  const initials = client.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isActive =
    client.status === "ACTIVO" ||
    client.status === "Activo" ||
    client.status === "Registrado";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm">
      {/* Avatar + Name */}
      <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center border-b border-slate-100 dark:border-white/10">
        <div className="w-16 h-16 rounded-full bg-build-main/10 dark:bg-white/10 flex items-center justify-center mb-3 ring-2 ring-build-main/20 dark:ring-white/10">
          <span className="text-xl font-black text-build-main dark:text-white">{initials}</span>
        </div>
        <h3 className="text-base font-bold text-build-main dark:text-white leading-tight">
          {client.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5 truncate max-w-45">
          {client.email}
        </p>
        {client.phone && client.phone !== "—" && (
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{client.phone}</p>
        )}
      </div>

      {/* Info rows */}
      <div className="px-5 py-3.5 space-y-2 border-b border-slate-100 dark:border-white/10">
        <InfoRow icon="badge" label="DNI / CE" value={client.dni} />
        <InfoRow
          icon="calendar_today"
          label="Registro"
          value={
            client.createdAt
              ? new Date(client.createdAt).toLocaleDateString("es-PE", {
                  day: "numeric", month: "short", year: "numeric",
                })
              : "—"
          }
        />
        <InfoRow
          icon="circle"
          label="Estado"
          value={isActive ? "Activo" : client.status}
          valueClassName={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-white/40"}
        />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 border-b border-slate-100 dark:border-white/10">
        <div className="px-5 py-3 text-center border-r border-slate-100 dark:border-white/10">
          <p className="text-xl font-black text-build-main dark:text-white">{totalContratos}</p>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-white/40 mt-0.5">
            {totalContratos === 1 ? "Contrato" : "Contratos"}
          </p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="text-xl font-black text-build-main dark:text-white">{totalUnidades}</p>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-white/40 mt-0.5">
            {totalUnidades === 1 ? "Unidad" : "Unidades"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 space-y-2 border-b border-slate-100 dark:border-white/10">
        <button
          type="button"
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-build-main dark:text-white rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          <span>Editar información</span>
        </button>

        {onAssign && (
          <button
            type="button"
            onClick={onAssign}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-build-main text-white rounded-xl text-sm font-semibold hover:bg-build-main/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_home</span>
            <span>Asignar propiedad</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          disabled={hasActiveProperties}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-500 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={hasActiveProperties ? "No se puede eliminar un cliente con contratos activos" : "Eliminar cliente"}
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          <span>Eliminar cliente</span>
        </button>
      </div>

      {/* Quick links */}
      <div className="px-5 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-2.5">
          Accesos rápidos
        </p>
        <div className="space-y-1">
          <QuickLink
            href={`/finanzas?clienteId=${clientId}`}
            icon="payments"
            label="Pagos y cronogramas"
          />
          <QuickLink
            href={`/agenda?clienteId=${clientId}`}
            icon="calendar_month"
            label="Citas del cliente"
          />
          <QuickLink
            href={`/legal?clienteId=${clientId}`}
            icon="gavel"
            label="Gestión legal"
          />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  valueClassName,
}: Readonly<{ icon: string; label: string; value: string; valueClassName?: string }>) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-white/40 shrink-0">
        <span className="material-symbols-outlined text-[13px]">{icon}</span>
        <span>{label}</span>
      </div>
      <span className={`text-[11px] font-semibold text-slate-700 dark:text-white/80 truncate ${valueClassName ?? ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: Readonly<{ href: string; icon: string; label: string }>) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors group"
    >
      <span className="material-symbols-outlined text-[15px] text-arch-gold group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <span className="text-xs font-semibold">{label}</span>
      <span className="material-symbols-outlined text-[13px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        arrow_forward
      </span>
    </Link>
  );
}
