"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchActivosPorProyecto, updateActivo, deleteActivo } from "@/modules/inventario/services";
import DialogModal from "@/components/ui/DialogModal";
import type { ActivoRequestDTO, ActivoResponseDTO } from "@/modules/inventario/types";

type UnitDetailViewProps = {
  readonly projectId: string;
  readonly unitId: string;
};

export default function UnitDetailView({ projectId, unitId }: Readonly<UnitDetailViewProps>) {
  const router = useRouter();
  const [unit, setUnit] = useState<ActivoResponseDTO | null>(null);
  const [form, setForm] = useState<ActivoRequestDTO>({
    nro: "",
    tipo: "",
    areaM2: 0,
    areaTechada: 0,
    estadoComercial: "DISPONIBLE",
    precio: 0,
    descripcion: "",
    tieneRecorridoVirtual: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!unit) return;
    setIsDeleting(true);
    setError("");
    setMessage("");
    try {
      await deleteActivo(unit.id);
      router.push(`/proyectos/${projectId}/unidades`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la unidad.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

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
            areaTechada: selectedUnit.areaTechada || selectedUnit.areaM2,
            estadoComercial: selectedUnit.estadoComercial,
            precio: selectedUnit.precio,
            descripcion: selectedUnit.descripcion ?? "",
            tieneRecorridoVirtual: selectedUnit.tieneRecorridoVirtual ?? false,
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

    if (form.areaTechada > form.areaM2) {
      setError("El área techada no puede ser superior al área ocupada.");
      setIsSaving(false);
      return;
    }

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
        <span>Volver a unidades</span>
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="unit-nro" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Número</label>
              <input id="unit-nro" value={form.nro} onChange={(event) => setForm({ ...form, nro: event.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
            </div>
            <div>
              <label htmlFor="unit-tipo" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Tipo</label>
              <input id="unit-tipo" value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
            </div>
            <div>
              <label htmlFor="unit-area" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Ocupada (m²)</label>
              <input id="unit-area" type="number" value={form.areaM2} onChange={(event) => { const val = Number(event.target.value); setForm({ ...form, areaM2: val, areaTechada: val }); }} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
            </div>
            <div>
              <label htmlFor="unit-area-techada" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Área techada</label>
              <input id="unit-area-techada" type="number" value={form.areaTechada} onChange={(event) => setForm({ ...form, areaTechada: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
            </div>
            <div>
              <label htmlFor="unit-precio" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Precio base</label>
              <input id="unit-precio" type="number" value={form.precio} onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
            </div>
            <div>
              <label htmlFor="unit-estado" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Estado comercial</label>
              <select id="unit-estado" value={form.estadoComercial} onChange={(event) => setForm({ ...form, estadoComercial: event.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20">
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="SEPARADO">SEPARADO</option>
                <option value="VENDIDO">VENDIDO</option>
                <option value="BLOQUEADO">BLOQUEADO</option>
              </select>
            </div>
            <div>
              <label htmlFor="unit-piso" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Piso</label>
              <input id="unit-piso" value={unit.pisoId} disabled className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-500 dark:text-white/60" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="unit-descripcion" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Características técnicas</label>
              <textarea id="unit-descripcion" rows={4} value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-arch-gold focus:ring-1 focus:ring-arch-gold/20" />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-4">
              <button
                type="button"
                id="switch-tiene-recorrido-virtual"
                role="switch"
                aria-checked={form.tieneRecorridoVirtual}
                onClick={() => setForm({ ...form, tieneRecorridoVirtual: !form.tieneRecorridoVirtual })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.tieneRecorridoVirtual ? "bg-build-main" : "bg-slate-300 dark:bg-white/20"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.tieneRecorridoVirtual ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <label htmlFor="switch-tiene-recorrido-virtual" className="text-sm font-semibold text-slate-700 dark:text-white/80 cursor-pointer">
                Tiene recorrido virtual
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-6">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
              className="rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-6 py-2.5 text-sm font-bold shadow-sm transition-all"
            >
              Eliminar unidad
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-build-main/90 disabled:opacity-60 transition-all"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </section>

        <div className="space-y-6">
          {unit.linkRecorridoVirtual ? (
            <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
              <h2 className="text-[20px] font-bold text-build-main dark:text-white">Recorrido Virtual</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                <a href={unit.linkRecorridoVirtual} target="_blank" rel="noopener noreferrer" className="text-arch-gold underline break-all">
                  {unit.linkRecorridoVirtual}
                </a>
              </p>
            </section>
          ) : null}
          <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
            <h2 className="text-[20px] font-bold text-build-main dark:text-white">Asignaciones</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
              La asignación y desasignación de clientes pertenece al módulo Clientes y Asignaciones.
            </p>
            <Link href="/clientes" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-build-main px-4 py-2 text-sm font-bold text-white hover:bg-build-main/90">
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Ir a asignaciones</span>
            </Link>
          </section>
        </div>
      </div>

      <DialogModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="¿Eliminar unidad?"
        message={`¿Estás seguro de que deseas eliminar la unidad "${unit.nro}"?\nEsta acción es irreversible y podría fallar si la unidad ya tiene un contrato u otras asociaciones.`}
        confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        type="danger"
      />
    </section>
  );
}
