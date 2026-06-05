"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchUsuarios, fetchExpedientesPorUsuario } from "@/lib/api/users";
import { fetchContratoActivo } from "@/lib/api/expedientes";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import type { Usuario } from "@/types/user";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "resumen" | "proceso" | "documentos" | "saneamiento" | "auditoria";

type ProcesoEtapa = {
  id: string;
  label: string;
  icon: string;
  estado: "pendiente" | "en_proceso" | "observado" | "completado";
  responsable: string;
  fechaInicio?: string;
  fechaFin?: string;
  comentarios?: string;
};

type ClientExpedienteViewProps = {
  clientId: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "resumen",      label: "Resumen",      icon: "dashboard"    },
  { id: "proceso",      label: "Proceso Legal", icon: "account_tree" },
  { id: "documentos",   label: "Documentos",   icon: "folder_open"  },
  { id: "saneamiento",  label: "Saneamiento",  icon: "gavel"        },
  { id: "auditoria",    label: "Auditoría",    icon: "history"      },
];

const ESTADO_BADGE = {
  pendiente:   { label: "Pendiente",   cls: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"                },
  en_proceso:  { label: "En proceso",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"               },
  observado:   { label: "Observado",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"           },
  completado:  { label: "Completado",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"   },
};

const PROCESO_ETAPAS: ProcesoEtapa[] = [
  { id: "separacion", label: "Separación",      icon: "handshake",       estado: "completado", responsable: "Diego Salazar", fechaInicio: "2025-11-01", fechaFin: "2025-11-05" },
  { id: "contrato",   label: "Contrato",        icon: "description",     estado: "completado", responsable: "Diego Salazar", fechaInicio: "2025-11-10", fechaFin: "2025-12-02" },
  { id: "escritura",  label: "Escritura Pública", icon: "verified",      estado: "en_proceso", responsable: "María Torres",  fechaInicio: "2026-01-15", comentarios: "Minuta en revisión notarial." },
  { id: "entrega",    label: "Entrega",          icon: "key",             estado: "pendiente",  responsable: "—" },
  { id: "saneamiento",label: "Saneamiento",      icon: "domain_verified", estado: "pendiente",  responsable: "—" },
];

const DOCUMENTOS_SECCIONES = [
  {
    id: "separacion",
    label: "Separación",
    icon: "handshake",
    docs: ["Proforma", "Comprobante de separación", "Ficha del cliente"],
  },
  {
    id: "contrato",
    label: "Contrato",
    icon: "description",
    docs: ["Contrato de compraventa", "Adendas", "Carta bancaria"],
  },
  {
    id: "escritura",
    label: "Escritura",
    icon: "verified",
    docs: ["Minuta", "Escritura pública"],
  },
  {
    id: "entrega",
    label: "Entrega",
    icon: "key",
    docs: ["Acta de entrega", "Cargo de recepción"],
  },
];

const SANEAMIENTO_GRUPOS = [
  {
    id: "municipal",
    label: "Municipal",
    icon: "account_balance",
    items: ["Conformidad de obra", "Declaratoria de fábrica"],
  },
  {
    id: "independizacion",
    label: "Independización",
    icon: "splitscreen",
    items: ["Independización registral"],
  },
  {
    id: "reglamento",
    label: "Reglamento Interno",
    icon: "menu_book",
    items: ["Reglamento interno aprobado"],
  },
  {
    id: "sunarp",
    label: "SUNARP",
    icon: "domain_verification",
    items: ["Inscripción en Registros Públicos"],
  },
];

const AUDITORIA_MOCK = [
  { fecha: "11/05/2026", usuario: "Diego Salazar", accion: "Cambió estado de Contrato a Escritura Pública", tipo: "estado" },
  { fecha: "10/05/2026", usuario: "Diego Salazar", accion: "Subió minuta.pdf", tipo: "documento" },
  { fecha: "02/12/2025", usuario: "Diego Salazar", accion: "Subió contrato_compraventa_v2.pdf", tipo: "documento" },
  { fecha: "05/11/2025", usuario: "Diego Salazar", accion: "Creó el expediente legal", tipo: "creacion" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientExpedienteView({ clientId }: ClientExpedienteViewProps) {
  const [client,    setClient]    = useState<Usuario | null>(null);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [selectedExpediente, setSelectedExpediente] = useState<any | null>(null);
  const [contrato, setContrato] = useState<UsuarioActivoResponseDTO | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("resumen");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [users, exps] = await Promise.all([
          fetchUsuarios(),
          fetchExpedientesPorUsuario(clientId)
        ]);
        if (mounted) {
          setClient(users.find((u) => u.id === clientId) ?? null);
          setExpedientes(exps);
          if (exps.length > 0) setSelectedExpediente(exps[0]);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "No se pudo cargar el cliente.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [clientId]);

  useEffect(() => {
    if (selectedExpediente) {
      fetchContratoActivo(selectedExpediente.idActivo).then(setContrato).catch(console.error);
    } else {
      setContrato(null);
    }
  }, [selectedExpediente]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-slate-400 dark:text-white/40">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm font-medium">Cargando expediente...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
        {error}
      </div>
    );
  }

  const fullName = client ? [client.nombre, client.apellidos].filter(Boolean).join(" ") : "Cliente no encontrado";
  const initials = fullName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <section className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/legal"
          className="inline-flex items-center gap-1 text-sm font-semibold text-build-accent hover:text-build-main dark:hover:text-white mb-4 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a Gestión Legal
        </Link>
        <h2 className="text-2xl md:text-3xl font-bold text-build-main dark:text-white">
          Expediente Legal
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
          Proceso jurídico de la operación de compraventa.
        </p>
      </div>

      {expedientes.length > 0 ? (
        <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <label className="text-sm font-bold text-build-main dark:text-white whitespace-nowrap">Unidad:</label>
          <select 
            value={selectedExpediente?.idActivo || ""} 
            onChange={e => setSelectedExpediente(expedientes.find(x => x.idActivo === e.target.value))}
            className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-3 py-2 text-sm focus:outline-none dark:text-white"
          >
            {expedientes.map(exp => (
              <option key={exp.idActivo} value={exp.idActivo}>
                {exp.proyectoNombre} - {exp.torreNombre} - Piso {exp.pisoNum} - {exp.tipoUnidad} {exp.numUnidad}
              </option>
            ))}
          </select>
        </div>
      ) : (
         <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-400 text-sm font-semibold">
           Este cliente no tiene unidades asignadas en el sistema.
         </div>
      )}

      {/* Client summary card */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-build-main/10 dark:bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-build-main dark:text-white">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-build-main dark:text-white">{fullName}</h3>
            <p className="text-sm text-slate-500 dark:text-white/50 mt-0.5">{client?.email || "—"}</p>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <InfoChip icon="badge" label={client?.documentoIdentidad || "Sin DNI"} />
            <InfoChip icon="phone" label={client?.telefono || "Sin teléfono"} />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              <span className="material-symbols-outlined text-[13px]">pending</span>
              Minuta en revisión
            </span>
          </div>
        </div>

        {/* Alerta */}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 px-4 py-3">
          <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-[18px] mt-0.5 shrink-0">warning</span>
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">
            Carta bancaria vence en 5 días — revisar con el área financiera.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap
              border-b-2 transition-colors
              ${activeTab === tab.id
                ? "border-build-accent text-build-accent"
                : "border-transparent text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white"
              }
            `}
          >
            <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "resumen"     && <TabResumen     client={client} expediente={selectedExpediente} contrato={contrato} />}
        {activeTab === "proceso"     && <TabProceso     />}
        {activeTab === "documentos"  && <TabDocumentos  />}
        {activeTab === "saneamiento" && <TabSaneamiento />}
        {activeTab === "auditoria"   && <TabAuditoria   />}
      </div>
    </section>
  );
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────

function TabResumen({ client, expediente, contrato }: { client: Usuario | null, expediente: any, contrato: UsuarioActivoResponseDTO | null }) {
  const etapaActual = PROCESO_ETAPAS.find((e) => e.estado === "en_proceso") ?? PROCESO_ETAPAS[0];
  const completadas = PROCESO_ETAPAS.filter((e) => e.estado === "completado").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenKpi icon="person"         label="Cliente"           value={[client?.nombre, client?.apellidos].filter(Boolean).join(" ") || "—"} />
        <ResumenKpi icon="apartment"      label="Proyecto"          value={expediente?.proyectoNombre || "—"} />
        <ResumenKpi icon="meeting_room"   label="Unidad"            value={expediente ? `${expediente.tipoUnidad} ${expediente.numUnidad}` : "—"} />
        <ResumenKpi icon="attach_money"   label="Financiamiento"    value={contrato?.tipoFinanciamiento || "Pendiente"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Progreso del proceso */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-build-main dark:text-white mb-4">Progreso del proceso legal</h3>
          <div className="space-y-3">
            {PROCESO_ETAPAS.map((etapa) => {
              const badge = ESTADO_BADGE[etapa.estado];
              return (
                <div key={etapa.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${
                      etapa.estado === "completado" ? "text-emerald-500" :
                      etapa.estado === "en_proceso" ? "text-blue-500" : "text-slate-300 dark:text-white/20"
                    }`}>
                      {etapa.estado === "completado" ? "check_circle" : etapa.estado === "en_proceso" ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                    <span className={`text-sm font-semibold ${
                      etapa.estado === "pendiente" ? "text-slate-400 dark:text-white/30" : "text-build-main dark:text-white"
                    }`}>
                      {etapa.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className="h-1.5 rounded-full bg-build-accent"
                style={{ width: `${(completadas / PROCESO_ETAPAS.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1.5">
              {completadas} de {PROCESO_ETAPAS.length} etapas completadas
            </p>
          </div>
        </div>

        {/* Etapa actual + observaciones */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">Etapa actual</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-build-accent/10 dark:bg-build-accent/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-build-accent text-[20px]">{etapaActual.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-build-main dark:text-white">{etapaActual.label}</p>
                <p className="text-xs text-slate-400 dark:text-white/40">{etapaActual.comentarios || "En proceso"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">Última actualización</p>
            <p className="text-sm font-semibold text-build-main dark:text-white">11 de mayo, 2026</p>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">Por Diego Salazar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Proceso Legal ───────────────────────────────────────────────────────

function TabProceso() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-build-main dark:text-white mb-1">Proceso Legal</h3>
      <p className="text-xs text-slate-400 dark:text-white/40 mb-8">
        Estado de cada etapa jurídica de la operación.
      </p>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />
        <ol className="space-y-0">
          {PROCESO_ETAPAS.map((etapa, index) => {
            const badge = ESTADO_BADGE[etapa.estado];
            return (
              <li key={etapa.id} className="relative flex gap-6 pb-8 last:pb-0">
                {/* Node */}
                <div className="relative z-10 shrink-0">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${etapa.estado === "completado"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : etapa.estado === "en_proceso"
                      ? "bg-white dark:bg-[#111] border-build-accent text-build-accent"
                      : etapa.estado === "observado"
                      ? "bg-white dark:bg-[#111] border-amber-400 text-amber-400"
                      : "bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20"
                    }
                  `}>
                    <span className="material-symbols-outlined text-[18px]">{etapa.icon}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1.5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <p className={`text-sm font-bold ${
                      etapa.estado === "pendiente" ? "text-slate-400 dark:text-white/30" : "text-build-main dark:text-white"
                    }`}>
                      {etapa.label}
                    </p>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400 dark:text-white/40">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">person</span>
                      {etapa.responsable}
                    </span>
                    {etapa.fechaInicio && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                        {etapa.fechaInicio}
                      </span>
                    )}
                    {etapa.fechaFin && (
                      <span className="flex items-center gap-1 col-start-2">
                        <span className="material-symbols-outlined text-[13px]">event_available</span>
                        {etapa.fechaFin}
                      </span>
                    )}
                  </div>

                  {etapa.comentarios && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2 border border-slate-100 dark:border-white/10">
                      {etapa.comentarios}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// ─── Tab: Documentos ─────────────────────────────────────────────────────────

function TabDocumentos() {
  return (
    <div className="space-y-4">
      {DOCUMENTOS_SECCIONES.map((seccion) => (
        <div key={seccion.id} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
            <span className="material-symbols-outlined text-build-accent text-[20px]">{seccion.icon}</span>
            <h3 className="text-sm font-bold text-build-main dark:text-white">{seccion.label}</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {seccion.docs.map((doc) => (
              <div key={doc} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-300 dark:text-white/20 text-[18px]">description</span>
                  <span className="text-sm text-slate-600 dark:text-white/70">{doc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40">
                    Pendiente
                  </span>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-white/40">upload_file</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Saneamiento ────────────────────────────────────────────────────────

function TabSaneamiento() {
  return (
    <div className="space-y-4">
      {SANEAMIENTO_GRUPOS.map((grupo) => (
        <div key={grupo.id} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
            <span className="material-symbols-outlined text-build-accent text-[20px]">{grupo.icon}</span>
            <h3 className="text-sm font-bold text-build-main dark:text-white">{grupo.label}</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {grupo.items.map((item) => (
              <div key={item} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                <span className="text-sm text-slate-600 dark:text-white/70">{item}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-white/30">Responsable: —</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40">
                    Pendiente
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Auditoría ───────────────────────────────────────────────────────────

function TabAuditoria() {
  const TIPO_ICON: Record<string, { icon: string; cls: string }> = {
    estado:    { icon: "swap_horiz",  cls: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"      },
    documento: { icon: "upload_file", cls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    creacion:  { icon: "add_circle",  cls: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"        },
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
        <h3 className="text-sm font-bold text-build-main dark:text-white">Registro de actividad</h3>
        <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
          Trazabilidad completa de cambios y acciones sobre el expediente.
        </p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {AUDITORIA_MOCK.map((entry, i) => {
          const tipo = TIPO_ICON[entry.tipo] ?? TIPO_ICON.creacion;
          return (
            <div key={i} className="flex items-start gap-4 px-6 py-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tipo.cls}`}>
                <span className="material-symbols-outlined text-[16px]">{tipo.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-build-main dark:text-white">{entry.accion}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">person</span>
                    {entry.usuario}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                    {entry.fecha}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60">
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </span>
  );
}

function ResumenKpi({ icon, label, value }: { icon: string; label: string; value: string }) {
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