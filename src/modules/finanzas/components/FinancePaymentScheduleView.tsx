"use client";

import { useMemo, useState } from "react";

import { computeUnitPortfolioIndicator, useBackofficeWorkspace } from "@/modules/shared/workspace/store";
import type {
  BackofficeProject,
  BackofficeUnit,
  PaymentEntry,
  PaymentStatus,
} from "@/modules/shared/workspace/types";

type FinancePaymentScheduleViewProps = {
  initialProjectId?: string | null;
};

type ModalState = {
  entryId: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  fileName: string;
};

function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "pagado":
      return "Pagado";
    case "pendiente":
      return "Pendiente";
    case "por_vencer":
      return "Por vencer";
    case "en_mora":
      return "En mora";
    case "parcial":
      return "Parcial";
  }
}

function getPaymentStatusClass(status: PaymentStatus) {
  switch (status) {
    case "pagado":
      return "bg-green-100 text-green-800";
    case "pendiente":
      return "bg-slate-100 text-slate-500";
    case "por_vencer":
      return "bg-orange-100 text-orange-800";
    case "en_mora":
      return "bg-red-100 text-red-800";
    case "parcial":
      return "bg-build-main/10 text-build-main";
  }
}

function getIndicatorLabel(indicator: ReturnType<typeof computeUnitPortfolioIndicator>) {
  switch (indicator) {
    case "al_dia":
      return "Al dia";
    case "en_riesgo":
      return "En riesgo";
    case "en_mora":
      return "En mora";
    case "liquidado":
      return "Liquidado";
  }
}

