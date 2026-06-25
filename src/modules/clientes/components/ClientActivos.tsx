"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchExpedientesPorUsuario,
  type UsuarioActivoResponseDTO,
} from "@/lib/api/expedientes";
import { fetchProyectos, type ActivoResponseDTO, type Proyecto } from "@/lib/api/proyectos";
import UnlinkPropertyModal, { type UnlinkAssignmentInfo } from "./UnlinkPropertyModal";

type ClientActivosProps = {
  readonly clientId: number;
  readonly refreshKey?: number;
  readonly onUnlinked?: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUnitIcon(tipo: string): string {
  if (tipo === "ESTACIONAMIENTO") return "directions_car";
  if (tipo === "DEPOSITO") return "inventory_2";
  return "apartment";
}

function getUnitLabel(tipo: string): string {
  if (tipo === "ESTACIONAMIENTO") return "Cochera";
  if (tipo === "DEPOSITO") return "Depósito";
  if (tipo === "DEPARTAMENTO") return "Departamento";
  return tipo;
}

function getEstadoBadge(estado: string): { bg: string; text: string; label: string } {
  switch (estado) {
    case "SEPARADO":
      return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Separado" };
    case "VENDIDO":
      return { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Vendido" };
    case "DISPONIBLE":
      return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Disponible" };
    case "RESERVADO":
      return { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "Reservado" };
    default:
      return { bg: "bg-slate-100 dark:bg-white/10", text: "text-slate-600 dark:text-white/60", label: estado };
  }
}

function getFinanciamientoLabel(tipo: string): string {
  if (tipo === "CREDITO_HIPOTECARIO") return "Crédito hipotecario";
  if (tipo === "AL_CONTADO") return "Al contado";
  if (tipo === "FINANCIAMIENTO_DIRECTO") return "Financiamiento directo";
  return tipo ?? "—";
}

function getEtapaLabel(etapa: string | undefined): { label: string; cls: string } {
  switch (etapa) {
    case "SEPARACION":  return { label: "Separación",   cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" };
    case "CONTRATO":    return { label: "Contrato",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
    case "PAGO":        return { label: "Pagos",        cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };
    case "ENTREGA":     return { label: "Entrega",      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" };
    case "SANEAMIENTO": return { label: "Saneamiento",  cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" };
    default:            return { label: etapa ?? "—",   cls: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/50" };
  }
}

function formatPrice(precio: number): string {
  return `S/ ${precio.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientActivos({ clientId, refreshKey = 0, onUnlinked }: Readonly<ClientActivosProps>) {
  const router = useRouter();
  const [contratos, setContratos] = useState<UsuarioActivoResponseDTO[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingLegal, setLoadingLegal] = useState<Record<string, boolean>>({});

  const [selectedAssignment, setSelectedAssignment] = useState<UnlinkAssignmentInfo | null>(null);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);

  // Carga contratos (expedientes) que ya traen activos[]
  useEffect(() => {
    let mounted = true;

    async function loadContratos() {
      setLoading(true);
      setError(null);
      try {
        const [contratosData, proyectosData] = await Promise.all([
          fetchExpedientesPorUsuario(clientId),
          fetchProyectos().catch(() => [] as Proyecto[]),
        ]);
        if (!mounted) return;
        setContratos(contratosData ?? []);
        setProyectos(proyectosData ?? []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar los contratos.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadContratos();
    return () => { mounted = false; };
  }, [clientId, refreshKey]);

  function handleCancelContrato(contrato: UsuarioActivoResponseDTO) {
    const activos = contrato.activos;
    const primeraUnidad = activos[0];
    const proyectoNombre = primeraUnidad?.proyectoNombre ?? "Proyecto";

    const resumen = activos
      .map((a) => `${getUnitLabel(a.tipo)} ${a.nro}`)
      .join(", ");

    setSelectedAssignment({
      uuidUsuarioActivo: contrato.uuidUsuarioActivo,
      projectName: proyectoNombre,
      unitId: contrato.uuidUsuarioActivo,
      unitLabel: resumen,
    });
    setUnlinkModalOpen(true);
  }

  function handleVerExpediente(uuidContrato: string) {
    setLoadingLegal((prev) => ({ ...prev, [uuidContrato]: true }));
    router.push(`/legal/${uuidContrato}`);
  }

  // Separar activos vs cancelados
  // Un contrato está cancelado si vigente===false O si no tiene unidades (backend lo deja así tras cancelar)
  const contratosActivos = contratos.filter(
    (c) => c.vigente !== false && (c.activos?.length ?? 0) > 0
  );
  const contratosCancelados = contratos.filter(
    (c) => c.vigente === false || (c.activos?.length ?? 0) === 0
  );

  const totalUnidades = contratosActivos.reduce(
    (sum, c) => sum + (c.activos?.length ?? 0),
    0
  );

  return (
    <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
        <h3 className="text-sm font-bold text-build-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-arch-gold text-[18px]">domain</span>
          <span>Propiedades del cliente</span>
        </h3>
        {!loading && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              {contratosActivos.length} {contratosActivos.length === 1 ? "contrato activo" : "contratos activos"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
              {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}
            </span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400 dark:text-white/40">
          <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm font-medium">Cargando contratos...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="m-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Empty — ningún contrato en absoluto */}
      {!loading && !error && contratos.length === 0 && (
        <div className="m-4 text-center py-10 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
          <span className="material-symbols-outlined text-[40px] text-slate-200 dark:text-white/10 mb-2">home_work</span>
          <p className="text-sm font-semibold text-slate-400 dark:text-white/40">Sin contratos vinculados</p>
          <p className="text-xs text-slate-300 dark:text-white/25 mt-1">Usa el wizard de asignación para vincular propiedades.</p>
        </div>
      )}

      {/* Empty — solo contratos cancelados */}
      {!loading && !error && contratos.length > 0 && contratosActivos.length === 0 && (
        <div className="m-4 text-center py-8 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
          <span className="material-symbols-outlined text-[36px] text-slate-200 dark:text-white/10 mb-2">home_work</span>
          <p className="text-sm font-semibold text-slate-400 dark:text-white/40">Sin contratos activos</p>
          <p className="text-xs text-slate-300 dark:text-white/25 mt-1">Todos los contratos de este cliente han sido cancelados.</p>
        </div>
      )}

      {/* ── Contratos ACTIVOS ── */}
      {!loading && !error && contratosActivos.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {contratosActivos.map((contrato, idx) => {
            const activos = contrato.activos ?? [];
            const etapa = getEtapaLabel(contrato.estadoTramiteLegal);
            const financiamiento = getFinanciamientoLabel(contrato.tipoFinanciamiento);
            const contratoNum = String(idx + 1).padStart(2, "0");

            return (
              <ContratoCard
                key={contrato.uuidUsuarioActivo}
                activos={activos}
                contratoNum={contratoNum}
                etapa={etapa}
                financiamiento={financiamiento}
                proyectos={proyectos}
                loadingLegal={!!loadingLegal[contrato.uuidUsuarioActivo]}
                cancelado={false}
                onVerExpediente={() => handleVerExpediente(contrato.uuidUsuarioActivo)}
                onCancelar={() => handleCancelContrato(contrato)}
              />
            );
          })}
        </div>
      )}

      {/* ── Historial de contratos cancelados ── */}
      {!loading && !error && contratosCancelados.length > 0 && (
        <ContratosHistorial
          contratos={contratosCancelados}
          loadingLegal={loadingLegal}
          onVerExpediente={handleVerExpediente}
        />
      )}

      {/* Modal cancelar contrato */}
      {unlinkModalOpen && selectedAssignment && (
        <UnlinkPropertyModal
          open={unlinkModalOpen}
          assignment={selectedAssignment}
          onClose={() => { setUnlinkModalOpen(false); setSelectedAssignment(null); }}
          onUnlinked={() => {
            setUnlinkModalOpen(false);
            setSelectedAssignment(null);
            onUnlinked?.();
          }}
        />
      )}
    </section>
  );
}

// ─── ContratoCard ─────────────────────────────────────────────────────────────

type ContratoCardProps = {
  activos: ActivoResponseDTO[];
  contratoNum: string;
  etapa: { label: string; cls: string };
  financiamiento: string;
  proyectos: Proyecto[];
  loadingLegal: boolean;
  cancelado: boolean;
  onVerExpediente: () => void;
  onCancelar?: () => void;
};

function ContratoCard({
  activos, contratoNum, etapa, financiamiento,
  proyectos, loadingLegal, cancelado,
  onVerExpediente, onCancelar,
}: Readonly<ContratoCardProps>) {
  return (
    <div className={`p-5 ${cancelado ? "opacity-60" : ""}`}>
      {/* Contrato header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            cancelado
              ? "bg-slate-100 dark:bg-white/5"
              : "bg-build-main/8 dark:bg-white/8"
          }`}>
            <span className="text-xs font-black text-build-main dark:text-white">#{contratoNum}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-build-main dark:text-white leading-none">
              Contrato {contratoNum}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {cancelado && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40">
                  Cancelado
                </span>
              )}
              {!cancelado && etapa.label !== "—" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${etapa.cls}`}>
                  {etapa.label}
                </span>
              )}
              <span className="text-[10px] text-slate-400 dark:text-white/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">payments</span>
                {financiamiento}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onVerExpediente}
            disabled={loadingLegal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-arch-gold hover:text-build-main hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[14px]">gavel</span>
            <span>Expediente legal</span>
          </button>
          {!cancelado && onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border border-red-200 dark:border-red-900/30"
            >
              <span className="material-symbols-outlined text-[14px]">contract_delete</span>
              <span>Cancelar contrato</span>
            </button>
          )}
        </div>
      </div>

      {/* Unidades */}
      {activos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 dark:border-white/10 py-3 px-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-white/20">info</span>
          <p className="text-xs text-slate-400 dark:text-white/30">Las unidades fueron desvinculadas al cancelar este contrato.</p>
        </div>
      ) : (
        <div className={`grid gap-3 ${activos.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          {activos.map((activo) => {
            const estadoBadge = getEstadoBadge(activo.estadoComercial);
            const matchedProyecto = proyectos.find(
              (p) => p.nombre?.toLowerCase().trim() === activo.proyectoNombre?.toLowerCase().trim()
            );
            const proyectoId = matchedProyecto?.id;

            return (
              <div
                key={activo.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/3 p-4 hover:border-build-accent/50 hover:bg-white dark:hover:bg-white/5 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-build-main dark:text-white">
                        {getUnitIcon(activo.tipo)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-build-main dark:text-white leading-tight">
                        {getUnitLabel(activo.tipo)} {activo.nro}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-white/40 mt-0.5">
                        {activo.torreNombre && `${activo.torreNombre} · `}
                        {activo.nroPiso && `Piso ${activo.nroPiso}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${estadoBadge.bg} ${estadoBadge.text}`}>
                    {estadoBadge.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-white/50 mb-3 pl-[42px]">
                  <span className="flex items-center gap-0.5 font-semibold text-build-main dark:text-white">
                    <span className="material-symbols-outlined text-[11px]">payments</span>
                    {formatPrice(activo.precio)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">straighten</span>
                    {activo.areaM2} m²
                  </span>
                  {activo.areaTechada > 0 && (
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">roofing</span>
                      {activo.areaTechada} m² tech.
                    </span>
                  )}
                </div>

                <div className="pl-[42px]">
                  <Link
                    href={proyectoId ? `/proyectos/${proyectoId}/unidades/${activo.id}` : `/proyectos`}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-white/40 hover:text-build-main dark:hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px]">visibility</span>
                    <span>Ver detalle de unidad</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ContratosHistorial (cancelados, colapsable) ──────────────────────────────

function ContratosHistorial({
  contratos,
  loadingLegal,
  onVerExpediente,
}: Readonly<{
  contratos: UsuarioActivoResponseDTO[];
  loadingLegal: Record<string, boolean>;
  onVerExpediente: (uuid: string) => void;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-slate-100 dark:border-white/5">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-slate-400 dark:text-white/30">history</span>
          <span className="text-xs font-bold text-slate-400 dark:text-white/40">
            Contratos cancelados ({contratos.length})
          </span>
        </div>
        <span className={`material-symbols-outlined text-[16px] text-slate-300 dark:text-white/20 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {/* Collapsed content */}
      {open && (
        <div className="border-t border-slate-100 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5 bg-slate-50/40 dark:bg-white/[0.01]">
          {contratos.map((contrato, idx) => {
            const activos = contrato.activos ?? [];
            const financiamiento = getFinanciamientoLabel(contrato.tipoFinanciamiento);
            const canceladoEn = contrato.updatedAt
              ? new Date(contrato.updatedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })
              : null;

            return (
              <div key={contrato.uuidUsuarioActivo} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Número */}
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-slate-400 dark:text-white/30">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400 dark:text-white/40 line-through">
                        Contrato {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40">
                        Cancelado
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-white/30">
                        {financiamiento}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 dark:text-white/20 mt-0.5">
                      {activos.length === 0
                        ? "Unidades desvinculadas"
                        : activos.map((a) => `${getUnitLabel(a.tipo)} ${a.nro}`).join(", ")}
                      {canceladoEn && ` · ${canceladoEn}`}
                    </p>
                  </div>
                </div>

                {/* Solo permite ver expediente */}
                <button
                  type="button"
                  onClick={() => onVerExpediente(contrato.uuidUsuarioActivo)}
                  disabled={!!loadingLegal[contrato.uuidUsuarioActivo]}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-400 dark:text-white/30 hover:text-arch-gold hover:bg-white dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10 disabled:opacity-50 shrink-0"
                >
                  <span className="material-symbols-outlined text-[12px]">gavel</span>
                  <span>Ver expediente</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
