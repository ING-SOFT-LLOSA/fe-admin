"use client";

import { useEffect, useState } from "react";

import { crearEtapaProyecto, getAvancesActivo, updateAvanceUnidad } from "@/lib/api/obra";
import type { EtapaResponseDTO, AvanceUnidadResponseDTO } from "@/lib/api/obra";
import { fetchTorresPorProyecto, fetchPisosPorTorre, fetchActivosPorProyecto } from "@/lib/api/proyectos";
import type { TorreResponseDTO, PisoResponseDTO, ActivoResponseDTO } from "@/lib/api/proyectos";

// ─── Types ────────────────────────────────────────────────────────────────────

type Nivel = "proyecto" | "piso";

type ObraTabHitosProps = {
  projectId: string;
  etapas: EtapaResponseDTO[];
  onRefresh: () => Promise<void>;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ObraTabHitos({ projectId, etapas, onRefresh }: ObraTabHitosProps) {
  const [nivel,         setNivel]         = useState<Nivel>("proyecto");
  const [saving,        setSaving]        = useState(false);
  const [success,       setSuccess]       = useState("");
  const [error,         setError]         = useState("");

  // ── Piso state ────────────────────────────────────────────────────────────
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

  // ── Cargar torres y precargar pisos cuando se abre la pestaña "Por piso" ──
  useEffect(() => {
    if (nivel !== "piso") return;

    let cancelled = false;
    Promise.resolve().then(() => {
      setLoadingTorres(true);
      setPisosMap({});
      setLoadingPisosMap({});

      fetchTorresPorProyecto(projectId)
        .then((data) => {
          if (cancelled) return;
          setTorres(data);


          // Cargar pisos para cada torre de manera individual e incremental
          data.forEach((t) => {
            setLoadingPisosMap((prev) => ({ ...prev, [t.id]: true }));
            fetchPisosPorTorre(t.id)
              .then((pisoList) => {
                if (cancelled) return;
                setPisosMap((prev) => ({ ...prev, [t.id]: pisoList }));
                setLoadingPisosMap((prev) => ({ ...prev, [t.id]: false }));
              })
              .catch((err) => {
                console.error(`Error cargando pisos de torre ${t.id}:`, err);
                if (cancelled) return;
                setLoadingPisosMap((prev) => ({ ...prev, [t.id]: false }));
              });
          });
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            console.error(err);
          }
        });

      fetchActivosPorProyecto(projectId)
        .then((page) => {
          if (!cancelled) {
            setActivos(page.content || []);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) console.error(err);
        })
        .finally(() => {
          if (!cancelled) setLoadingTorres(false);
        });
    });

    return () => { cancelled = true; };
  }, [nivel, projectId]);

  // ── Resetear piso seleccionado cuando cambia la torre ──────────────────────
  useEffect(() => {
    Promise.resolve().then(() => {
      setSelectedPisoId("");
    });
  }, [selectedTorreId]);

  // ── Cargar avances del piso seleccionado (usando Activo proxy) ────────────────
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!selectedPisoId) {
        setAvances([]);
        setErrorPiso("");
        return;
      }

      setLoadingAvances(true);
      setErrorPiso("");

      const activoProxy = activos.find((a) => a.pisoId === Number(selectedPisoId));
      if (!activoProxy) {
        if (!cancelled) {
          setErrorPiso("El piso seleccionado no tiene unidades registradas, por lo que no se pueden calcular sus hitos.");
          setLoadingAvances(false);
        }
        return;
      }

      getAvancesActivo(activoProxy.id)
        .then((data) => {
          if (!cancelled) setAvances(data);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setErrorPiso(err instanceof Error ? err.message : "No se pudieron cargar los hitos.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingAvances(false);
        });
    });

    return () => { cancelled = true; };
  }, [selectedPisoId, activos]);
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
      setTimeout(() => setSuccess(""), 4000);
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

  // ── State para toggle global ────────────────────────────────────────────
  const [globalToggling, setGlobalToggling] = useState<string | null>(null);

  // ── Completar / deshacer hito maestro (impacto global en todos los pisos) ──
  async function handleToggleEstadoGlobal(etapa: EtapaResponseDTO) {
    const newEstado = etapa.estado === "COMPLETADO" ? "PENDIENTE" : "COMPLETADO";
    setGlobalToggling(String(etapa.id));
    setError("");
    try {
      const page = await fetchActivosPorProyecto(projectId);
      const activos: ActivoResponseDTO[] = page?.content || [];
      const proxyAssetIds = new Map<number, string>();
      activos.forEach((a) => {
        if (a.pisoId && !proxyAssetIds.has(a.pisoId)) {
          proxyAssetIds.set(a.pisoId, a.id);
        }
      });
      const assetIds = Array.from(proxyAssetIds.values());

      let errors = 0;
      for (const assetId of assetIds) {
        const avances = await getAvancesActivo(assetId).catch(() => []);
        const matching = avances.find((a) => a.hitoOrden === etapa.orden);
        if (matching) {
          try {
            await updateAvanceUnidad(matching.id, newEstado);
          } catch {
            errors++;
          }
        }
      }

      if (errors > 0) {
        setError(`Se actualizaron ${assetIds.length - errors} de ${assetIds.length} pisos. Algunos hitos no se pudieron modificar (verifica el orden secuencial).`);
      } else {
        setSuccess(`Hito "${etapa.nombre}" marcado como ${newEstado === "COMPLETADO" ? "completado" : "pendiente"} en todos los pisos.`);
        setTimeout(() => setSuccess(""), 4000);
      }
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar el hito global.");
    } finally {
      setGlobalToggling(null);
    }
  }

  // ── Completar / deshacer hito de piso ────────────────────────────────────
  async function handleToggleEstadoPiso(avanceId: string, currentEstado: string) {
    setErrorPiso("");
    const newEstado = currentEstado === "COMPLETADO" ? "PENDIENTE" : "COMPLETADO";

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
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Nivel sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {NIVEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setNivel(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${nivel === tab.id
                ? "bg-build-main text-white"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10"
              }
            `}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Mensajes globales ── */}
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

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: POR PROYECTO
          Muestra los hitos maestros del backend como lista readonly.
          Si no existen, ofrece cargar la secuencia estándar predefinida.
          NO hay formulario libre — los hitos deben ser los 10 estándar.
      ══════════════════════════════════════════════════════════════════════ */}
      {nivel === "proyecto" && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-build-main dark:text-white">
                Hitos maestros del proyecto
              </h3>
              <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                {etapas.length > 0
                  ? `${etapas.length} hito${etapas.length !== 1 ? "s" : ""} configurado${etapas.length !== 1 ? "s" : ""}`
                  : "Sin hitos — carga la secuencia estándar para comenzar"}
              </p>
            </div>

            {/* Botón cargar estándar — solo visible si ya hay hitos (acción secundaria) */}
            {etapas.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Predefinidos
              </span>
            )}
          </div>

          {etapas.length === 0 ? (
            /* Estado vacío: ningún hito creado aún */
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
                    </svg>
                    Generando…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    Cargar hitos estándar
                  </>
                )}
              </button>

              {/* Preview de los hitos que se van a crear */}
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
            /* Lista readonly de hitos del backend */
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
                    <tr key={etapa.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
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
                            ESTADO_STYLES[etapa.estado ?? "PENDIENTE"] ?? ESTADO_STYLES.PENDIENTE
                          }`}
                        >
                          {ESTADO_LABELS[etapa.estado ?? "PENDIENTE"] ?? "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          disabled={globalToggling === String(etapa.id)}
                          onClick={() => handleToggleEstadoGlobal(etapa)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors border ${
                            etapa.estado === "COMPLETADO"
                              ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                              : "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:hover:bg-green-900/20"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {globalToggling === String(etapa.id) ? (
                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : etapa.estado === "COMPLETADO" ? "Restablecer" : "Completar"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: POR PISO
          Selector de torre y piso → tabla de HitoPiso con botón completar/deshacer
      ══════════════════════════════════════════════════════════════════════ */}
      {nivel === "piso" && (
        <>
          {/* Selectores de torre y piso */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-sm font-bold text-build-main dark:text-white whitespace-nowrap">
              Seleccionar piso:
            </label>
            
            {loadingTorres ? (
              <span className="text-sm text-slate-400 dark:text-white/40">Cargando torres…</span>
            ) : (
              <select
                value={selectedTorreId}
                onChange={(e) => setSelectedTorreId(e.target.value)}
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

            {!selectedPisoId ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400 dark:text-white/40">
                Selecciona una torre y un piso para ver sus hitos.
              </div>
            ) : loadingAvances ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400 dark:text-white/40">
                Cargando hitos del piso…
              </div>
            ) : avances.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400 dark:text-white/40">
                No hay hitos registrados para este piso.
                {etapas.length === 0 && (
                  <p className="mt-2 text-xs">
                    Primero carga los hitos maestros del proyecto desde la pestaña &quot;Por proyecto&quot;.
                  </p>
                )}
              </div>
            ) : (
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
                  {avances.map((avance) => (
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
                            ESTADO_STYLES[avance.estado ?? "PENDIENTE"] ?? ESTADO_STYLES.PENDIENTE
                          }`}
                        >
                          {ESTADO_LABELS[avance.estado ?? "PENDIENTE"] ?? avance.estado}
                        </span>
                        {avance.fechaCompletado && (
                          <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">
                            {avance.fechaCompletado}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleEstadoPiso(avance.id, avance.estado ?? "PENDIENTE")}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors border ${
                            avance.estado === "COMPLETADO"
                              ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                              : "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:hover:bg-green-900/20"
                          }`}
                        >
                          {avance.estado === "COMPLETADO" ? "Deshacer" : "Completar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}