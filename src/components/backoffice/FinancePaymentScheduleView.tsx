"use client";

import { useMemo, useState } from "react";

import { computeUnitPortfolioIndicator, useBackofficeWorkspace } from "@/lib/backoffice/store";
import type {
  BackofficeProject,
  BackofficeUnit,
  PaymentEntry,
  PaymentStatus,
} from "@/lib/backoffice/types";

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
      return "bg-[#d6f0e0] text-[#1c663b]";
    case "pendiente":
      return "bg-[#eeeeef] text-[#41484c]";
    case "por_vencer":
      return "bg-[#fff3e0] text-[#e65100]";
    case "en_mora":
      return "bg-[#ffdad6] text-[#ba1a1a]";
    case "parcial":
      return "bg-[#c2e8ff] text-[#001e2b]";
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
          <h1 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#001b27]">
            Pagos y Cronogramas
          </h1>
          <p className="mt-2 text-base text-[#41484c]">
            Gestion centralizada de pagos por proyecto y unidad.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-[#c1c7cc] bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-[#1a1c1d]">No hay cronogramas cargados</h2>
          <p className="mt-2 text-sm text-[#41484c]">
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
        <h1 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#001b27]">
          Pagos y Cronogramas
        </h1>
        <p className="mt-2 text-base text-[#41484c]">
          Gestion centralizada por proyecto, unidad, pagos registrados, vouchers y riesgo de cobranza.
        </p>
      </div>

      <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px_220px_220px]">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
              Proyecto
            </label>
            <select
              value={activeProjectId}
              onChange={(event) => {
                setSelectedProjectId(event.target.value);
                setSelectedUnitId("");
              }}
              className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
            >
              {workspace.projects.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
              Unidad
            </label>
            <select
              value={activeSelectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value)}
              className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
            >
              {financedUnits.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.number} · {entry.client?.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-[#e2e2e4] bg-[#f9f9fb] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
              Modalidad
            </p>
            <p className="mt-2 text-sm font-semibold text-[#1a1c1d]">
              {unit.client?.paymentMode === "credito_hipotecario"
                ? "Credito hipotecario"
                : "Credito directo"}
            </p>
          </div>

          <div className="rounded-xl border border-[#e2e2e4] bg-[#f9f9fb] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
              Indicador global
            </p>
            <p className="mt-2 text-sm font-semibold text-[#1a1c1d]">
              {getIndicatorLabel(indicator)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => buildStateBlob(unit, project)}
            className="rounded-lg bg-[#023143] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#001b27]"
          >
            Descargar estado de cuenta
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[#e2e2e4] bg-white shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f9f9fb]">
                {["#", "Concepto", "Fecha vencimiento", "Monto", "Estado", "Acciones"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#72787c]"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e2e4]">
              {unit.paymentSchedule.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-[#f9f9fb]">
                  <td className="px-6 py-4 text-sm font-bold text-[#1a1c1d]">{index}</td>
                  <td className="px-6 py-4 text-sm text-[#1a1c1d]">{entry.concept}</td>
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
                      className="rounded-lg border border-[#c1c7cc] bg-white px-3 py-2 text-sm outline-none focus:border-[#023143] disabled:opacity-60"
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
                      className="rounded-lg border border-[#c1c7cc] bg-white px-3 py-2 text-sm outline-none focus:border-[#023143] disabled:opacity-60"
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
                          className="rounded-lg border border-[#e2e2e4] px-3 py-1.5 text-[12px] font-bold text-[#023143] hover:bg-[#f4f3f5]"
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
                          className="rounded-lg bg-[#27a85e] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#1c663b]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-[20px] font-bold text-[#1a1c1d]">Registrar pago</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
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
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
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
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  Tipo de pago
                </label>
                <input
                  value={modal.paymentType}
                  onChange={(event) =>
                    setModal((current) =>
                      current ? { ...current, paymentType: event.target.value } : current,
                    )
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
              <label className="rounded-lg border border-dashed border-[#c1c7cc] px-3 py-3 text-center hover:border-[#023143]">
                <span className="text-[12px] font-bold text-[#1a1c1d]">
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

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-[#e2e2e4] px-4 py-2.5 text-sm font-bold text-[#41484c] hover:bg-[#f4f3f5]"
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
                className="rounded-lg bg-[#023143] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#001b27]"
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
