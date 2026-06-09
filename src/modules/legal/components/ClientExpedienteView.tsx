"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchUsuarios, fetchExpedientesPorUsuario } from "@/lib/api/users";
import { fetchContratoActivo, fetchCommercialStepper, createCommercialHito, updateCommercialHitoEstado } from "@/lib/api/expedientes";
import { fetchProyectos, fetchActivosPorProyecto, fetchTorresPorProyecto, fetchPisosPorTorre } from "@/lib/api/proyectos";
import type { UsuarioActivoResponseDTO, StepperResponseDTO } from "@/lib/api/expedientes";
import type { Usuario } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchStageDocuments,
  uploadRequisitoArchivo,
  deleteRequisitoArchivo,
  updateRequisito,
  createRequisito,
  type DocumentoItem
} from "@/lib/api/requisitos";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "resumen" | "proceso" | "documentos";

type ProcesoEtapa = {
  id: string;
  label: string;
  icon: string;
  estado: "pendiente" | "en_proceso" | "observado" | "completado";
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
];

const ESTADO_BADGE = {
  pendiente:   { label: "Pendiente",   cls: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"                },
  en_proceso:  { label: "En proceso",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"               },
  observado:   { label: "Observado",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"           },
  completado:  { label: "Completado",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"   },
};

const PROCESO_ETAPAS: ProcesoEtapa[] = [
  { id: "separacion", label: "Separación",      icon: "handshake",       estado: "pendiente" },
  { id: "contrato",   label: "Contrato",        icon: "description",     estado: "pendiente" },
  { id: "entrega",    label: "Entrega",          icon: "key",             estado: "pendiente" },
  { id: "saneamiento",label: "Saneamiento",      icon: "domain_verified", estado: "pendiente" },
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
  {
    id: "saneamiento",
    label: "Saneamiento",
    icon: "gavel",
    docs: [
      "Conformidad de obra",
      "Declaratoria de fábrica",
      "Independización registral",
      "Reglamento interno aprobado",
      "Inscripción en Registros Públicos"
    ],
  }
];

const SANEAMIENTO_GRUPOS: any[] = [];

const AUDITORIA_MOCK = [
  { fecha: "11/05/2026", usuario: "Diego Salazar", accion: "Cambió estado de Contrato a Escritura Pública", tipo: "estado" },
  { fecha: "10/05/2026", usuario: "Diego Salazar", accion: "Subió minuta.pdf", tipo: "documento" },
  { fecha: "02/12/2025", usuario: "Diego Salazar", accion: "Subió contrato_compraventa_v2.pdf", tipo: "documento" },
  { fecha: "05/11/2025", usuario: "Diego Salazar", accion: "Creó el expediente legal", tipo: "creacion" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientExpedienteView({ clientId }: ClientExpedienteViewProps) {
  const { perfil } = useAuth();
  const [client,    setClient]    = useState<Usuario | null>(null);
  const [expedientes, setExpedientes] = useState<UsuarioActivoResponseDTO[]>([]);
  const [selectedExpediente, setSelectedExpediente] = useState<UsuarioActivoResponseDTO | null>(null);
  const [contrato, setContrato] = useState<UsuarioActivoResponseDTO | null>(null);

  const [stepper, setStepper] = useState<StepperResponseDTO | null>(null);
  const [loadingStepper, setLoadingStepper] = useState(false);
  const [updateError, setUpdateError] = useState("");

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
    if (selectedExpediente?.activo?.id) {
      fetchContratoActivo(selectedExpediente.activo.id).then(setContrato).catch(console.error);
    } else {
      setContrato(null);
    }
  }, [selectedExpediente]);

  // Fetch / Seed commercial milestones (Hitos Comerciales)
  useEffect(() => {
    if (!contrato?.uuidUsuarioActivo) {
      setStepper(null);
      return;
    }

    let cancelled = false;
    setLoadingStepper(true);
    setUpdateError("");

    fetchCommercialStepper(contrato.uuidUsuarioActivo)
      .then(async (data) => {
        if (cancelled) return;

        const totalHitosCount = data.etapas?.reduce((acc, e) => acc + (e.hitos?.length || 0), 0) || 0;

        if (totalHitosCount === 0) {
          // Seed default hitos
          try {
            const defaultHitos = [
              { etapaProceso: "SEPARACION" as const, nombreHito: "Separación", orden: 1, descripcion: "Comprobante de separación y ficha de cliente completada." },
              { etapaProceso: "CONTRATO" as const,   nombreHito: "Contrato",   orden: 2, descripcion: "Minuta firmada y contrato visado." },
              { etapaProceso: "PAGO" as const,       nombreHito: "Escritura Pública", orden: 3, descripcion: "Firma de escritura notarial y financiamiento." },
              { etapaProceso: "ENTREGA" as const,    nombreHito: "Entrega",    orden: 4, descripcion: "Entrega física de llaves y conformidad." },
              { etapaProceso: "SANEAMIENTO" as const,nombreHito: "Saneamiento",orden: 5, descripcion: "Inscripción en registros públicos (SUNARP)." },
            ];
            await Promise.all(
              defaultHitos.map(h => createCommercialHito({
                uuidUsuarioActivo: contrato.uuidUsuarioActivo,
                etapaProceso: h.etapaProceso,
                nombreHito: h.nombreHito,
                descripcion: h.descripcion,
                orden: h.orden
              }))
            );
            const freshData = await fetchCommercialStepper(contrato.uuidUsuarioActivo);
            if (!cancelled) setStepper(freshData);
          } catch (err) {
            console.error("Error seeding commercial hitos:", err);
            if (!cancelled) setStepper(data);
          }
        } else {
          setStepper(data);
        }
      })
      .catch((err) => {
        console.error("Error loading stepper:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingStepper(false);
      });

    return () => { cancelled = true; };
  }, [contrato]);

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

  // Map backend stepper stages to UI format
  const mappedEtapas = stepper?.etapas
    ?.filter(et => et.etapa !== "PAGO")
    ?.map(et => {
    const mainHito = et.hitos?.[0]; // Seeding puts exactly 1 hito per stage
    const label = et.etapa === "SEPARACION" ? "Separación"
                : et.etapa === "CONTRATO" ? "Contrato"
                : et.etapa === "PAGO" ? "Escritura Pública"
                : et.etapa === "ENTREGA" ? "Entrega"
                : "Saneamiento";
    const icon = et.etapa === "SEPARACION" ? "handshake"
               : et.etapa === "CONTRATO" ? "description"
               : et.etapa === "PAGO" ? "verified"
               : et.etapa === "ENTREGA" ? "key"
               : "domain_verified";

    let estado: "pendiente" | "en_proceso" | "completado" = "pendiente";
    if (et.porcentajeAvance === 100) {
      estado = "completado";
    } else if (et.porcentajeAvance > 0 || mainHito?.estado === "EN_PROGRESO") {
      estado = "en_proceso";
    }

    return {
      id: et.etapa,
      label,
      icon,
      estado,
      fechaInicio: mainHito?.createdAt ? new Date(mainHito.createdAt).toLocaleDateString("es-PE") : undefined,
      fechaFin: mainHito?.fechaCompletado ? new Date(mainHito.fechaCompletado).toLocaleDateString("es-PE") : undefined,
      comentarios: mainHito?.descripcion || "",
      uuidHito: mainHito?.uuidHitoComercial
    };
  }) || [];

  const displayEtapas = mappedEtapas.length > 0 ? mappedEtapas : PROCESO_ETAPAS;
  
  const isAdmin = perfil?.rol === "ADMIN";
  const canEditHitos = !!(isAdmin || perfil?.funciones?.includes("CONTRATO_EDITAR"));
  const canUploadDocs = !!(isAdmin || perfil?.funciones?.includes("DOCS_SUBIR"));
  const canEditNotes = !!(isAdmin || perfil?.funciones?.includes("CONTRATO_VER"));

  async function handleUpdateHito(uuidHito: string, nuevoEstado: string) {
    setUpdateError("");
    try {
      await updateCommercialHitoEstado(uuidHito, nuevoEstado);
      if (contrato?.uuidUsuarioActivo) {
        const freshData = await fetchCommercialStepper(contrato.uuidUsuarioActivo);
        setStepper(freshData);
      }
    } catch (err) {
      console.error("Error updating hito:", err);
      setUpdateError(err instanceof Error ? err.message : "Error al actualizar el estado del hito.");
    }
  }

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
            value={selectedExpediente?.activo?.id || ""} 
            onChange={e => setSelectedExpediente(expedientes.find(x => x.activo?.id === e.target.value) || null)}
            className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-3 py-2 text-sm focus:outline-none dark:text-white"
          >
            {expedientes.map(exp => (
              <option key={exp.activo?.id} value={exp.activo?.id}>
                {exp.activo?.proyectoNombre} - {exp.activo?.torreNombre} - Piso {exp.activo?.nroPiso} - {exp.activo?.tipo} {exp.activo?.nro}
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
            {selectedExpediente?.estadoTramiteLegal && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <span className="material-symbols-outlined text-[13px]">pending</span>
                {selectedExpediente.estadoTramiteLegal}
              </span>
            )}
          </div>
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

      {/* Warning/Error messages for state updates */}
      {updateError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-400 animate-pulse">
          {updateError}
        </div>
      )}

      {/* Tab content */}
      <div>
        {activeTab === "resumen"     && <TabResumen     client={client} expediente={selectedExpediente} contrato={contrato} displayEtapas={displayEtapas} loadingStepper={loadingStepper} />}
        {activeTab === "proceso"     && <TabProceso     displayEtapas={displayEtapas} loadingStepper={loadingStepper} canEdit={canEditHitos} onUpdateHito={handleUpdateHito} />}
        {activeTab === "documentos"  && <TabDocumentos  contrato={contrato} canUploadDocs={canUploadDocs} canEditNotes={canEditNotes} />}
      </div>
    </section>
  );
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────

function TabResumen({
  client,
  expediente,
  contrato,
  displayEtapas,
  loadingStepper,
}: {
  client: Usuario | null;
  expediente: any;
  contrato: UsuarioActivoResponseDTO | null;
  displayEtapas: any[];
  loadingStepper: boolean;
}) {
  const etapaActual = displayEtapas.find((e) => e.estado === "en_proceso") ?? displayEtapas.find((e) => e.estado === "pendiente") ?? displayEtapas[0];
  const completadas = displayEtapas.filter((e) => e.estado === "completado").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenKpi icon="person"         label="Cliente"           value={[client?.nombre, client?.apellidos].filter(Boolean).join(" ") || "—"} />
        <ResumenKpi icon="apartment"      label="Proyecto"          value={expediente?.activo?.proyectoNombre || "—"} />
        <ResumenKpi icon="meeting_room"   label="Unidad"            value={expediente?.activo ? `${expediente.activo.tipo} ${expediente.activo.nro}` : "—"} />
        <ResumenKpi icon="attach_money"   label="Financiamiento"    value={contrato?.tipoFinanciamiento || "Pendiente"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Progreso del proceso */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-build-main dark:text-white mb-4">Progreso del proceso legal</h3>
          <div className="space-y-3">
            {displayEtapas.map((etapa) => {
              const badge = ESTADO_BADGE[etapa.estado as keyof typeof ESTADO_BADGE] || ESTADO_BADGE.pendiente;
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
                style={{ width: `${(completadas / displayEtapas.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1.5">
              {completadas} de {displayEtapas.length} etapas completadas
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
            {etapaActual.fechaFin || etapaActual.fechaInicio ? (
              <p className="text-sm font-semibold text-build-main dark:text-white">{etapaActual.fechaFin || etapaActual.fechaInicio}</p>
            ) : (
              <p className="text-sm font-semibold text-build-main dark:text-white">11 de mayo, 2026</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Proceso Legal ───────────────────────────────────────────────────────

function TabProceso({
  displayEtapas,
  loadingStepper,
  canEdit,
  onUpdateHito,
}: {
  displayEtapas: any[];
  loadingStepper: boolean;
  canEdit: boolean;
  onUpdateHito: (uuidHito: string, nuevoEstado: string) => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-build-main dark:text-white mb-1">Proceso Legal</h3>
      <p className="text-xs text-slate-400 dark:text-white/40 mb-8">
        Estado de cada etapa jurídica de la operación.
      </p>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />
        <ol className="space-y-0">
          {displayEtapas.map((etapa) => {
            const badge = ESTADO_BADGE[etapa.estado as keyof typeof ESTADO_BADGE] || ESTADO_BADGE.pendiente;
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
                    {canEdit && etapa.uuidHito ? (
                      <select
                        value={etapa.estado === "completado" ? "COMPLETADO" : etapa.estado === "en_proceso" ? "EN_PROGRESO" : "PENDIENTE"}
                        disabled={loadingStepper}
                        onChange={(e) => onUpdateHito(etapa.uuidHito, e.target.value)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-build-accent/50 focus:outline-none transition-all ${badge.cls} ${loadingStepper ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <option value="PENDIENTE" className="bg-white dark:bg-[#111] text-slate-700 dark:text-white">Pendiente</option>
                        <option value="EN_PROGRESO" className="bg-white dark:bg-[#111] text-slate-700 dark:text-white">En proceso</option>
                        <option value="COMPLETADO" className="bg-white dark:bg-[#111] text-slate-700 dark:text-white">Completado</option>
                      </select>
                    ) : (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400 dark:text-white/40">
                    {etapa.fechaInicio && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                        {etapa.fechaInicio}
                      </span>
                    )}
                    {etapa.fechaFin && (
                      <span className="flex items-center gap-1">
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

type TabDocumentosProps = {
  contrato: UsuarioActivoResponseDTO | null;
  canUploadDocs: boolean;
  canEditNotes: boolean;
};

interface StageSection {
  id: "SEPARACION" | "CONTRATO" | "ENTREGA" | "SANEAMIENTO";
  label: string;
  icon: string;
  docs: DocumentoItem[];
}

const PREDEFINED_REQUISITOS = {
  SEPARACION: [
    {
      titulo: "Proforma",
      descripcion: "Documento que detalla las condiciones preliminares de la compra: precio, forma de pago y características de la unidad.",
      icono: "receipt_long"
    },
    {
      titulo: "Comprobante de separación",
      descripcion: "Recibo o boleta que acredita que el cliente pagó el monto de separación de la unidad.",
      icono: "payments"
    },
    {
      titulo: "Ficha del cliente",
      descripcion: "Registro con los datos personales del comprador: nombre completo, DNI, teléfono, correo y datos del bien adquirido.",
      icono: "person_check"
    },
    {
      titulo: "Recibo de Inicial",
      descripcion: "Documento que acredita el pago de la cuota inicial acordada para la compra del inmueble.",
      icono: "receipt"
    }
  ],
  CONTRATO: [
    {
      titulo: "Contrato de compraventa (CV)",
      descripcion: "Documento legal que formaliza la compra de la unidad inmobiliaria entre el cliente y Llosa Edificaciones.",
      icono: "gavel"
    },
    {
      titulo: "Carta de aprobación del banco",
      descripcion: "Documento emitido por el banco que confirma que aprobó el crédito hipotecario del cliente, con el monto y condiciones. Solo aplica a crédito hipotecario.",
      icono: "account_balance"
    },
    {
      titulo: "Adenda (Opcional)",
      descripcion: "Documento que modifica o amplía el contrato original ya firmado. Puede cambiar montos, fechas u otras condiciones pactadas. Su inclusión es opcional.",
      icono: "note_add"
    },
    {
      titulo: "Cronograma de Pagos",
      descripcion: "Documento que establece el plan de pagos detallado, incluyendo fechas de vencimiento, montos y conceptos de cada cuota asociada al contrato.",
      icono: "payments"
    }
  ],
  ENTREGA: [
    {
      titulo: "Planos \"As Built\"",
      descripcion: "Planos finales del departamento tal como quedó construido, con arquitectura, estructuras, sanitarias, eléctricas, mecánicas y de gas.",
      icono: "architecture"
    },
    {
      titulo: "Acta de entrega",
      descripcion: "Documento firmado por el cliente y Llosa que certifica la entrega de la unidad en la fecha pactada y en condiciones acordadas.",
      icono: "done_all"
    },
    {
      titulo: "Manual del propietario",
      descripcion: "Guía completa sobre el funcionamiento, mantenimiento y uso correcto de la unidad y sus instalaciones.",
      icono: "book"
    },
    {
      titulo: "Manual de convivencia",
      descripcion: "Reglamento interno del edificio con normas de uso de áreas comunes, horarios, restricciones y obligaciones de los residentes.",
      icono: "groups"
    }
  ],
  SANEAMIENTO: [
    {
      titulo: "Conformidad de obra",
      descripcion: "Resolución municipal que certifica que la construcción del edificio fue realizada conforme a los planos y licencias aprobadas.",
      icono: "verified"
    },
    {
      titulo: "Declaratoria de fábrica",
      descripcion: "Documento legal que inscribe en SUNARP la edificación construida sobre el terreno, con sus características técnicas.",
      icono: "gavel"
    },
    {
      titulo: "Reglamento interno",
      descripcion: "Documento que establece la división de áreas comunes y privadas del edificio, y las normas de convivencia entre propietarios.",
      icono: "description"
    },
    {
      titulo: "Partida registral del inmueble independizado",
      descripcion: "Documento oficial emitido por SUNARP que acredita que la unidad está inscrita como propiedad independiente a nombre del cliente.",
      icono: "fingerprint"
    }
  ]
};

const seedingInProgress: Record<string, Promise<any> | undefined> = {};

function TabDocumentos({ contrato, canUploadDocs, canEditNotes }: TabDocumentosProps) {
  const [sections, setSections] = useState<StageSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // States for inline editing of corporate notes
  const [editingNotaId, setEditingNotaId] = useState<string | null>(null);
  const [editingNotaText, setEditingNotaText] = useState("");
  const [savingNotaId, setSavingNotaId] = useState<string | null>(null);

  const loadAllStageDocs = async () => {
    if (!contrato?.uuidUsuarioActivo) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current stepper to get hitos UUIDs
      let finalStepper = await fetchCommercialStepper(contrato.uuidUsuarioActivo);

      // 2. Ensure each of the 5 stages has at least one commercial hito (backend consistency)
      let neededRefetch = false;
      const DEFAULT_HITOS_INFO = {
        SEPARACION: { nombreHito: "Separación", orden: 1, descripcion: "Comprobante de separación y ficha de cliente completada." },
        CONTRATO: { nombreHito: "Contrato", orden: 2, descripcion: "Minuta firmada y contrato visado." },
        PAGO: { nombreHito: "Escritura Pública", orden: 3, descripcion: "Firma de escritura notarial y financiamiento." },
        ENTREGA: { nombreHito: "Entrega", orden: 4, descripcion: "Entrega física de llaves y conformidad." },
        SANEAMIENTO: { nombreHito: "Saneamiento", orden: 5, descripcion: "Inscripción en registros públicos (SUNARP)." }
      };

      for (const st of ["SEPARACION", "CONTRATO", "PAGO", "ENTREGA", "SANEAMIENTO"] as const) {
        const stageEtapa = finalStepper.etapas?.find(e => e.etapa === st);
        if (!stageEtapa || !stageEtapa.hitos || stageEtapa.hitos.length === 0) {
          const info = DEFAULT_HITOS_INFO[st];
          await createCommercialHito({
            uuidUsuarioActivo: contrato.uuidUsuarioActivo,
            etapaProceso: st,
            nombreHito: info.nombreHito,
            descripcion: info.descripcion,
            orden: info.orden
          });
          neededRefetch = true;
        }
      }

      if (neededRefetch) {
        finalStepper = await fetchCommercialStepper(contrato.uuidUsuarioActivo);
      }

      // 3. Define the 4 stages we actually display
      const stages: Array<{ id: "SEPARACION" | "CONTRATO" | "ENTREGA" | "SANEAMIENTO"; label: string; icon: string }> = [
        { id: "SEPARACION", label: "Separación", icon: "handshake" },
        { id: "CONTRATO", label: "Contrato", icon: "description" },
        { id: "ENTREGA", label: "Entrega", icon: "key" },
        { id: "SANEAMIENTO", label: "Saneamiento", icon: "domain_verified" },
      ];

      const results = await Promise.all(
        stages.map(async (st) => {
          try {
            let res = await fetchStageDocuments(st.id, contrato.uuidUsuarioActivo);

            // Check which predefined requirements are missing
            const predefs = PREDEFINED_REQUISITOS[st.id];
            const missing = predefs.filter(p => 
              !res.documents?.some(doc => doc.title.toLowerCase().trim() === p.titulo.toLowerCase().trim())
            );

            if (missing.length > 0) {
              const lockKey = `${contrato.uuidUsuarioActivo}_${st.id}`;
              if (seedingInProgress[lockKey]) {
                // Wait for the active seeding process to finish
                await seedingInProgress[lockKey];
                // Fetch again
                res = await fetchStageDocuments(st.id, contrato.uuidUsuarioActivo);
              } else {
                const stageEtapa = finalStepper.etapas?.find(e => e.etapa === st.id);
                const hitoId = stageEtapa?.hitos?.[0]?.uuidHitoComercial;

                if (hitoId) {
                  // Create the seeding promise
                  const seedPromise = (async () => {
                    for (const req of missing) {
                      await createRequisito({
                        hitoProcesoCompraId: hitoId,
                        titulo: req.titulo,
                        descripcion: req.descripcion,
                        icono: req.icono
                      });
                    }
                  })();
                  seedingInProgress[lockKey] = seedPromise;
                  await seedPromise;
                  delete seedingInProgress[lockKey];
                  // Fetch again
                  res = await fetchStageDocuments(st.id, contrato.uuidUsuarioActivo);
                }
              }
            }

            // Deduplicate docs locally in the UI to prevent showing pre-existing duplicated database records
            const uniqueDocs: DocumentoItem[] = [];
            const seenTitles = new Set<string>();
            for (const doc of res.documents || []) {
              const norm = doc.title.toLowerCase().trim();
              if (!seenTitles.has(norm)) {
                seenTitles.add(norm);
                uniqueDocs.push(doc);
              }
            }

            return {
              ...st,
              docs: uniqueDocs,
            };
          } catch (err) {
            console.error(`Error loading docs for stage ${st.id}:`, err);
            return {
              ...st,
              docs: [],
            };
          }
        })
      );
      setSections(results);
    } catch (err) {
      console.error("Error loading stage documents:", err);
      setError(err instanceof Error ? err.message : "Error al cargar documentos del expediente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllStageDocs();
  }, [contrato?.uuidUsuarioActivo]);

  const handleUploadClick = (requisitoId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await handleUpload(requisitoId, file);
    };
    input.click();
  };

  const handleUpload = async (requisitoId: string, file: File) => {
    setUploadingDoc(requisitoId);
    setError(null);
    try {
      await uploadRequisitoArchivo(requisitoId, file);
      await loadAllStageDocs();
    } catch (err) {
      console.error("Error uploading document:", err);
      setError(err instanceof Error ? err.message : "Error al subir el documento.");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDownload = (downloadUrl: string | null) => {
    if (!downloadUrl) {
      alert("El enlace de descarga no está disponible.");
      return;
    }
    window.open(downloadUrl, "_blank");
  };

  const handleDelete = async (requisitoId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento?")) return;
    setError(null);
    try {
      await deleteRequisitoArchivo(requisitoId);
      await loadAllStageDocs();
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar el documento.");
    }
  };

  const handleEditNotaStart = (doc: DocumentoItem) => {
    setEditingNotaId(doc.id);
    setEditingNotaText(doc.notaCorporativa || "");
  };

  const handleSaveNota = async (doc: DocumentoItem) => {
    setSavingNotaId(doc.id);
    setError(null);
    try {
      await updateRequisito(doc.id, {
        titulo: doc.title,
        notaCorporativa: editingNotaText.trim(),
      });
      setEditingNotaId(null);
      await loadAllStageDocs();
    } catch (err) {
      console.error("Error saving note:", err);
      setError(err instanceof Error ? err.message : "Error al guardar la nota corporativa.");
    } finally {
      setSavingNotaId(null);
    }
  };

  if (!contrato) {
    return (
      <div className="text-center py-12 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
        <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-white/20 mb-2">folder_open</span>
        <p className="text-sm font-semibold text-slate-500 dark:text-white/40">Selecciona una unidad para ver y gestionar sus documentos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && sections.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin w-5 h-5 text-build-accent mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-slate-500 dark:text-white/40 font-medium">Cargando documentos y requisitos...</span>
        </div>
      ) : (
        sections.map((seccion) => (
          <div key={seccion.id} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
              <span className="material-symbols-outlined text-build-accent text-[20px]">{seccion.icon}</span>
              <h3 className="text-sm font-bold text-build-main dark:text-white">{seccion.label}</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {seccion.docs.length === 0 ? (
                <div className="px-5 py-4 text-xs text-slate-400 dark:text-white/30 text-center">
                  No se han configurado requisitos para esta etapa.
                </div>
              ) : (
                seccion.docs.map((doc) => {
                  const isCompleted = doc.status?.toLowerCase() === "completada";
                  const isUploading = uploadingDoc === doc.id;
                  const isEditingNota = editingNotaId === doc.id;
                  const isSavingNota = savingNotaId === doc.id;

                  return (
                    <div key={doc.id} className="flex flex-col px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors gap-3 group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${isCompleted ? "text-emerald-500" : "text-slate-300 dark:text-white/20"}`}>
                            {isCompleted ? "verified" : "description"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{doc.title}</p>
                            {doc.description && (
                              <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                                {doc.description}
                              </p>
                            )}
                            {doc.emissionDate && (
                              <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">
                                Completado el: {doc.emissionDate}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          {isCompleted ? (
                            <>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Completado
                              </span>
                              {doc.hasDownload && doc.downloadUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleDownload(doc.downloadUrl)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors"
                                  title="Descargar / Ver archivo"
                                >
                                  <span className="material-symbols-outlined text-[18px]">download</span>
                                </button>
                              )}
                              {canUploadDocs && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(doc.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 transition-colors"
                                  title="Eliminar archivo"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40">
                                Pendiente
                              </span>
                              {canUploadDocs && (
                                <button
                                  type="button"
                                  disabled={isUploading}
                                  onClick={() => handleUploadClick(doc.id)}
                                  className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title="Subir archivo"
                                >
                                  {isUploading ? (
                                    <svg className="animate-spin w-4.5 h-4.5 text-build-accent" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                  ) : (
                                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Nota Corporativa / Comentarios de Auditoria */}
                      <div className="mt-1 pl-8 border-l border-slate-100 dark:border-white/5 space-y-2">
                        {isEditingNota ? (
                          <div className="flex gap-2 items-center w-full max-w-2xl">
                            <input
                              type="text"
                              value={editingNotaText}
                              onChange={(e) => setEditingNotaText(e.target.value)}
                              placeholder="Escribe una nota interna..."
                              disabled={isSavingNota}
                              className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-3 py-1.5 text-xs focus:outline-none dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNota(doc)}
                              disabled={isSavingNota}
                              className="px-3 py-1.5 bg-build-main text-white rounded-lg text-[10px] font-bold hover:bg-build-main/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {isSavingNota && (
                                <svg className="animate-spin w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                              )}
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNotaId(null)}
                              disabled={isSavingNota}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 rounded-lg text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              {doc.notaCorporativa ? (
                                <div className="text-xs text-slate-500 dark:text-white/50 leading-relaxed italic bg-slate-50 dark:bg-white/[0.02] rounded-lg px-3 py-2 border border-slate-100 dark:border-white/5">
                                  <span className="font-bold not-italic text-slate-600 dark:text-white/60 block text-[10px] uppercase tracking-wider mb-1">Nota Corporativa:</span>
                                  {doc.notaCorporativa}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 dark:text-white/30 italic">Sin notas corporativas.</p>
                              )}
                            </div>
                            {canEditNotes && (
                              <button
                                type="button"
                                onClick={() => handleEditNotaStart(doc)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-build-accent hover:text-build-main dark:hover:text-white transition-colors"
                              >
                                <span className="material-symbols-outlined text-[13px]">edit_note</span>
                                {doc.notaCorporativa ? "Editar Nota" : "Agregar Nota"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))
      )}
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