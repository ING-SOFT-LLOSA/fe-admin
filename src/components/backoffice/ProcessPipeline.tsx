"use client";

import { useMemo, useState } from "react";

import {
  ENTREGA_STEPS,
  PROCESS_MODULE_LABELS,
  PROCESS_MODULE_ORDER,
  SANEAMIENTO_STEPS,
  SEPARACION_STEPS,
  getContractSteps,
  getPaymentSteps,
} from "@/lib/backoffice/config";
import type {
  PaymentMode,
  ProcessModuleKey,
  PurchaseProcessState,
  StepProgress,
} from "@/lib/backoffice/types";

type ProcessPipelineProps = {
  process: PurchaseProcessState;
  paymentMode: PaymentMode;
  projectPercent: number;
  onChange: (nextProcess: PurchaseProcessState) => void;
};

function getStageStatus(steps: StepProgress[]) {
  const completed = steps.filter((step) => step.completed).length;
  if (completed === 0) return "pendiente";
  if (completed === steps.length) return "completado";
  return "activo";
}

function getStageBadgeClass(status: string) {
  if (status === "completado") return "bg-green-100 text-green-800";
  if (status === "activo") return "bg-build-main/10 text-build-main";
  return "bg-slate-100 text-slate-500";
}

function syncCurrentModule(process: PurchaseProcessState) {
  const firstPendingIndex = PROCESS_MODULE_ORDER.findIndex((moduleKey) => {
    const stage = process.stages[moduleKey];
    return stage.steps.some((step) => !step.completed);
  });

  return {
    ...process,
    currentModule:
      firstPendingIndex === -1
        ? 6
        : ((firstPendingIndex + 1) as PurchaseProcessState["currentModule"]),
  };
}

export default function ProcessPipeline({
  process,
  paymentMode,
  projectPercent,
  onChange,
}: ProcessPipelineProps) {
  const modules = useMemo(
    () => ({
      separacion: SEPARACION_STEPS,
      contrato: getContractSteps(paymentMode),
      pagos: getPaymentSteps(paymentMode),
      avance: [`Avance global heredado: ${projectPercent}%`],
      entrega: ENTREGA_STEPS,
      saneamiento: SANEAMIENTO_STEPS,
    }),
    [paymentMode, projectPercent],
  );
  const [selectedModule, setSelectedModule] = useState<ProcessModuleKey>(
    PROCESS_MODULE_ORDER[process.currentModule - 1] ?? "separacion",
  );

  const currentStage = process.stages[selectedModule];
  const selectedModuleSteps = modules[selectedModule];

  function updateStage(moduleKey: ProcessModuleKey, updater: (steps: StepProgress[]) => StepProgress[]) {
    const nextProcess = syncCurrentModule({
      ...process,
      stages: {
        ...process.stages,
        [moduleKey]: {
          ...process.stages[moduleKey],
          steps: updater(process.stages[moduleKey].steps),
        },
      },
    });
    onChange(nextProcess);
  }

  function updateModuleNote(moduleKey: ProcessModuleKey, note: string) {
    onChange(
      syncCurrentModule({
        ...process,
        stages: {
          ...process.stages,
          [moduleKey]: {
            ...process.stages[moduleKey],
            internalNote: note,
          },
        },
      }),
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-[20px] font-bold text-build-main">Estado del proceso de compra</h2>
        <p className="mt-1 text-sm text-slate-500">
          Administra etapas, sub-pasos, fechas y notas internas por unidad.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-6">
        {PROCESS_MODULE_ORDER.map((moduleKey, index) => {
          const stage = process.stages[moduleKey];
          const completedCount = stage.steps.filter((step) => step.completed).length;
          const status = getStageStatus(stage.steps);
          return (
            <button
              key={moduleKey}
              type="button"
              onClick={() => setSelectedModule(moduleKey)}
              className={`rounded-xl border p-4 text-left transition-all ${
                selectedModule === moduleKey
                  ? "border-build-main bg-build-main/5 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Etapa {index + 1}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getStageBadgeClass(status)}`}
                >
                  {status}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-build-main">
                {PROCESS_MODULE_LABELS[moduleKey]}
              </h3>
              <p className="mt-2 text-[12px] text-slate-500">
                {completedCount}/{stage.steps.length} sub-pasos completados
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-bold text-build-main">
              {PROCESS_MODULE_LABELS[selectedModule]}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedModule === "avance"
                ? "Esta etapa hereda el avance global configurado desde Obra."
                : "Marca cada sub-paso, agrega fecha y deja notas internas si es necesario."}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-build-main">
            {currentStage.steps.filter((step) => step.completed).length}/{currentStage.steps.length}
          </span>
        </div>

        {selectedModule === "avance" ? (
          <div className="rounded-xl border border-slate-300 bg-white p-4">
            <p className="text-sm font-semibold text-build-main">
              Avance global vigente del proyecto: {projectPercent}%
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              El admin debe ajustar esta informacion desde la ruta de Obra. Aqui solo se refleja
              para la unidad y el expediente del cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedModuleSteps.map((_, index) => {
              const step = currentStage.steps[index] ?? {
                id: `step-${index}`,
                label: selectedModuleSteps[index] ?? `Paso ${index + 1}`,
                completed: false,
                date: "",
                note: "",
              };
              return (
                <div
                  key={step.id}
                  className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 xl:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)]"
                >
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={(event) =>
                        updateStage(selectedModule, (steps) =>
                          steps.map((currentStep) =>
                            currentStep.id === step.id
                              ? {
                                  ...currentStep,
                                  completed: event.target.checked,
                                  date:
                                    event.target.checked && !currentStep.date
                                      ? new Date().toISOString().split("T")[0] ?? ""
                                      : currentStep.date,
                                }
                              : currentStep,
                          ),
                        )
                      }
                      className="mt-0.5 h-4 w-4 accent-build-accent"
                    />
                    <div>
                      <p className="text-sm font-bold text-build-main">{step.label}</p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {step.completed ? "Sub-paso completado" : "Pendiente"}
                      </p>
                    </div>
                  </label>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={step.date}
                      onChange={(event) =>
                        updateStage(selectedModule, (steps) =>
                          steps.map((currentStep) =>
                            currentStep.id === step.id
                              ? { ...currentStep, date: event.target.value }
                              : currentStep,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Nota del sub-paso
                    </label>
                    <textarea
                      rows={2}
                      value={step.note}
                      onChange={(event) =>
                        updateStage(selectedModule, (steps) =>
                          steps.map((currentStep) =>
                            currentStep.id === step.id
                              ? { ...currentStep, note: event.target.value }
                              : currentStep,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Nota general de la etapa
          </label>
          <textarea
            rows={3}
            value={currentStage.internalNote}
            onChange={(event) => updateModuleNote(selectedModule, event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            placeholder="Comentarios internos para el equipo comercial, legal o postventa"
          />
        </div>
      </div>
    </section>
  );
}
