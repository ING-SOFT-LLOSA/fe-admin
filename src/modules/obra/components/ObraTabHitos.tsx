"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { crearEtapaProyecto, getAvancesActivo, updateAvanceUnidad } from "@/lib/api/obra";
import type { EtapaResponseDTO, AvanceUnidadResponseDTO } from "@/lib/api/obra";
import { fetchTorresPorProyecto, fetchPisosPorTorre, fetchActivosPorProyecto } from "@/lib/api/proyectos";
import type { TorreResponseDTO, PisoResponseDTO, ActivoResponseDTO } from "@/lib/api/proyectos";

// ─── Types ────────────────────────────────────────────────────────────────────

type Nivel = "proyecto" | "piso";

type ObraTabHitosProps = {
  readonly projectId: string;
  readonly etapas: readonly EtapaResponseDTO[];
  readonly onRefresh: () => Promise<void>;
};

type ObraTabHitosProyectoProps = {
  readonly projectId: string;
  readonly etapas: readonly EtapaResponseDTO[];
  readonly onRefresh: () => Promise<void>;
};

type ObraTabHitosPisoProps = {
  readonly projectId: string;
  readonly etapas: readonly EtapaResponseDTO[];
  readonly onRefresh: () => Promise<void>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NIVEL_TABS: { id: Nivel; label: string; icon: string }[] = [
  { id: "proyecto", label: "Por proyecto", icon: "domain" },
  { id: "piso",     label: "Por piso",     icon: "layers" },
];

const HITOS_ESTANDAR = [
  "Anteproyecto aprobado",
  "Licencia de construcción",
  "Demolición",
  "Inicio de obra",
  "Excavación",
  "Cimentación",
  "Casco",
  "Acabados húmedos",
  "Acabados secos",
  "Proyecto terminado",
];

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE:   "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50",
  EN_PROGRESO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETADA:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETADO:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  RETRASADA:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE:   "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA:  "Completada",
  COMPLETADO:  "Completado",
  RETRASADA:   "Retrasada",
};

/** Compute the "next" estado in the sequential flow PENDIENTE → EN_PROGRESO → COMPLETADO. */
function nextEstado(current: string): string {
  if (current === "PENDIENTE") return "EN_PROGRESO";
  if (current === "EN_PROGRESO") return "COMPLETADO";
  return "EN_PROGRESO"; // COMPLETADO goes back to EN_PROGRESO
}

// ─── Module Helpers (to prevent nesting) ──────────────────────────────────────

async function loadPisosParaTorre(
  torreId: number,
  setPisosMap: React.Dispatch<React.SetStateAction<Record<number, PisoResponseDTO[]>>>,
  setLoadingPisosMap: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
  cancelled: { current: boolean }
) {
  setLoadingPisosMap((prev) => ({ ...prev, [torreId]: true }));
  try {
    const pisoList = await fetchPisosPorTorre(torreId);
    if (!cancelled.current) {
      setPisosMap((prev) => ({ ...prev, [torreId]: pisoList }));
    }
  } catch (err) {
    console.error(`Error cargando pisos de torre ${torreId}:`, err);
  } finally {
    if (!cancelled.current) {
      setLoadingPisosMap((prev) => ({ ...prev, [torreId]: false }));
    }
  }
}

async function updateAssetsProgress(
  assetIds: string[],
  hitoOrden: number,
  newEstado: string
): Promise<number> {
  let errors = 0;
  for (const assetId of assetIds) {
    const avances = await getAvancesActivo(assetId).catch(() => []);
    const matching = avances.find((a) => a.hitoOrden === hitoOrden);
    if (matching) {
      try {
        await updateAvanceUnidad(matching.id, newEstado);
      } catch {
        errors++;
      }
    }
  }
  return errors;
}

// ─── HitoMaestroRow Component ──────────────────────────────────────────────────

