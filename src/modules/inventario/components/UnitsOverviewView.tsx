"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { fetchAllActivosPorProyecto } from "@/modules/inventario/services";
import type { ActivoResponseDTO } from "@/modules/inventario/types";

type UnitsOverviewViewProps = {
  readonly projectId: string;
};

function getStatusClass(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "DISPONIBLE") return "bg-[#d6f0e0] text-[#1c663b]";
  if (normalized === "SEPARADO") return "bg-[#fff3e0] text-[#e65100]";
  if (normalized === "VENDIDO" || normalized === "EN_CONTRATO") return "bg-build-main/10 text-build-main dark:text-white";
  if (normalized === "BLOQUEADO" || normalized === "CANCELADO") return "bg-[#ffdad6] text-[#ba1a1a]";
  return "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70";
}

const TYPE_ORDER: Record<string, number> = { DEPARTAMENTO: 1, COCHERA: 2, DEPOSITO: 3 };

export default function UnitsOverviewView({ projectId }: Readonly<UnitsOverviewViewProps>) {
  const [units, setUnits] = useState<ActivoResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [towerFilter, setTowerFilter] = useState("all");

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, statusFilter, typeFilter, towerFilter]);

  useEffect(() => {
    let mounted = true;

    async function loadInventory() {
  
      setIsLoading(true);
      setError("");
      try {
        const activos = await fetchAllActivosPorProyecto(projectId);

        if (mounted) setUnits(activos);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el inventario.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadInventory();
    return () => {
      mounted = false;
    };
  }, [projectId]);


  const visibleUnits = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return units
      .filter((unit) => {
        const matchesQuery =
          query.length === 0 ||
          unit.nro.toLowerCase().includes(query) ||
          unit.tipo.toLowerCase().includes(query) ||
          unit.descripcion?.toLowerCase().includes(query);
        const matchesStatus = statusFilter === "all" || unit.estadoComercial === statusFilter;
        const matchesType = typeFilter === "all" || unit.tipo === typeFilter;
        const matchesTower = towerFilter === "all" || unit.torreNombre === towerFilter;
        return matchesQuery && matchesStatus && matchesType && matchesTower;
      })
      .sort((a, b) => {
        const orderA = TYPE_ORDER[a.tipo] ?? 99;
        const orderB = TYPE_ORDER[b.tipo] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.nro.localeCompare(b.nro, undefined, { numeric: true });
      });
  }, [deferredSearch, statusFilter, typeFilter, towerFilter, units]);

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleUnits.slice(start, start + pageSize);
  }, [visibleUnits, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(visibleUnits.length / pageSize));

  const unitTypes = Array.from(new Set(units.map((unit) => unit.tipo))).sort((a, b) => a.localeCompare(b));
  const unitStatuses = Array.from(new Set(units.map((unit) => unit.estadoComercial))).sort((a, b) => a.localeCompare(b));
  const unitTowers = useMemo(() => {
    return Array.from(new Set(units.map((unit) => unit.torreNombre).filter(Boolean))) as string[];
  }, [units]);

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      ) : null}

      
      <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
          <div>
            <label htmlFor="units-search" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Buscar unidad
            </label>
            <input
              id="units-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej. 101, departamento, terraza"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none transition-all focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 dark:text-white"
            />
          </div>
          {unitTowers.length > 0 && (
            <div>
              <label htmlFor="units-tower-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                Torre
              </label>
              <select
                id="units-tower-filter"
                value={towerFilter}
                onChange={(event) => setTowerFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none transition-all focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 dark:text-white"
              >
                <option value="all">Todas</option>
                {unitTowers.map((tower) => (
                  <option key={tower} value={tower}>{tower}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="units-type-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Tipo
            </label>
            <select
              id="units-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none transition-all focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 dark:text-white"
            >
              <option value="all">Todos</option>
              {unitTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="units-status-filter" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Estado comercial
            </label>
            <select
              id="units-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none transition-all focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20 dark:text-white"
            >
              <option value="all">Todos</option>
              {unitStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5">
                {["Unidad", "Torre", "Piso", "Tipo", "Ocupada (m²)", "Techada", "Precio base", "Estado", "Acciones"].map((header) => (
                  <th key={header} className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {(() => {
                if (isLoading) {
                  return (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-white/60">
                        Cargando inventario...
                      </td>
                    </tr>
                  );
                }
                if (visibleUnits.length === 0) {
                  return (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-white/60">
                        No hay unidades para los filtros seleccionados.
                      </td>
                    </tr>
                  );
                }
                return paginatedUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50 dark:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-build-main dark:text-white">{unit.nro}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/60">{unit.torreNombre ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/60">{unit.nroPiso ?? unit.pisoId}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/60">{unit.tipo}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/60">{unit.areaM2} m2</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/60">{unit.areaTechada} m2</td>
                    <td className="px-6 py-4 text-sm font-semibold text-build-main dark:text-white">
                      S/ {unit.precio.toLocaleString("es-PE")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${getStatusClass(unit.estadoComercial)}`}>
                        {unit.estadoComercial}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/proyectos/${projectId}/unidades/${unit.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-build-main px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-build-main/90"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        <span>Abrir detalle</span>
                      </Link>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginación */}
        {!isLoading && visibleUnits.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1 text-xs outline-none focus:border-arch-gold text-slate-700 dark:text-white"
              >
                {[10, 15, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>registros por página</span>
              <span className="ml-2 border-l border-slate-200 dark:border-white/10 pl-3">
                Mostrando {Math.min(visibleUnits.length, (currentPage - 1) * pageSize + 1)}-{Math.min(visibleUnits.length, currentPage * pageSize)} de {visibleUnits.length} unidades
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {/* Páginas numéricas */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Mostrar primera, última, y vecinas de la actual
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, arr) => {
                  const showDotsBefore = page > 1 && arr[index - 1] !== page - 1;
                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showDotsBefore && (
                        <span className="px-1 text-slate-400 dark:text-white/30 text-xs">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? "bg-build-main text-white shadow-sm"
                            : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
