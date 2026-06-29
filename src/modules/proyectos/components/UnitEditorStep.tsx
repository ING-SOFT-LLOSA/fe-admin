"use client";

import { useState, useId } from "react";
import type { TorreData, ActivoData, PisoData } from "@/modules/proyectos/utils/wizard-logic";

type UnitEditorStepProps = {
  readonly torres: TorreData[];
  readonly onBack: () => void;
  readonly onSubmit: (torres: TorreData[]) => void;
};

type TabType = "DEPARTAMENTO" | "COCHERA" | "DEPOSITO";

const TAB_INFO: Record<TabType, { label: string; icon: string }> = {
  DEPARTAMENTO: { label: "Departamentos", icon: "apartment" },
  COCHERA: { label: "Cocheras", icon: "directions_car" },
  DEPOSITO: { label: "Depósitos", icon: "inventory_2" },
};

function UnitCard({
  activo,
  onEdit,
  onDelete,
}: Readonly<{
  readonly activo: ActivoData;
  readonly onEdit: (field: keyof ActivoData, value: string | number) => void;
  readonly onDelete: () => void;
}>) {
  const [editing, setEditing] = useState(false);
  const areaId = useId();
  const areaTechadaId = useId();
  const precioId = useId();

  const isAreaInvalid = activo.areaTechada > activo.areaM2;

  return (
    <div className="rounded-lg border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 p-3">
      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-build-main dark:text-white text-sm">{activo.nro}</p>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isAreaInvalid}
              className="rounded bg-build-main px-3 py-1 text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Listo
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor={areaId} className="text-[10px] font-semibold text-slate-400">Ocupada (m²)</label>
              <input
                id={areaId}
                type="number"
                value={activo.areaM2}
                onChange={(e) => onEdit("areaM2", Number(e.target.value))}
                className="w-full rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 py-1 text-xs outline-none focus:border-build-accent"
              />
            </div>
            <div>
              <label htmlFor={areaTechadaId} className="text-[10px] font-semibold text-slate-400">Tech. (m²)</label>
              <input
                id={areaTechadaId}
                type="number"
                value={activo.areaTechada}
                onChange={(e) => onEdit("areaTechada", Number(e.target.value))}
                className="w-full rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 py-1 text-xs outline-none focus:border-build-accent"
              />
            </div>
            <div>
              <label htmlFor={precioId} className="text-[10px] font-semibold text-slate-400">Precio S/</label>
              <input
                id={precioId}
                type="number"
                value={activo.precio}
                onChange={(e) => onEdit("precio", Number(e.target.value))}
                className="w-full rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 py-1 text-xs outline-none focus:border-build-accent"
              />
            </div>
          </div>
          {isAreaInvalid && (
            <p className="text-[10px] font-semibold text-red-500 mt-1 leading-tight">
              El área techada no puede ser superior al área ocupada.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-build-main dark:text-white text-sm">{activo.nro}</p>
            <p className="text-xs text-slate-500 truncate">
              {activo.areaM2} m² · Tech {activo.areaTechada} m² · S/ {activo.precio.toLocaleString("es-PE")}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (activo.areaTechada === 0) {
                  onEdit("areaTechada", activo.areaM2);
                }
                setEditing(true);
              }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-build-accent"
              title="Editar"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Eliminar"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PisoSection({
  piso,
  pIdx,
  tIdx,
  onEdit,
  onDeleteClick,
  onAdd,
  onDeletePisoClick,
  onDeleteUnitsByTypeClick,
}: Readonly<{
  piso: PisoData;
  pIdx: number;
  tIdx: number;
  onEdit: (tIdx: number, pIdx: number, aIdx: number, field: keyof ActivoData, value: string | number) => void;
  onDeleteClick: (tIdx: number, pIdx: number, aIdx: number) => void;
  onAdd: (tIdx: number, pIdx: number, tipo: TabType) => void;
  onDeletePisoClick: (tIdx: number, pIdx: number) => void;
  onDeleteUnitsByTypeClick: (tIdx: number, pIdx: number, tipo: TabType) => void;
}>) {
  const grouped = piso.activos.reduce((acc, a) => {
    if (!acc[a.tipo]) acc[a.tipo] = [];
    acc[a.tipo].push(a);
    return acc;
  }, {} as Record<string, ActivoData[]>);

  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center gap-1.5 bg-slate-50/50 dark:bg-white/[0.02] px-6 py-2 text-xs font-semibold text-slate-600 dark:text-white/70">
        <span className="material-symbols-outlined text-[15px] text-slate-400">layers</span>
        Piso {piso.nroPiso}
        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-slate-400">{piso.activos.length} uds.</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDeletePisoClick(tIdx, pIdx);
            }}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Eliminar piso completo"
          >
            <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
          </button>
        </div>
        <span className="material-symbols-outlined text-[15px] text-slate-400 transition-transform group-open:rotate-180">expand_more</span>
      </summary>
      <div className="px-6 py-3 space-y-3">
        {(Object.keys(TAB_INFO) as TabType[]).map((tipo) => {
          const units = grouped[tipo] || [];
          const info = TAB_INFO[tipo];
          return (
            <div key={tipo}>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">{info.icon}</span>
                  {info.label} ({units.length})
                </p>
                {units.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onDeleteUnitsByTypeClick(tIdx, pIdx, tipo)}
                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                    title={`Eliminar todos los ${info.label.toLowerCase()}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">delete_outline</span>
                    <span>Borrar todos</span>
                  </button>
                )}
              </div>
              {units.length > 0 && (
                <div className="mb-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {units.map((activo) => {
                    const actualIdx = piso.activos.indexOf(activo);
                    return (
                      <UnitCard
                        key={`${tIdx}-${pIdx}-${actualIdx}`}
                        activo={activo}
                        onEdit={(field, value) => onEdit(tIdx, pIdx, actualIdx, field, value)}
                        onDelete={() => onDeleteClick(tIdx, pIdx, actualIdx)}
                      />
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => onAdd(tIdx, pIdx, tipo)}
                className="flex items-center gap-1 rounded-lg border border-dashed border-slate-300 dark:border-white/20 px-3 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-white/50 transition-colors hover:border-build-accent hover:text-build-accent"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Agregar {info.label.toLowerCase()}
              </button>
            </div>
          );
        })}
      </div>
    </details>
  );
}

export default function UnitEditorStep({ torres: initialTorres, onBack, onSubmit }: Readonly<UnitEditorStepProps>) {
  const [torres, setTorres] = useState<TorreData[]>(() => structuredClone(initialTorres));
  const [confirmDelete, setConfirmDelete] = useState<{ tIdx: number; pIdx: number; aIdx: number } | null>(null);
  const [confirmDeletePiso, setConfirmDeletePiso] = useState<{ tIdx: number; pIdx: number } | null>(null);
  const [confirmDeleteUnitsType, setConfirmDeleteUnitsType] = useState<{ tIdx: number; pIdx: number; tipo: TabType } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (tIdx: number, pIdx: number, aIdx: number, field: keyof ActivoData, value: string | number) => {
    setTorres((prev) => {
      const next = structuredClone(prev);
      const activo = next[tIdx].pisos[pIdx].activos[aIdx] as unknown as Record<string, string | number>;
      activo[field as string] = value;
      if (field === "areaM2") {
        activo.areaTechada = value;
      }
      return next;
    });
  };

  const handleDelete = (tIdx: number, pIdx: number, aIdx: number) => {
    setTorres((prev) => {
      const next = structuredClone(prev);
      next[tIdx].pisos[pIdx].activos.splice(aIdx, 1);
      return next;
    });
    setConfirmDelete(null);
  };

  const handleDeletePiso = (tIdx: number, pIdx: number) => {
    setTorres((prev) => {
      const next = structuredClone(prev);
      next[tIdx].pisos.splice(pIdx, 1);
      return next;
    });
    setConfirmDeletePiso(null);
  };

  const handleDeleteUnitsByType = (tIdx: number, pIdx: number, tipo: TabType) => {
    setTorres((prev) => {
      const next = structuredClone(prev);
      const piso = next[tIdx].pisos[pIdx];
      piso.activos = piso.activos.filter((a) => a.tipo !== tipo);
      return next;
    });
    setConfirmDeleteUnitsType(null);
  };

  const handleAdd = (tIdx: number, pIdx: number, tipo: TabType) => {
    setTorres((prev) => {
      const next = structuredClone(prev);
      const piso = next[tIdx].pisos[pIdx];
      const existing = piso.activos.filter((a) => a.tipo === tipo);
      const maxSeq = existing.reduce((max, a) => {
        const s = Number.parseInt(a.nro.slice(-2), 10);
        return Math.max(max, Number.isNaN(s) ? 0 : s);
      }, 0);
      const nextSeq = maxSeq + 1;
      const seqStr = nextSeq.toString().padStart(2, "0");
      const pisoNro = piso.nroPiso;

      const defaults: Record<TabType, Omit<ActivoData, "nro" | "tipo">> = {
        DEPARTAMENTO: { areaM2: 70, areaTechada: 70, precio: 200000, estadoComercial: "DISPONIBLE", descripcion: `Dpto en ${next[tIdx].nombre}, Piso ${pisoNro}` },
        COCHERA: { areaM2: 12, areaTechada: 12, precio: 15000, estadoComercial: "DISPONIBLE", descripcion: `Estacionamiento en ${next[tIdx].nombre}, Piso ${pisoNro}` },
        DEPOSITO: { areaM2: 5, areaTechada: 5, precio: 5000, estadoComercial: "DISPONIBLE", descripcion: `Depósito en ${next[tIdx].nombre}, Piso ${pisoNro}` },
      };

      let nro = "";
      if (tipo === "DEPARTAMENTO") {
        nro = `${pisoNro}${seqStr}`;
      } else if (tipo === "COCHERA") {
        nro = `E-${pisoNro}${seqStr}`;
      } else {
        nro = `D-${pisoNro}${seqStr}`;
      }

      piso.activos.push({ nro, tipo, ...defaults[tipo] });
      return next;
    });
  };

  const totalActivos = torres.reduce((sum, t) => sum + t.pisos.reduce((s, p) => s + p.activos.length, 0), 0);

  const handleCreateProject = () => {
    setError(null);
    for (const torre of torres) {
      for (const piso of torre.pisos) {
        for (const activo of piso.activos) {
          if (activo.areaTechada > activo.areaM2) {
            setError(`Error en ${torre.nombre}, Piso ${piso.nroPiso}, Unidad ${activo.nro}: El área techada no puede ser superior al área ocupada.`);
            return;
          }
        }
      }
    }
    onSubmit(torres);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 text-center">
        <p className="text-sm text-slate-600 dark:text-white/70">
          Total de unidades: <span className="font-bold text-build-main dark:text-white">{totalActivos}</span>
        </p>
      </div>

      <div className="space-y-4">
        {torres.map((torre, tIdx) => (
          <details key={torre.nombre} className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden" open={tIdx === 0}>
            <summary className="flex cursor-pointer items-center gap-2 bg-slate-100 dark:bg-white/10 px-5 py-3 text-sm font-bold text-build-main dark:text-white">
              <span className="material-symbols-outlined text-[18px] text-slate-400">account_balance</span>
              {torre.nombre}
              <span className="ml-auto text-xs font-normal text-slate-400">{torre.pisos.length} pisos · {torre.pisos.reduce((s, p) => s + p.activos.length, 0)} uds.</span>
              <span className="material-symbols-outlined text-[18px] text-slate-400 transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {torre.pisos.map((piso, pIdx) => (
                <PisoSection
                  key={`${tIdx}-${pIdx}`}
                  piso={piso}
                  pIdx={pIdx}
                  tIdx={tIdx}
                  onEdit={handleEdit}
                  onDeleteClick={(t, p, a) => setConfirmDelete({ tIdx: t, pIdx: p, aIdx: a })}
                  onAdd={handleAdd}
                  onDeletePisoClick={(t, p) => setConfirmDeletePiso({ tIdx: t, pIdx: p })}
                  onDeleteUnitsByTypeClick={(t, p, tipo) => setConfirmDeleteUnitsType({ tIdx: t, pIdx: p, tipo })}
                />
              ))}
            </div>
          </details>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-white/70 transition-colors hover:bg-slate-100 dark:bg-white/10"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Volver</span>
        </button>
        <button
          type="button"
          onClick={handleCreateProject}
          className="flex items-center gap-2 rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-arch-gold"
        >
          <span className="material-symbols-outlined text-[18px]">check</span>
          <span>Crear proyecto</span>
        </button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
            <p className="text-sm text-slate-600 dark:text-white/70">
              ¿Eliminar la unidad <strong className="text-build-main dark:text-white">{torres[confirmDelete.tIdx]?.pisos[confirmDelete.pIdx]?.activos[confirmDelete.aIdx]?.nro}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete.tIdx, confirmDelete.pIdx, confirmDelete.aIdx)}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeletePiso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
            <p className="text-sm text-slate-600 dark:text-white/70">
              ¿Eliminar el <strong className="text-build-main dark:text-white">Piso {torres[confirmDeletePiso.tIdx]?.pisos[confirmDeletePiso.pIdx]?.nroPiso}</strong> completo de {torres[confirmDeletePiso.tIdx]?.nombre} con todas sus unidades?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeletePiso(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePiso(confirmDeletePiso.tIdx, confirmDeletePiso.pIdx)}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                Eliminar Piso
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteUnitsType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
            <p className="text-sm text-slate-600 dark:text-white/70">
              ¿Eliminar todos los/las <strong className="text-build-main dark:text-white">{TAB_INFO[confirmDeleteUnitsType.tipo].label.toLowerCase()}</strong> del Piso {torres[confirmDeleteUnitsType.tIdx]?.pisos[confirmDeleteUnitsType.pIdx]?.nroPiso} de {torres[confirmDeleteUnitsType.tIdx]?.nombre}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteUnitsType(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUnitsByType(confirmDeleteUnitsType.tIdx, confirmDeleteUnitsType.pIdx, confirmDeleteUnitsType.tipo)}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                Eliminar Todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
