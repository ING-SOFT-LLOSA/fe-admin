"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import DocumentManager from "@/components/backoffice/DocumentManager";
import ProcessPipeline from "@/components/backoffice/ProcessPipeline";
import { PROCESS_MODULE_LABELS, PROCESS_MODULE_ORDER, UNIT_DOCUMENT_DEFINITIONS } from "@/lib/backoffice/config";
import { fetchUsuarios } from "@/lib/api/users";
import { computeProjectGlobalPercent, useBackofficeWorkspace } from "@/lib/backoffice/store";
import type { BackofficeProject, BackofficeUnit, ProcessModuleKey, UnitClientAssignment } from "@/lib/backoffice/types";
import type { Usuario } from "@/types/user";

type ClientExpedienteViewProps = {
  clientId: number;
};

function updateClientUnit(
  projects: BackofficeProject[],
  unitId: string,
  updater: (unit: BackofficeUnit, project: BackofficeProject) => BackofficeUnit,
) {
  return projects.map((project) => ({
    ...project,
    towers: project.towers.map((tower) => ({
      ...tower,
      units: tower.units.map((unit) => (unit.id === unitId ? updater(unit, project) : unit)),
    })),
  }));
}

export default function ClientExpedienteView({ clientId }: ClientExpedienteViewProps) {
  const { workspace, isHydrated, updateWorkspace } = useBackofficeWorkspace();
  const [client, setClient] = useState<Usuario | null>(null);
  const [clientError, setClientError] = useState("");
  const assignedUnits = useMemo(
    () =>
      workspace.projects.flatMap((project) =>
        project.towers.flatMap((tower) =>
          tower.units
            .filter((unit) => unit.client?.clientId === clientId)
            .map((unit) => ({
              project,
              unit,
            })),
        ),
      ),
    [clientId, workspace.projects],
  );
  const [selectedUnitId, setSelectedUnitId] = useState("");

  useEffect(() => {
    let isActive = true;
    fetchUsuarios()
      .then((usuarios) => {
        if (!isActive) return;
        setClient(usuarios.find((usuario) => usuario.id === clientId) ?? null);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setClientError(error instanceof Error ? error.message : "No se pudo cargar el cliente.");
      });
    return () => {
      isActive = false;
    };
  }, [clientId]);

  const activeSelectedUnitId = selectedUnitId || assignedUnits[0]?.unit.id || "";
  const selectedEntry =
    assignedUnits.find((entry) => entry.unit.id === activeSelectedUnitId) ?? assignedUnits[0];
  const selectedUnit = selectedEntry?.unit;
  const selectedProject = selectedEntry?.project;

  function updateSelectedUnit(
    updater: (unit: BackofficeUnit, project: BackofficeProject) => BackofficeUnit,
  ) {
    if (!selectedUnit) return;
    updateWorkspace((current) => ({
      ...current,
      projects: updateClientUnit(current.projects, selectedUnit.id, updater),
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

  const clientIdentity: UnitClientAssignment | null = selectedUnit?.client ?? null;

  if (!selectedUnit || !selectedProject) {
    return (
      <div className="rounded-xl border border-dashed border-[#c1c7cc] bg-white px-6 py-12 text-center">
        <h1 className="text-lg font-bold text-[#1a1c1d]">Cliente sin unidad asociada</h1>
        <p className="mt-2 text-sm text-[#41484c]">
          Todavia no hay una unidad del workspace local vinculada a este cliente.
        </p>
      </div>
    );
  }

  const inheritedProjectDocs = selectedProject.documents.filter((document) => document.visibleToClient);
  const projectPercent = computeProjectGlobalPercent(selectedProject);
  const identityName =
    clientIdentity?.fullName ?? client?.nombre ?? `${client?.nombre ?? ""} ${client?.apellidos ?? ""}`.trim();

  return (
    <section className="space-y-6">
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#023143] hover:text-[#001b27]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a clientes
        </Link>
        <h1 className="mt-3 text-[34px] font-bold tracking-[-0.02em] text-[#1a1c1d]">
          Expediente de cliente
        </h1>
        <p className="mt-2 text-sm text-[#41484c]">
          Vista administrativa completa por unidad, proceso y documentos visibles al comprador.
        </p>
      </div>

      <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="text-[20px] font-bold text-[#1a1c1d]">{identityName || "Cliente"}</h2>
            <p className="mt-1 text-sm text-[#41484c]">
              {client?.email ?? clientIdentity?.email ?? "Sin correo"} ·{" "}
              {clientIdentity?.phone ?? "Sin telefono"}
            </p>
            {clientError ? (
              <p className="mt-3 text-[12px] font-bold text-[#ba1a1a]">{clientError}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
              Unidad seleccionada
            </label>
            <select
              value={activeSelectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value)}
              className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
            >
              {assignedUnits.map((entry) => (
                <option key={entry.unit.id} value={entry.unit.id}>
                  {entry.project.name} · {entry.unit.number}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <ProcessPipeline
            process={selectedUnit.process}
            paymentMode={selectedUnit.client?.paymentMode ?? "credito_directo"}
            projectPercent={projectPercent}
            onChange={(nextProcess) =>
              updateSelectedUnit((unit) => ({
                ...unit,
                process: nextProcess,
              }))
            }
          />

          <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
            <h2 className="text-[20px] font-bold text-[#1a1c1d]">Resumen contractual editable</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  Area techada
                </label>
                <input
                  type="number"
                  value={selectedUnit.contractSummary.areaTechada}
                  onChange={(event) =>
                    updateSelectedUnit((unit) => ({
                      ...unit,
                      contractSummary: {
                        ...unit.contractSummary,
                        areaTechada: Number(event.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  Area libre
                </label>
                <input
                  type="number"
                  value={selectedUnit.contractSummary.areaLibre}
                  onChange={(event) =>
                    updateSelectedUnit((unit) => ({
                      ...unit,
                      contractSummary: {
                        ...unit.contractSummary,
                        areaLibre: Number(event.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  Area total
                </label>
                <input
                  type="number"
                  value={selectedUnit.contractSummary.areaTotal}
                  onChange={(event) =>
                    updateSelectedUnit((unit) => ({
                      ...unit,
                      contractSummary: {
                        ...unit.contractSummary,
                        areaTotal: Number(event.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  Precio total de venta
                </label>
                <input
                  type="number"
                  value={selectedUnit.contractSummary.totalSalePrice}
                  onChange={(event) =>
                    updateSelectedUnit((unit) => ({
                      ...unit,
                      contractSummary: {
                        ...unit.contractSummary,
                        totalSalePrice: Number(event.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  Fecha de entrega pactada
                </label>
                <input
                  type="date"
                  value={selectedUnit.contractSummary.deliveryDate}
                  onChange={(event) =>
                    updateSelectedUnit((unit) => ({
                      ...unit,
                      contractSummary: {
                        ...unit.contractSummary,
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
                  value={selectedUnit.contractSummary.disbursementDate}
                  onChange={(event) =>
                    updateSelectedUnit((unit) => ({
                      ...unit,
                      contractSummary: {
                        ...unit.contractSummary,
                        disbursementDate: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#72787c]">
                  Comentarios contractuales
                </label>
                <textarea
                  rows={3}
                  value={selectedUnit.contractSummary.notes}
                  onChange={(event) =>
                    updateSelectedUnit((unit) => ({
                      ...unit,
                      contractSummary: {
                        ...unit.contractSummary,
                        notes: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#c1c7cc] px-3 py-2 text-sm outline-none focus:border-[#023143]"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
            <h2 className="text-[20px] font-bold text-[#1a1c1d]">Documentos heredados del proyecto</h2>
            <div className="mt-4 space-y-3">
              {inheritedProjectDocs.map((document) => (
                <div key={document.id} className="rounded-lg border border-[#e2e2e4] bg-[#f9f9fb] p-3">
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
                  documents={selectedUnit.documents.filter((document) => document.module === moduleKey)}
                  definitions={UNIT_DOCUMENT_DEFINITIONS[moduleKey]}
                  onChange={(nextDocuments) =>
                    updateSelectedUnit((unit) => ({
                      ...unit,
                      documents: [
                        ...unit.documents.filter((document) => document.module !== moduleKey),
                        ...nextDocuments,
                      ],
                    }))
                  }
                />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