function buildStateBlob(unit: BackofficeUnit, project: BackofficeProject) {
  const lines = [
    `Proyecto: ${project.name}`,
    `Unidad: ${unit.number}`,
    `Cliente: ${unit.client?.fullName ?? "Sin cliente"}`,
    "",
    ...unit.paymentSchedule.map(
      (entry) =>
        `${entry.concept} | ${entry.dueDate} | S/ ${entry.amount} | ${getPaymentStatusLabel(entry.status)}`,
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
}

function updateScheduleEntry(
  projects: BackofficeProject[],
  projectId: string,
  unitId: string,
  updater: (unit: BackofficeUnit) => BackofficeUnit,
) {
  return projects.map((project) => {
    if (project.id !== projectId) return project;
    return {
      ...project,
      towers: project.towers.map((tower) => ({
        ...tower,
        units: tower.units.map((unit) => (unit.id === unitId ? updater(unit) : unit)),
      })),
    };
  });
}

export default function FinancePaymentScheduleView({
  initialProjectId = null,
}: FinancePaymentScheduleViewProps) {
  const { workspace, isHydrated, updateWorkspace } = useBackofficeWorkspace();
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId ?? "");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);

  const activeProjectId = selectedProjectId || initialProjectId || workspace.projects[0]?.id || "";
  const project = workspace.projects.find((entry) => entry.id === activeProjectId);

  const financedUnits = useMemo(
    () =>
      project?.towers.flatMap((tower) =>
        tower.units.filter((unit) => unit.client && unit.paymentSchedule.length > 0),
      ) ?? [],
    [project],
  );

  const activeSelectedUnitId = selectedUnitId || financedUnits[0]?.id || "";
  const unit = financedUnits.find((entry) => entry.id === activeSelectedUnitId) ?? financedUnits[0];

  function updateUnit(updater: (unit: BackofficeUnit) => BackofficeUnit) {
    if (!unit) return;
    updateWorkspace((current) => ({
      ...current,
      projects: updateScheduleEntry(current.projects, activeProjectId, unit.id, updater),
    }));
  }

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-80 w-full" />
      </div>
    );
  }

  if (!project || !unit) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main">
            Pagos y Cronogramas
          </h2>
          <p className="mt-2 text-base text-slate-600">
            Gestion centralizada de pagos por proyecto y unidad.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-build-main">No hay cronogramas cargados</h2>
          <p className="mt-2 text-sm text-slate-500">
            Aun no existen unidades con cliente y cronograma de pagos en el workspace local.
          </p>
        </div>
      </section>
    );
  }

  const indicator = computeUnitPortfolioIndicator(unit);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main">
          Pagos y Cronogramas
        </h2>
        <p className="mt-2 text-base text-slate-600">
          Gestion centralizada por proyecto, unidad, pagos registrados, vouchers y riesgo de cobranza.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px_220px_220px]">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Proyecto
            </label>
            <select
              value={activeProjectId}
              onChange={(event) => {
                setSelectedProjectId(event.target.value);
                setSelectedUnitId("");
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-build-main outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            >
              {workspace.projects.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Unidad
            </label>
            <select
              value={activeSelectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-build-main outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            >
              {financedUnits.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.number} · {entry.client?.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Modalidad
            </p>
            <p className="mt-2 text-sm font-semibold text-build-main">
              {unit.client?.paymentMode === "credito_hipotecario"
                ? "Credito hipotecario"
                : "Credito directo"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Indicador global
            </p>
            <p className="mt-2 text-sm font-semibold text-build-main">
              {getIndicatorLabel(indicator)}
            </p>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => buildStateBlob(unit, project)}
              className="w-full rounded-xl bg-build-main px-4 py-2.5 text-sm font-bold text-white hover:bg-build-main/90 shadow-sm transition-colors"
            >
              Descargar estado de cuenta
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                {["#", "Concepto", "Fecha vencimiento", "Monto", "Estado", "Acciones"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {unit.paymentSchedule.map((entry, index) => (
                <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-semibold text-build-main">{index}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-build-main">{entry.concept}</td>
                  <td className="px-6 py-4">
                    <input
                      type="date"
                      value={entry.dueDate}
                      disabled={entry.status === "pagado"}
                      onChange={(event) =>
                        updateUnit((currentUnit) => ({
                          ...currentUnit,
                          paymentSchedule: currentUnit.paymentSchedule.map((currentEntry) =>
                            currentEntry.id === entry.id
                              ? { ...currentEntry, dueDate: event.target.value }
                              : currentEntry,
                          ),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={entry.amount}
                      disabled={entry.status === "pagado"}
                      onChange={(event) =>
                        updateUnit((currentUnit) => ({
                          ...currentUnit,
                          paymentSchedule: currentUnit.paymentSchedule.map((currentEntry) =>
                            currentEntry.id === entry.id
                              ? { ...currentEntry, amount: Number(event.target.value) }
                              : currentEntry,
                          ),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${getPaymentStatusClass(entry.status)}`}
                    >
                      {getPaymentStatusLabel(entry.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {entry.voucher ? (
                        <button
                          type="button"
                          onClick={() => buildStateBlob(unit, project)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-build-main hover:bg-slate-100 transition-colors"
                        >
                          Ver boleta
                        </button>
                      ) : null}
                      {entry.status !== "pagado" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setModal({
                              entryId: entry.id,
                              amount: entry.amount,
                              paymentDate: new Date().toISOString().split("T")[0] ?? "",
                              paymentType: "Transferencia",
                              fileName: "",
                            })
                          }
                          className="rounded-lg bg-build-main px-3 py-1.5 text-[12px] font-bold text-white hover:bg-build-main/90 transition-colors shadow-sm"
                        >
                          Registrar pago
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-[20px] font-bold text-build-main">Registrar pago</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Monto
                </label>
                <input
                  type="number"
                  value={modal.amount}
                  onChange={(event) =>
                    setModal((current) =>
                      current ? { ...current, amount: Number(event.target.value) } : current,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent text-build-main"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Fecha de pago
                </label>
                <input
                  type="date"
                  value={modal.paymentDate}
                  onChange={(event) =>
                    setModal((current) =>
                      current ? { ...current, paymentDate: event.target.value } : current,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent text-build-main"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tipo de pago
                </label>
                <input
                  value={modal.paymentType}
                  onChange={(event) =>
                    setModal((current) =>
                      current ? { ...current, paymentType: event.target.value } : current,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent text-build-main"
                />
              </div>
              <label className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-center hover:border-build-accent cursor-pointer transition-colors">
                <span className="text-[12px] font-bold text-slate-500">
                  {modal.fileName || "Adjuntar voucher"}
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setModal((current) => (current ? { ...current, fileName: file.name } : current));
                  }}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-build-main transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const source = unit.paymentSchedule.find((entry) => entry.id === modal.entryId);
                  if (!source) return;

                  updateUnit((currentUnit) => {
                    const nextSchedule: PaymentEntry[] = [];
                    currentUnit.paymentSchedule.forEach((entry) => {
                      if (entry.id !== modal.entryId) {
                        nextSchedule.push(entry);
                        return;
                      }

                      const isPartial = modal.amount > 0 && modal.amount < entry.amount;
                      nextSchedule.push({
                        ...entry,
                        status: isPartial ? "parcial" : "pagado",
                        paidAmount: modal.amount,
                        paymentDate: modal.paymentDate,
                        paymentType: modal.paymentType,
                        voucher: modal.fileName
                          ? {
                              fileName: modal.fileName,
                              fileSizeLabel: "Adjunto",
                              uploadedAt: modal.paymentDate,
                            }
                          : entry.voucher ?? null,
                      });

                      if (isPartial) {
                        nextSchedule.push({
                          ...entry,
                          id: `${entry.id}-saldo-${Date.now()}`,
                          concept: `${entry.concept} - saldo`,
                          amount: entry.amount - modal.amount,
                          paidAmount: 0,
                          paymentDate: "",
                          paymentType: "",
                          status: "pendiente",
                          voucher: null,
                        });
                      }
                    });

                    return {
                      ...currentUnit,
                      paymentSchedule: nextSchedule,
                    };
                  });

                  setModal(null);
                }}
                className="rounded-xl bg-build-main px-6 py-2.5 text-sm font-bold text-white hover:bg-build-main/90 shadow-sm transition-colors"
              >
                Guardar pago
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