function HitoMaestroRow({
  etapa,
  globalToggling,
  onToggle,
}: Readonly<{
  etapa: EtapaResponseDTO;
  globalToggling: string | null;
  onToggle: (etapa: EtapaResponseDTO, newEstado: string) => void;
}>) {
  const isToggling = globalToggling === String(etapa.id);
  const estado = etapa.estado ?? "PENDIENTE";

  const spinnerIcon = (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
      <td className="px-5 py-3 text-sm font-bold text-slate-400 dark:text-white/30 w-10">
        {etapa.orden}
      </td>
      <td className="px-5 py-3 text-sm font-semibold text-build-main dark:text-white">
        {etapa.nombre}
      </td>
      <td className="px-5 py-3 text-sm text-slate-500 dark:text-white/50 max-w-xs truncate">
        {etapa.descripcion || "—"}
      </td>
      <td className="px-5 py-3">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            ESTADO_STYLES[estado] ?? ESTADO_STYLES.PENDIENTE
          }`}
        >
          {ESTADO_LABELS[estado] ?? "Pendiente"}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5">
          {estado === "PENDIENTE" && (
            <button
              type="button"
              disabled={isToggling}
              onClick={() => onToggle(etapa, "EN_PROGRESO")}
              className="text-xs font-bold px-3 py-1 rounded-lg transition-colors border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isToggling ? spinnerIcon : "Iniciar"}
            </button>
          )}
          {estado === "EN_PROGRESO" && (
            <>
              <button
                type="button"
                disabled={isToggling}
                onClick={() => onToggle(etapa, "COMPLETADO")}
                className="text-xs font-bold px-3 py-1 rounded-lg transition-colors border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isToggling ? spinnerIcon : "Completar"}
              </button>
              <button
                type="button"
                disabled={isToggling}
                onClick={() => onToggle(etapa, "PENDIENTE")}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Detener
              </button>
            </>
          )}
          {estado === "COMPLETADO" && (
            <button
              type="button"
              disabled={isToggling}
              onClick={() => onToggle(etapa, "EN_PROGRESO")}
              className="text-xs font-bold px-3 py-1 rounded-lg transition-colors border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isToggling ? spinnerIcon : "Deshacer"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── ObraTabHitosProyecto Component ──────────────────────────────────────────

function ObraTabHitosProyecto({
  projectId,
  etapas,
  onRefresh,
}: Readonly<ObraTabHitosProyectoProps>) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [globalToggling, setGlobalToggling] = useState<string | null>(null);

  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // FIX: guardia de idempotencia — no crear si ya existen hitos en el backend
  async function handleGenerarEstandar() {
    if (etapas.length > 0) {
      setError("El proyecto ya tiene hitos registrados.");
      return;
    }

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      for (let i = 0; i < HITOS_ESTANDAR.length; i++) {
        await crearEtapaProyecto(projectId, {
          nombre: HITOS_ESTANDAR[i],
          descripcion: "Hito estándar de la industria",
          orden: i + 1,
        });
      }
      setSuccess("Secuencia estándar generada correctamente.");
      await onRefresh();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron generar todos los hitos. Verifica el backend."
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Completar / deshacer hito maestro (impacto global en todos los pisos) ──
  async function handleToggleEstadoGlobal(etapa: EtapaResponseDTO, newEstado: string) {
    setGlobalToggling(String(etapa.id));
    setError("");
    try {
      const page = await fetchActivosPorProyecto(projectId);
      const activosList: ActivoResponseDTO[] = page?.content || [];
      const proxyAssetIds = new Map<number, string>();
      activosList.forEach((a) => {
        if (a.pisoId && !proxyAssetIds.has(a.pisoId)) {
          proxyAssetIds.set(a.pisoId, a.id);
        }
      });
      const assetIds = Array.from(proxyAssetIds.values());

      const errors = await updateAssetsProgress(assetIds, etapa.orden, newEstado);

      if (errors > 0) {
        setError(
          `Se actualizaron ${assetIds.length - errors} de ${assetIds.length} pisos. Algunos hitos no se pudieron modificar (verifica el orden secuencial).`
        );
      } else {
        const estadoLabel = ESTADO_LABELS[newEstado] ?? newEstado;
        setSuccess(`Hito "${etapa.nombre}" marcado como ${estadoLabel.toLowerCase()} en todos los pisos.`);
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => setSuccess(""), 4000);
      }
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar el hito global.");
    } finally {
      setGlobalToggling(null);
    }
  }

  const hitosCountLabel = useMemo(() => {
    if (etapas.length === 0) {
      return "Sin hitos — carga la secuencia estándar para comenzar";
    }
    const pluralStr = etapas.length === 1 ? "" : "s";
    return `${etapas.length} hito${pluralStr} configurado${pluralStr}`;
  }, [etapas]);

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-build-main dark:text-white">
              Hitos maestros del proyecto
            </h3>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
              {hitosCountLabel}
            </p>
          </div>

          {etapas.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50">
              <span className="material-symbols-outlined text-[14px]">lock</span>{" "}
              <span>Predefinidos</span>
            </span>
          )}
        </div>

        {etapas.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-white/20 mb-4">
              account_tree
            </span>
            <p className="text-sm font-semibold text-build-main dark:text-white mb-2">
              No hay hitos maestros registrados
            </p>
            <p className="text-xs text-slate-400 dark:text-white/40 mb-6 max-w-xs">
              Los 10 hitos estándar de la industria se crearán automáticamente
              en el backend y se propagarán a cada unidad del proyecto.
            </p>
            <button
              type="button"
              onClick={handleGenerarEstandar}
              disabled={saving}
              className="rounded-xl bg-arch-gold px-5 py-2.5 text-sm font-bold text-white hover:bg-arch-gold/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>{" "}
                  <span>Generando…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>{" "}
                  <span>Cargar hitos estándar</span>
                </>
              )}
            </button>

            <div className="mt-8 w-full max-w-sm text-left space-y-1">
              {HITOS_ESTANDAR.map((nombre, i) => (
                <div key={nombre} className="flex items-center gap-3 py-1.5">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-white/30 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-white/50">{nombre}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
              <tr>
                {["#", "Hito", "Descripción", "Estado", "Acción"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {[...etapas]
                .sort((a, b) => a.orden - b.orden)
                .map((etapa) => (
                  <HitoMaestroRow
                    key={etapa.id}
                    etapa={etapa}
                    globalToggling={globalToggling}
                    onToggle={handleToggleEstadoGlobal}
                  />
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── PisoAvancesTable Component ──────────────────────────────────────────────

function PisoAvancesTable({
  avances,
  loadingAvances,
  selectedPisoId,
  etapasLength,
  onToggle,
}: Readonly<{
  avances: readonly AvanceUnidadResponseDTO[];
  loadingAvances: boolean;
  selectedPisoId: string;
  etapasLength: number;
  onToggle: (avanceId: string, newEstado: string) => Promise<void>;
}>) {
  if (!selectedPisoId) {
    return (
      <div className="px-6 py-10 text-center text-sm text-slate-400 dark:text-white/40">
        Selecciona una torre y un piso para ver sus hitos.
      </div>
    );
  }

  if (loadingAvances) {
    return (
      <div className="px-6 py-10 text-center text-sm text-slate-400 dark:text-white/40">
        Cargando hitos del piso…
      </div>
    );
  }

  if (avances.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-slate-400 dark:text-white/40">
        <span>No hay hitos registrados para este piso.</span>{" "}
        {etapasLength === 0 && (
          <p className="mt-2 text-xs">
            Primero carga los hitos maestros del proyecto desde la pestaña &quot;Por proyecto&quot;.
          </p>
        )}
      </div>
    );
  }

  return (
    <table className="w-full text-left">
      <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
        <tr>
          {["#", "Hito", "Tipo", "Estado", "Acción"].map((h) => (
            <th
              key={h}
              className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
        {avances.map((avance) => {
          const estado = avance.estado ?? "PENDIENTE";
          return (
            <tr key={avance.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
              <td className="px-5 py-3 text-sm font-bold text-slate-400 dark:text-white/30 w-10">
                {avance.hitoOrden}
              </td>
              <td className="px-5 py-3 text-sm font-semibold text-build-main dark:text-white">
                {avance.hitoTitulo}
              </td>
              <td className="px-5 py-3 text-sm text-slate-500 dark:text-white/50">
                {avance.hitoTipo}
              </td>
              <td className="px-5 py-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ESTADO_STYLES[estado] ?? ESTADO_STYLES.PENDIENTE
                  }`}
                >
                  {ESTADO_LABELS[estado] ?? avance.estado}
                </span>
                {avance.fechaCompletado && (
                  <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">
                    {avance.fechaCompletado}
                  </p>
                )}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-1.5">
                  {estado === "PENDIENTE" && (
                    <button
                      type="button"
                      onClick={() => onToggle(avance.id, "EN_PROGRESO")}
                      className="text-xs font-bold px-3 py-1 rounded-lg transition-colors border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-900/20"
                    >
                      Iniciar
                    </button>
                  )}
                  {estado === "EN_PROGRESO" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onToggle(avance.id, "COMPLETADO")}
                        className="text-xs font-bold px-3 py-1 rounded-lg transition-colors border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:hover:bg-green-900/20"
                      >
                        Completar
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(avance.id, "PENDIENTE")}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                      >
                        Detener
                      </button>
                    </>
                  )}
                  {estado === "COMPLETADO" && (
                    <button
                      type="button"
                      onClick={() => onToggle(avance.id, "EN_PROGRESO")}
                      className="text-xs font-bold px-3 py-1 rounded-lg transition-colors border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                    >
                      Deshacer
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── ObraTabHitosPiso Component ──────────────────────────────────────────────

function ObraTabHitosPiso({
  projectId,
  etapas,
  onRefresh,
}: Readonly<ObraTabHitosPisoProps>) {
  const [torres,           setTorres]           = useState<TorreResponseDTO[]>([]);
  const [loadingTorres,    setLoadingTorres]    = useState(false);
  const [selectedTorreId,  setSelectedTorreId]  = useState<string>("");

  const [pisosMap,         setPisosMap]         = useState<Record<number, PisoResponseDTO[]>>({});
  const [loadingPisosMap,  setLoadingPisosMap]  = useState<Record<number, boolean>>({});
  const [selectedPisoId,   setSelectedPisoId]   = useState<string>("");
  const pisos = selectedTorreId ? (pisosMap[Number(selectedTorreId)] || []) : [];

  const [activos,          setActivos]          = useState<ActivoResponseDTO[]>([]);

  const [avances,          setAvances]          = useState<AvanceUnidadResponseDTO[]>([]);
  const [loadingAvances,   setLoadingAvances]   = useState(false);
  const [errorPiso,        setErrorPiso]        = useState("");

  // ── Cargar torres y precargar pisos cuando se monta / cambia projectId ──
  useEffect(() => {
    const cancelled = { current: false };

    async function loadData() {
      setLoadingTorres(true);
      setPisosMap({});
      setLoadingPisosMap({});

      try {
        const data = await fetchTorresPorProyecto(projectId);
        if (cancelled.current) return;
        setTorres(data);

        // Fetch floors for each tower concurrently using a loop to avoid function nesting
        const fetchFloorTasks: Promise<void>[] = [];
        for (const t of data) {
          fetchFloorTasks.push(loadPisosParaTorre(t.id, setPisosMap, setLoadingPisosMap, cancelled));
        }
        await Promise.all(fetchFloorTasks);
      } catch (err) {
        console.error(err);
      }

      try {
        const page = await fetchActivosPorProyecto(projectId);
        if (!cancelled.current) {
          setActivos(page.content || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled.current) {
          setLoadingTorres(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled.current = true;
    };
  }, [projectId]);

  // ── Cargar avances del piso seleccionado (usando Activo proxy) ────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadAvances() {
      if (!selectedPisoId) {
        setAvances([]);
        setErrorPiso("");
        return;
      }

      setLoadingAvances(true);
      setErrorPiso("");

      const activoProxy = activos.find((a) => a.pisoId === Number(selectedPisoId));
      if (!activoProxy) {
        setErrorPiso("El piso seleccionado no tiene unidades registradas, por lo que no se pueden calcular sus hitos.");
        setLoadingAvances(false);
        return;
      }

      try {
        const data = await getAvancesActivo(activoProxy.id);
        if (!cancelled) {
          setAvances(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorPiso(err instanceof Error ? err.message : "No se pudieron cargar los hitos.");
        }
      } finally {
        if (!cancelled) {
          setLoadingAvances(false);
        }
      }
    }

    void loadAvances();
    return () => {
      cancelled = true;
    };
  }, [selectedPisoId, activos]);

  // ── Cambiar estado de hito de piso ────────────────────────────────────────
  const handleToggleEstadoPiso = useCallback(async (avanceId: string, newEstado: string) => {
    setErrorPiso("");

    const activoProxy = activos.find((a) => a.pisoId === Number(selectedPisoId));

    try {
      await updateAvanceUnidad(avanceId, newEstado);
      if (activoProxy) {
        const data = await getAvancesActivo(activoProxy.id);
        setAvances(data);
      }
      await onRefresh();
    } catch (err: unknown) {
      setErrorPiso(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado. Verifica si el hito anterior está completado."
      );
    }
  }, [selectedPisoId, activos, onRefresh]);

  return (
    <>
      {/* Selectores de torre y piso */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="text-sm font-bold text-build-main dark:text-white whitespace-nowrap">
          Seleccionar piso:
        </span>

        {loadingTorres ? (
          <span className="text-sm text-slate-400 dark:text-white/40">Cargando torres…</span>
        ) : (
          <select
            value={selectedTorreId}
            onChange={(e) => {
              setSelectedTorreId(e.target.value);
              setSelectedPisoId("");
            }}
            className="w-full sm:w-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-build-accent dark:text-white"
          >
            <option value="">— Torre —</option>
            {torres.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        )}

        <select
          value={selectedPisoId}
          onChange={(e) => setSelectedPisoId(e.target.value)}
          disabled={!selectedTorreId || loadingPisosMap[Number(selectedTorreId)]}
          className="w-full sm:w-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-build-accent dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {selectedTorreId && loadingPisosMap[Number(selectedTorreId)]
              ? "Cargando pisos..."
              : "— Piso —"}
          </option>
          {selectedTorreId &&
            !loadingPisosMap[Number(selectedTorreId)] &&
            pisos.map((p) => (
              <option key={p.id} value={p.id}>
                Piso {p.nroPiso}
              </option>
            ))}
        </select>
      </div>

      {/* Error de piso */}
      {errorPiso && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {errorPiso}
        </div>
      )}

      {/* Tabla de avances */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-sm font-bold text-build-main dark:text-white">
            Hitos — Por piso
          </h3>
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            Avance constructivo real del piso seleccionado
          </p>
        </div>

        <PisoAvancesTable
          avances={avances}
          loadingAvances={loadingAvances}
          selectedPisoId={selectedPisoId}
          etapasLength={etapas.length}
          onToggle={handleToggleEstadoPiso}
        />
      </div>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ObraTabHitos({
  projectId,
  etapas,
  onRefresh,
}: Readonly<ObraTabHitosProps>) {
  const [nivel, setNivel] = useState<Nivel>("proyecto");

  return (
    <div className="space-y-6">
      {/* Nivel sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {NIVEL_TABS.map((tab) => {
          const isActive = nivel === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setNivel(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                ${
                  isActive
                    ? "bg-build-main text-white"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10"
                }
              `}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>{" "}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {nivel === "proyecto" ? (
        <ObraTabHitosProyecto
          projectId={projectId}
          etapas={etapas}
          onRefresh={onRefresh}
        />
      ) : (
        <ObraTabHitosPiso
          projectId={projectId}
          etapas={etapas}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}