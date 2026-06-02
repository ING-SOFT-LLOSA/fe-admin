"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMisActivos } from "@/lib/api/expedientes";
import type { ActivoResponseDTO } from "@/lib/api/proyectos";

export default function MisActivosPage() {
  const [activos, setActivos] = useState<ActivoResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const data = await fetchMisActivos();
        if (mounted) setActivos(data);
      } catch (e) {
        if (mounted) setError("No se pudieron cargar sus propiedades.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadData();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-build-main dark:text-white">Mis Propiedades</h1>
          <p className="text-slate-500 dark:text-white/60 mt-2">Bienvenido a tu portal. Aquí puedes ver el estado de tus unidades.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 dark:text-white/60">Cargando propiedades...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">{error}</div>
      ) : activos.length === 0 ? (
        <div className="py-12 text-center text-slate-500 dark:text-white/60">No tiene propiedades asignadas actualmente.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activos.map(activo => (
            <div key={activo.id} className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group cursor-pointer">
              <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-slate-300">apartment</span>
                <div className="absolute top-4 right-4 bg-white dark:bg-white/5/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-build-main dark:text-white shadow-sm">
                  {activo.tipo}
                </div>
              </div>
              
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-1">Proyecto Vinculado</p>
                <h2 className="text-2xl font-bold text-build-main dark:text-white mb-4">Unidad {activo.nro}</h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500 dark:text-white/60">Área m2</span>
                      <span className="text-build-accent">{activo.areaM2} m²</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/50">payments</span>
                      <span className="text-sm font-medium text-slate-600 dark:text-white/70">S/ {activo.precio.toLocaleString("es-PE")}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                      {activo.estadoComercial}
                    </span>
                  </div>
                </div>

                <button className="w-full mt-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-build-main dark:text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 border border-slate-200 dark:border-white/10">
                  Ver detalles
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
