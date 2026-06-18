"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { fetchActivosPorProyecto } from "@/modules/inventario/services";
import type { ActivoResponseDTO } from "@/modules/inventario/types";

type UnitsOverviewViewProps = {
  projectId: string;
};

function getStatusClass(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "DISPONIBLE") return "bg-[#d6f0e0] text-[#1c663b]";
  if (normalized === "SEPARADO") return "bg-[#fff3e0] text-[#e65100]";
  if (normalized === "VENDIDO" || normalized === "EN_CONTRATO") return "bg-build-main/10 text-build-main dark:text-white";
  if (normalized === "BLOQUEADO" || normalized === "CANCELADO") return "bg-[#ffdad6] text-[#ba1a1a]";
  return "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70";
}

export default function UnitsOverviewView({ projectId }: UnitsOverviewViewProps) {
  const [units, setUnits] = useState<ActivoResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let mounted = true;

    async function loadInventory() {
  
      setIsLoading(true);
      setError("");
      try {
        const activosPage = await fetchActivosPorProyecto(projectId);
  
        if (mounted) setUnits(activosPage.content ?? []);
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
    return units.filter((unit) => {
      const matchesQuery =
        query.length === 0 ||
        unit.nro.toLowerCase().includes(query) ||
        unit.tipo.toLowerCase().includes(query) ||
        unit.descripcion?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || unit.estadoComercial === statusFilter;
      const matchesType = typeFilter === "all" || unit.tipo === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [deferredSearch, statusFilter, typeFilter, units]);

  const unitTypes = Array.from(new Set(units.map((unit) => unit.tipo))).sort((a, b) => a.localeCompare(b));
  const unitStatuses = Array.from(new Set(units.map((unit) => unit.estadoComercial))).sort((a, b) => a.localeCompare(b));

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      ) : null}

      
      <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Buscar unidad
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej. 101, departamento, terraza"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none transition-all focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none transition-all focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20"
            >
              <option value="all">Todos</option>
              {unitTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Estado comercial
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none transition-all focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20"
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
                {["Unidad", "Piso", "Tipo", "Área", "Precio base", "Estado", "Acciones"].map((header) => (
                  <th key={header} className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-white/60">
                    Cargando inventario...
                  </td>
                </tr>
              ) : visibleUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-white/60">
                    No hay unidades para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                visibleUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50 dark:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-build-main dark:text-white">{unit.nro}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/60">{unit.pisoId}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/60">{unit.tipo}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/60">{unit.areaM2} m2</td>
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
                        Abrir detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
