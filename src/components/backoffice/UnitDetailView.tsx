"use client";

import Link from "next/link";
import { useState } from "react";

import DocumentManager from "@/components/backoffice/DocumentManager";
import ProcessPipeline from "@/components/backoffice/ProcessPipeline";
import ProjectSectionNav from "@/components/backoffice/ProjectSectionNav";
import { PROCESS_MODULE_LABELS, PROCESS_MODULE_ORDER, UNIT_DOCUMENT_DEFINITIONS } from "@/lib/backoffice/config";
import { computeProjectGlobalPercent, useBackofficeWorkspace } from "@/lib/backoffice/store";
import type { BackofficeProject, BackofficeUnit, ProcessModuleKey, UnitClientAssignment } from "@/lib/backoffice/types";

type UnitDetailViewProps = {
  projectId: string;
  unitId: string;
};

const EMPTY_CLIENT: UnitClientAssignment = {
  clientId: -1,
  fullName: "",
  dni: "",
  email: "",
  phone: "",
  separationDate: "",
  paymentMode: "credito_directo",
};

type ClientAssignmentFormProps = {
  unit: BackofficeUnit;
  onSave: (client: UnitClientAssignment) => void;
  onUnlink: () => void;
};

function ClientAssignmentForm({ unit, onSave, onUnlink }: ClientAssignmentFormProps) {
  const [draftClient, setDraftClient] = useState<UnitClientAssignment>(
    unit.client ?? EMPTY_CLIENT,
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
          Nombre completo
        </label>
        <input
          value={draftClient.fullName}
          onChange={(event) =>
            setDraftClient((current) => ({ ...current, fullName: event.target.value }))
          }
          className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
            DNI
          </label>
          <input
            value={draftClient.dni}
            onChange={(event) =>
              setDraftClient((current) => ({ ...current, dni: event.target.value }))
            }
            className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
            Fecha de separacion
          </label>
          <input
            type="date"
            value={draftClient.separationDate}
            onChange={(event) =>
              setDraftClient((current) => ({
                ...current,
                separationDate: event.target.value,
              }))
            }
            className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
            Correo
          </label>
          <input
            type="email"
            value={draftClient.email}
            onChange={(event) =>
              setDraftClient((current) => ({ ...current, email: event.target.value }))
            }
            className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
            Telefono
          </label>
          <input
            value={draftClient.phone}
            onChange={(event) =>
              setDraftClient((current) => ({ ...current, phone: event.target.value }))
            }
            className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
          Modalidad de pago
        </label>
        <select
          value={draftClient.paymentMode}
          onChange={(event) =>
            setDraftClient((current) => ({
              ...current,
              paymentMode: event.target.value as UnitClientAssignment["paymentMode"],
            }))
          }
          className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
        >
          <option value="credito_directo">Credito directo</option>
          <option value="credito_hipotecario">Credito hipotecario</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onSave(draftClient)}
          className="flex-1 rounded-lg bg-[#023143] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#001b27]"
        >
          Guardar cliente
        </button>
        {unit.client ? (
          <button
            type="button"
            onClick={onUnlink}
            className="rounded-lg border border-[#ba1a1a]/20 px-4 py-2.5 text-sm font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/40"
          >
            Desvincular
          </button>
        ) : null}
      </div>
    </div>
  );
}

function updateProjectUnit(
  projects: BackofficeProject[],
  projectId: string,
  unitId: string,
  updater: (unit: BackofficeUnit, project: BackofficeProject) => BackofficeUnit,
) {
  return projects.map((project) => {
    if (project.id !== projectId) return project;
    return {
      ...project,
      towers: project.towers.map((tower) => ({
        ...tower,
        units: tower.units.map((unit) => (unit.id === unitId ? updater(unit, project) : unit)),
      })),
    };
  });
}

