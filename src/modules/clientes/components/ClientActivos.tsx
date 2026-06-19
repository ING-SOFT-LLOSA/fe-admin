"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchActivosPorUsuario,
  fetchContratoActivo,
  type ActivoUsuarioDTO,
} from "@/lib/api/expedientes";
import { fetchProyectos, type Proyecto } from "@/lib/api/proyectos";
import { ApiError } from "@/lib/api/http";

type ClientActivosProps = {
  clientId: number;
  refreshKey?: number;
};

function getUnitIcon(tipo: string): string {
  switch (tipo) {
    case "ESTACIONAMIENTO":
      return "directions_car";
    case "DEPOSITO":
      return "inventory_2";
    default:
      return "apartment";
  }
}

function getUnitLabel(tipo: string): string {
  switch (tipo) {
    case "ESTACIONAMIENTO":
      return "Cochera";
    case "DEPOSITO":
      return "Depósito";
    case "DEPARTAMENTO":
      return "Departamento";
    default:
      return tipo;
  }
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

function formatPrice(precio: number): string {
  return `S/ ${precio.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ClientActivos({ clientId, refreshKey = 0 }: ClientActivosProps) {
  const router = useRouter();
  const [activos, setActivos] = useState<ActivoUsuarioDTO[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingLegal, setLoadingLegal] = useState<Record<string, boolean>>({});

  const handleVerExpediente = async (activoId: string) => {
    setLoadingLegal((prev) => ({ ...prev, [activoId]: true }));
    try {
      const contrato = await fetchContratoActivo(activoId);
      if (contrato?.uuidUsuarioActivo) {
        router.push(`/legal/${contrato.uuidUsuarioActivo}`);
      } else {
        alert("No se encontró un expediente legal asociado para esta propiedad.");
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 404) {
        alert("No se encontró un expediente legal asociado para esta propiedad.");
      } else {
        alert("Error al cargar el expediente legal.");
      }
    } finally {
      setLoadingLegal((prev) => ({ ...prev, [activoId]: false }));
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);

      Promise.all([
        fetchActivosPorUsuario(clientId),
        fetchProyectos().catch(() => [])
      ])
        .then(([activosData, proyectosData]) => {
          if (!mounted) return;
          setActivos(activosData || []);
          setProyectos(proyectosData || []);
        })
        .catch((err) => {
          if (!mounted) return;
          setError(err instanceof Error ? err.message : "No se pudieron cargar los activos.");
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    });

    return () => {
      mounted = false;
    };
  }, [clientId, refreshKey]);

  // Group by project
  const grouped = activos.reduce<Record<string, ActivoUsuarioDTO[]>>((acc, activo) => {
    const project = activo.proyectoNombre || "Sin proyecto";
    if (!acc[project]) acc[project] = [];
    acc[project].push(activo);
    return acc;
  }, {});

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-build-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-arch-gold">domain</span>
          Propiedades del Cliente
        </h3>
        {!loading && (
          <span className="text-xs font-bold text-slate-400 dark:text-white/40 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full">
            {activos.length} {activos.length === 1 ? "activo" : "activos"}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500 dark:text-white/50">
          <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm font-medium">Cargando activos...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && activos.length === 0 && (
        <div className="text-center py-10 text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">home_work</span>
          <p className="text-sm font-medium">No tiene propiedades vinculadas.</p>
          <p className="text-xs mt-1 opacity-60">Asigna una propiedad desde el wizard de asignación.</p>
        </div>
      )}

      {/* Activos grouped by project */}
      {!loading && !error && activos.length > 0 && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([projectName, projectActivos]) => (
            <div key={projectName} className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 p-4">
              {/* Project header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-arch-gold text-[18px]">location_city</span>
                <h4 className="text-xs font-bold text-build-main dark:text-white uppercase tracking-wide">{projectName}</h4>
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 bg-white dark:bg-white/10 px-2 py-0.5 rounded-full ml-auto">
                  {projectActivos.length} {projectActivos.length === 1 ? "unidad" : "unidades"}
                </span>
              </div>

              {/* Activo cards */}
              <div className="space-y-2">
                {projectActivos.map((activo) => {
                  const estadoBadge = getEstadoBadge(activo.estadoComercial);
                  const matchedProyecto = proyectos.find(
                    (p) => p.nombre.toLowerCase().trim() === projectName.toLowerCase().trim()
                  );
                  const proyectoId = matchedProyecto?.id;
                  return (
                    <div
                      key={activo.id}
                      className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl p-4 hover:border-build-accent hover:shadow-sm transition-all group"
                    >
                      {/* Top row: unit info + badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-build-bg dark:bg-white/10 flex items-center justify-center text-build-main dark:text-white group-hover:bg-build-accent/10 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">{getUnitIcon(activo.tipo)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-build-main dark:text-white">
                              {getUnitLabel(activo.tipo)} {activo.nro}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-white/50">
                              {activo.torreNombre} · Piso {activo.nroPiso} · {activo.areaM2} m² · Tech. {activo.areaTechada} m²
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${estadoBadge.bg} ${estadoBadge.text}`}>
                          {estadoBadge.label}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-white/50 mb-3 pl-[52px]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">payments</span>
                          {formatPrice(activo.precio)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">straighten</span>
                          {activo.areaM2} m²
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">roofing</span>
                          Tech. {activo.areaTechada} m²
                        </span>
                      </div>

                      {/* Action links */}
                      <div className="flex items-center gap-2 pl-[52px] pt-2 border-t border-slate-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => handleVerExpediente(activo.id)}
                          disabled={loadingLegal[activo.id]}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-arch-gold hover:text-build-main dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-build-bg dark:hover:bg-white/10 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[15px]">gavel</span>
                          {loadingLegal[activo.id] ? "Cargando..." : "Ver expediente legal"}
                        </button>
                        <Link
                          href={proyectoId ? `/proyectos/${proyectoId}/unidades/${activo.id}` : `/proyectos`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-white/50 hover:text-build-main dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                          Ver detalle de unidad
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
