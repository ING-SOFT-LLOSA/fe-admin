"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchActivosPorProyecto, updateActivo } from "@/modules/inventario/services";
import type { ActivoRequestDTO, ActivoResponseDTO } from "@/modules/inventario/types";

type UnitDetailViewProps = {
  projectId: string;
  unitId: string;
};

export default function UnitDetailView({ projectId, unitId }: UnitDetailViewProps) {
  const [unit, setUnit] = useState<ActivoResponseDTO | null>(null);
  const [form, setForm] = useState<ActivoRequestDTO>({
    nro: "",
    tipo: "",
    areaM2: 0,
    estadoComercial: "DISPONIBLE",
    precio: 0,
    descripcion: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUnit() {
      setIsLoading(true);
      setError("");
      try {
        const activosPage = await fetchActivosPorProyecto(projectId);
        if (!mounted) return;
        const selectedUnit = activosPage.content?.find((entry) => entry.id === unitId) ?? null;
        setUnit(selectedUnit);
        if (selectedUnit) {
          setForm({
            nro: selectedUnit.nro,
            tipo: selectedUnit.tipo,
            areaM2: selectedUnit.areaM2,
            estadoComercial: selectedUnit.estadoComercial,
            precio: selectedUnit.precio,
            descripcion: selectedUnit.descripcion ?? "",
          });
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la unidad.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadUnit();
    return () => {
      mounted = false;
    };
  }, [projectId, unitId]);

  async function handleSave() {
    if (!unit) return;
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await updateActivo(unit.id, form);
      setUnit(updated);
      setMessage("Unidad actualizada correctamente.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar la unidad.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-56 w-full" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-6 py-12 text-center">
        <h1 className="text-lg font-bold text-build-main dark:text-white">Unidad no encontrada</h1>
        {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <Link
        href={`/proyectos/${projectId}/unidades`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-white/60 hover:text-build-main dark:text-white"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Volver a unidades
      </Link>

      {message ? (
        <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm font-bold text-green-800 dark:text-green-400">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-[20px] font-bold text-build-main dark:text-white">Unidad {unit.nro}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
              Información técnica, precio base y estado comercial.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Número</label>
              <input value={form.nro} onChange={(event) => setForm({ ...form, nro: event.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Tipo</label>
              <input value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Área m2</label>
              <input type="number" value={form.areaM2} onChange={(event) => setForm({ ...form, areaM2: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Precio base</label>
              <input type="number" value={form.precio} onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Estado comercial</label>
              <select value={form.estadoComercial} onChange={(event) => setForm({ ...form, estadoComercial: event.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent">
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="SEPARADO">SEPARADO</option>
                <option value="VENDIDO">VENDIDO</option>
                <option value="BLOQUEADO">BLOQUEADO</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Piso</label>
              <input value={unit.pisoId} disabled className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-500 dark:text-white/60" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Características técnicas</label>
              <textarea rows={4} value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-build-main/90 disabled:opacity-60">
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
          <h2 className="text-[20px] font-bold text-build-main dark:text-white">Asignaciones</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
            La asignación y desasignación de clientes pertenece al módulo Clientes y Asignaciones.
          </p>
          <Link href="/clientes" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-build-main px-4 py-2 text-sm font-bold text-white hover:bg-build-main/90">
            <span className="material-symbols-outlined text-[18px]">group</span>
            Ir a asignaciones
          </Link>
        </section>
      </div>
    </section>
  );
}