export default function UnitDetailView({ projectId, unitId }: UnitDetailViewProps) {
  const { workspace, isHydrated, updateWorkspace } = useBackofficeWorkspace();
  const project = workspace.projects.find((entry) => entry.id === projectId);
  const unit = project?.towers.flatMap((tower) => tower.units).find((entry) => entry.id === unitId);

  const inheritedProjectDocs =
    project?.documents.filter((document) => document.visibleToClient) ?? [];

  function updateUnit(updater: (currentUnit: BackofficeUnit, currentProject: BackofficeProject) => BackofficeUnit) {
    updateWorkspace((current) => ({
      ...current,
      projects: updateProjectUnit(current.projects, projectId, unitId, updater),
    }));
  }

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-56 w-full" />
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  if (!project || !unit) {
    return (
      <div className="rounded-xl border border-dashed border-[#c1c7cc] bg-white px-6 py-12 text-center">
        <h1 className="text-lg font-bold text-[#1a1c1d]">Unidad no encontrada</h1>
      </div>
    );
  }

  const projectPercent = computeProjectGlobalPercent(project);
  const currentStageLabel = PROCESS_MODULE_LABELS[PROCESS_MODULE_ORDER[unit.process.currentModule - 1] ?? "separacion"];

  return (
    <section className="space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}/unidades`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#023143] hover:text-[#001b27]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a unidades
        </Link>
        <h1 className="mt-3 text-[34px] font-bold tracking-[-0.02em] text-[#1a1c1d]">
          Unidad {unit.number}
        </h1>
        <p className="mt-2 text-sm text-[#41484c]">
          Gestion administrativa completa por unidad, cliente y documentos del proceso.
        </p>
      </div>

      <ProjectSectionNav projectId={projectId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_420px]">
        <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-bold text-[#1a1c1d]">Datos de la unidad</h2>
              <p className="mt-1 text-sm text-[#41484c]">
                Proyecto, torre, metraje, tipologia y precio comercial.
              </p>
            </div>
            <span className="rounded-full bg-[#c2e8ff] px-3 py-1 text-[12px] font-bold text-[#001e2b]">
              {currentStageLabel}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Proyecto", value: project.name },
              { label: "Torre", value: project.towers.find((tower) => tower.id === unit.towerId)?.name ?? "-" },
              { label: "Numero", value: unit.number },
              { label: "Piso", value: String(unit.floor) },
              { label: "Area total", value: `${unit.area} m2` },
              { label: "Area techada", value: `${unit.builtArea} m2` },
              { label: "Area libre", value: `${unit.freeArea} m2` },
              { label: "Tipologia", value: unit.typology },
              { label: "Precio", value: `S/ ${unit.salePrice.toLocaleString("es-PE")}` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#e2e2e4] bg-[#f9f9fb] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1a1c1d]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
          <div className="mb-5">
            <h2 className="text-[20px] font-bold text-[#1a1c1d]">Cliente asignado</h2>
            <p className="mt-1 text-sm text-[#41484c]">
              Reasigna o desvincula la unidad sin salir de la vista.
            </p>
          </div>

          <ClientAssignmentForm
            key={`${unit.id}-${unit.client?.clientId ?? "new"}`}
            unit={unit}
            onSave={(nextClient) =>
              updateUnit((currentUnit) => ({
                ...currentUnit,
                client: { ...nextClient },
                status:
                  nextClient.paymentMode === "credito_hipotecario"
                    ? "en_contrato"
                    : "separado",
              }))
            }
            onUnlink={() =>
              updateUnit((currentUnit) => ({
                ...currentUnit,
                client: null,
                status: "disponible",
              }))
            }
          />
        </section>
      </div>

      <ProcessPipeline
        process={unit.process}
        paymentMode={unit.client?.paymentMode ?? "credito_directo"}
        projectPercent={projectPercent}
        onChange={(nextProcess) =>
          updateUnit((currentUnit) => ({
            ...currentUnit,
            process: nextProcess,
          }))
        }
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
          <h2 className="text-[20px] font-bold text-[#1a1c1d]">Datos clave del contrato</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { key: "areaTechada", label: "Area techada" },
              { key: "areaLibre", label: "Area libre" },
              { key: "areaTotal", label: "Area total" },
              { key: "totalSalePrice", label: "Precio total de venta" },
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  {field.label}
                </label>
                <input
                  type="number"
                  value={unit.contractSummary[field.key as keyof typeof unit.contractSummary] as number}
                  onChange={(event) =>
                    updateUnit((currentUnit) => ({
                      ...currentUnit,
                      contractSummary: {
                        ...currentUnit.contractSummary,
                        [field.key]: Number(event.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                Fecha de entrega pactada
              </label>
              <input
                type="date"
                value={unit.contractSummary.deliveryDate}
                onChange={(event) =>
                  updateUnit((currentUnit) => ({
                    ...currentUnit,
                    contractSummary: {
                      ...currentUnit.contractSummary,
                      deliveryDate: event.target.value,
                    },
                  }))
                }
                className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                Fecha de desembolso
              </label>
              <input
                type="date"
                value={unit.contractSummary.disbursementDate}
                onChange={(event) =>
                  updateUnit((currentUnit) => ({
                    ...currentUnit,
                    contractSummary: {
                      ...currentUnit.contractSummary,
                      disbursementDate: event.target.value,
                    },
                  }))
                }
                className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                Particularidades del contrato
              </label>
              <textarea
                rows={3}
                value={unit.contractSummary.notes}
                onChange={(event) =>
                  updateUnit((currentUnit) => ({
                    ...currentUnit,
                    contractSummary: {
                      ...currentUnit.contractSummary,
                      notes: event.target.value,
                    },
                  }))
                }
                className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
          <h2 className="text-[20px] font-bold text-[#1a1c1d]">Carta de aprobacion bancaria</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { key: "amountApproved", label: "Monto aprobado" },
              { key: "issuedAt", label: "Fecha de emision", type: "date" },
              { key: "expiresAt", label: "Fecha de vencimiento", type: "date" },
              {
                key: "plannedDisbursementDate",
                label: "Fecha de desembolso pactada",
                type: "date",
              },
            ].map((field) => (
              <div key={field.key} className={field.key === "amountApproved" ? "md:col-span-2" : ""}>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  {field.label}
                </label>
                <input
                  type={field.type ?? "number"}
                  value={unit.bankApproval[field.key as keyof typeof unit.bankApproval] as string | number}
                  onChange={(event) =>
                    updateUnit((currentUnit) => ({
                      ...currentUnit,
                      bankApproval: {
                        ...currentUnit.bankApproval,
                        [field.key]:
                          field.type === "date"
                            ? event.target.value
                            : Number(event.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                Comentarios
              </label>
              <textarea
                rows={3}
                value={unit.bankApproval.notes}
                onChange={(event) =>
                  updateUnit((currentUnit) => ({
                    ...currentUnit,
                    bankApproval: {
                      ...currentUnit.bankApproval,
                      notes: event.target.value,
                    },
                  }))
                }
                className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
        <h2 className="text-[20px] font-bold text-[#1a1c1d]">Documentos heredados del proyecto</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {inheritedProjectDocs.map((document) => (
            <div key={document.id} className="rounded-xl border border-[#e2e2e4] bg-[#f9f9fb] p-4">
              <p className="text-sm font-bold text-[#1a1c1d]">{document.title}</p>
              <p className="mt-1 text-[12px] text-[#72787c]">
                {document.file?.fileName ?? document.externalUrl ?? "Sin archivo"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {PROCESS_MODULE_ORDER.map((moduleKey) => (
        <details
          key={moduleKey}
          open={moduleKey === "contrato"}
          className="rounded-xl border border-[#e2e2e4] bg-white p-4 shadow-[0_4px_20px_rgba(2,49,67,0.03)]"
        >
          <summary className="cursor-pointer list-none text-[16px] font-bold text-[#1a1c1d]">
            {PROCESS_MODULE_LABELS[moduleKey]}
          </summary>
          <div className="mt-4">
            <DocumentManager
              title={`Documentos de ${PROCESS_MODULE_LABELS[moduleKey]}`}
              module={moduleKey as ProcessModuleKey}
              scope="unit"
              documents={unit.documents.filter((document) => document.module === moduleKey)}
              definitions={UNIT_DOCUMENT_DEFINITIONS[moduleKey]}
              onChange={(nextDocuments) =>
                updateUnit((currentUnit) => ({
                  ...currentUnit,
                  documents: [
                    ...currentUnit.documents.filter((document) => document.module !== moduleKey),
                    ...nextDocuments,
                  ],
                }))
              }
            />
          </div>
        </details>
      ))}
    </section>
  );
}
