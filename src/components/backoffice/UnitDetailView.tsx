"use client";

import Link from "next/link";
import { useState } from "react";

import DocumentManager from "@/components/backoffice/DocumentManager";
import ProcessPipeline from "@/components/backoffice/ProcessPipeline";
import ProjectSectionNav from "@/components/backoffice/ProjectSectionNav";
import { PROCESS_MODULE_LABELS, PROCESS_MODULE_ORDER, UNIT_DOCUMENT_DEFINITIONS } from "@/lib/backoffice/config";
import { computeProjectGlobalPercent, useBackofficeWorkspace } from "@/lib/backoffice/store";
import type { BackofficeProject, BackofficeUnit, ProcessModuleKey, UnitClientAssignment } from "@/lib/backoffice/types";
import { getHitosActivo, getAvancesActivo, HitoUnidadResponseDTO, AvanceUnidadResponseDTO } from "@/lib/api/proyectos";
import { useEffect, useState as useReactState } from "react";

type UnitDetailViewProps = {
  projectId: string;
  unitId: string;
};

import ClientAssignmentForm from "@/components/backoffice/ClientAssignmentForm";

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

  const [hitos, setHitos] = useReactState<HitoUnidadResponseDTO[]>([]);
  const [avances, setAvances] = useReactState<AvanceUnidadResponseDTO[]>([]);

  useEffect(() => {
    if (unitId) {
      getHitosActivo(unitId).then(setHitos).catch(console.error);
      getAvancesActivo(unitId).then(setAvances).catch(console.error);
    }
  }, [unitId]);

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
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h1 className="text-lg font-bold text-build-main">Unidad no encontrada</h1>
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
          className="inline-flex items-center gap-2 text-sm font-bold text-build-main hover:text-build-main"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a unidades
        </Link>
        <h1 className="mt-3 text-[34px] font-bold tracking-[-0.02em] text-build-main">
          Unidad {unit.number}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Gestion administrativa completa por unidad, cliente y documentos del proceso.
        </p>
      </div>

      <ProjectSectionNav projectId={projectId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_420px]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-bold text-build-main">Datos de la unidad</h2>
              <p className="mt-1 text-sm text-slate-500">
                Proyecto, torre, metraje, tipologia y precio comercial.
              </p>
            </div>
            <span className="rounded-full bg-build-main/10 px-3 py-1 text-[12px] font-bold text-build-main">
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
              <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-build-main">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-[20px] font-bold text-build-main">Cliente asignado</h2>
            <p className="mt-1 text-sm text-slate-500">
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

      {/* Avance de Obra Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[20px] font-bold text-build-main">Avance Constructivo de la Unidad</h2>
        <p className="mt-1 text-sm text-slate-500 mb-5">Hitos de construcción asignados a esta unidad desde el backend real.</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-slate-500">Hito</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500">Descripción</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500">Estado</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500">Fecha Completado</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {hitos.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">Aún no hay hitos para esta unidad.</td></tr>
              ) : hitos.map((hito) => (
                <tr key={hito.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-build-main">{hito.hitoNombre}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{hito.hitoDescripcion}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${hito.estado === 'COMPLETADO' ? 'bg-[#d6f0e0] text-[#1c663b]' : 'bg-slate-100 text-slate-700'}`}>
                      {hito.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{hito.fechaCompletado ? new Date(hito.fechaCompletado).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{hito.observaciones || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[20px] font-bold text-build-main">Datos clave del contrato</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { key: "areaTechada", label: "Area techada" },
              { key: "areaLibre", label: "Area libre" },
              { key: "areaTotal", label: "Area total" },
              { key: "totalSalePrice", label: "Precio total de venta" },
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[20px] font-bold text-build-main">Carta de aprobacion bancaria</h2>
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
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[20px] font-bold text-build-main">Documentos heredados del proyecto</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {inheritedProjectDocs.map((document) => (
            <div key={document.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-build-main">{document.title}</p>
              <p className="mt-1 text-[12px] text-slate-500">
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
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <summary className="cursor-pointer list-none text-[16px] font-bold text-build-main">
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
