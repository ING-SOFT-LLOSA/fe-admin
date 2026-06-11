"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fetchUsuarios, fetchExpedientesPorUsuario } from "@/lib/api/users";
import { fetchContratoActivo, type UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import type { Usuario } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";

import { TABS, type Tab } from "./constants";
import { useCommercialStepper } from "./hooks";
import { useStageDocuments } from "./hooks";
import { InfoChip, LoadingSpinner, ErrorBanner } from "./ui";
import { TabResumen } from "./TabResumen";
import { TabProceso } from "./TabProceso";
import { TabDocumentos } from "./TabDocumentos";

type Props = { clientId: number };

export default function ClientExpedienteView({ clientId }: Props) {
  const { perfil } = useAuth();

  const [client, setClient] = useState<Usuario | null>(null);
  const [expedientes, setExpedientes] = useState<UsuarioActivoResponseDTO[]>([]);
  const [selectedExpediente, setSelectedExpediente] = useState<UsuarioActivoResponseDTO | null>(null);
  const [contrato, setContrato] = useState<UsuarioActivoResponseDTO | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("resumen");

  // ── Data layer ─────────────────────────────────────────────────────────────

  const {
    stepper,
    etapas,
    loading: stepperLoading,
    error: stepperError,
    updateHito,
  } = useCommercialStepper(contrato);

  const {
    sections,
    loading: docsLoading,
    error: docsError,
    refresh: refreshDocs,
  } = useStageDocuments(contrato, stepper);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    async function load() {
      setPageLoading(true);
      setPageError("");
      try {
        const [users, exps] = await Promise.all([
          fetchUsuarios(),
          fetchExpedientesPorUsuario(clientId),
        ]);
        if (!mounted) return;
        setClient(users.find((u) => u.id === clientId) ?? null);
        setExpedientes(exps);
        if (exps.length > 0) setSelectedExpediente(exps[0]);
      } catch (err) {
        if (mounted) setPageError(err instanceof Error ? err.message : "No se pudo cargar el cliente.");
      } finally {
        if (mounted) setPageLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [clientId]);

  useEffect(() => {
    const activo = selectedExpediente?.activos?.[0];
    if (activo?.id) {
      fetchContratoActivo(activo.id)
        .then(data => {
          // Backend returns UsuarioActivoResponseDTO directly (not wrapped in {expediente})
          const c = "expediente" in (data as any) ? (data as any).expediente : data;
          setContrato(c ?? selectedExpediente);
        })
        .catch(() => setContrato(selectedExpediente));
    } else {
      setContrato(selectedExpediente);
    }
  }, [selectedExpediente]);

  // ── Permissions ────────────────────────────────────────────────────────────

  const isAdmin = perfil?.rol === "ADMIN";
  const canEditHitos = isAdmin || !!perfil?.funciones?.includes("CONTRATO_EDITAR");
  const canUploadDocs = isAdmin || !!perfil?.funciones?.includes("DOCS_SUBIR");
  const canEditNotes = isAdmin || !!perfil?.funciones?.includes("CONTRATO_NOTAS_EDITAR");

  // ── Derived display values ─────────────────────────────────────────────────

  const fullName = client
    ? [client.nombre, client.apellidos].filter(Boolean).join(" ")
    : "Cliente no encontrado";
  const initials = fullName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  // ── Early returns ──────────────────────────────────────────────────────────

  if (pageLoading) return <LoadingSpinner label="Cargando expediente..." />;
  if (pageError) return <ErrorBanner message={pageError} />;

  // ── Render ─────────────────────────────────────────────────────────────────

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

      {/* Unit selector */}
      {expedientes.length > 0 ? (
        <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <label className="text-sm font-bold text-build-main dark:text-white whitespace-nowrap">Unidad:</label>
          <select
            value={selectedExpediente?.uuidUsuarioActivo ?? ""}
            onChange={(e) =>
              setSelectedExpediente(expedientes.find((x) => x.uuidUsuarioActivo === e.target.value) ?? null)
            }
            className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111] px-3 py-2 text-sm focus:outline-none dark:text-white"
          >
            {expedientes.map((exp) => {
              const activo = exp.activos?.[0];
              const label = activo
                ? `${activo.proyectoNombre} — ${activo.torreNombre} — Piso ${activo.nroPiso} — ${activo.tipo} ${activo.nro}`
                : `${exp.tipoFinanciamiento || "Contrato"} — ${exp.fechaAdquisicion?.split("T")[0] || "—"}`;
              return (
                <option key={exp.uuidUsuarioActivo} value={exp.uuidUsuarioActivo}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-400 text-sm font-semibold">
          Este cliente no tiene unidades asignadas en el sistema.
        </div>
      )}

      {/* Client card */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-build-main/10 dark:bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-build-main dark:text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-build-main dark:text-white">{fullName}</h3>
            <p className="text-sm text-slate-500 dark:text-white/50 mt-0.5">{client?.email || "—"}</p>
            {(() => {
              const a = selectedExpediente?.activos?.[0];
              return a ? (
                <p className="text-xs text-build-accent font-semibold mt-1.5">
                  {a.proyectoNombre} — {a.torreNombre} — Piso {a.nroPiso} — {a.tipo} {a.nro}
                </p>
              ) : null;
            })()}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <InfoChip icon="badge" label={client?.documentoIdentidad || "Sin DNI"} />
            <InfoChip icon="phone" label={client?.telefono || "Sin teléfono"} />
            {selectedExpediente?.tipoFinanciamiento && (
              <InfoChip icon="attach_money" label={selectedExpediente.tipoFinanciamiento} />
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
              flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors
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

      {/* Stepper-level errors */}
      {stepperError && <ErrorBanner message={stepperError} />}

      {/* Tab content */}
      <div>
        {activeTab === "resumen" && (
          <TabResumen
            client={client}
            expediente={selectedExpediente}
            contrato={contrato}
            etapas={etapas}
            loadingStepper={stepperLoading}
          />
        )}
        {activeTab === "proceso" && (
          <TabProceso
            etapas={etapas}
            loadingStepper={stepperLoading}
            canEdit={canEditHitos}
            onUpdateHito={updateHito}
          />
        )}
        {activeTab === "documentos" && (
          <TabDocumentos
            contrato={contrato}
            sections={sections}
            loading={docsLoading}
            loadError={docsError}
            canUploadDocs={canUploadDocs}
            canEditNotes={canEditNotes}
            onRefresh={refreshDocs}
          />
        )}
      </div>
    </section>
  );
}
