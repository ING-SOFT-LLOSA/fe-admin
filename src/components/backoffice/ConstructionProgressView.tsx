"use client";

import Link from "next/link";

import DocumentManager from "@/components/backoffice/DocumentManager";
import ProjectSectionNav from "@/components/backoffice/ProjectSectionNav";
import {
  CONSTRUCTION_STAGE_DESCRIPTIONS,
  CONSTRUCTION_STAGE_LABELS,
  CONSTRUCTION_STAGE_ORDER,
  PROJECT_DOCUMENT_DEFINITIONS,
} from "@/lib/backoffice/config";
import { computeProjectGlobalPercent, useBackofficeWorkspace } from "@/lib/backoffice/store";
import type { BackofficeProject, ConstructionStageKey, FileDescriptor } from "@/lib/backoffice/types";

type ConstructionProgressViewProps = {
  projectId: string;
};

function makeFileSizeLabel(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function toFileDescriptors(fileList: FileList | null): FileDescriptor[] {
  if (!fileList) return [];
  return Array.from(fileList).map((file) => ({
    fileName: file.name,
    fileSizeLabel: makeFileSizeLabel(file.size),
    uploadedAt: new Date().toISOString().split("T")[0] ?? "",
  }));
}

function updateProjectInWorkspace(
  projectId: string,
  projects: BackofficeProject[],
  updater: (project: BackofficeProject) => BackofficeProject,
) {
  return projects.map((project) => (project.id === projectId ? updater(project) : project));
}

export default function ConstructionProgressView({ projectId }: ConstructionProgressViewProps) {
  const { workspace, isHydrated, updateWorkspace, resetWorkspace } = useBackofficeWorkspace();
  const project = workspace.projects.find((entry) => entry.id === projectId);

  function updateProject(updater: (project: BackofficeProject) => BackofficeProject) {
    updateWorkspace((current) => ({
      ...current,
      projects: updateProjectInWorkspace(projectId, current.projects, updater),
    }));
  }

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h1 className="text-lg font-bold text-build-main">Proyecto no encontrado</h1>
        <p className="mt-2 text-sm text-slate-500">
          La ruta de obra no tiene un proyecto asociado en el workspace local.
        </p>
      </div>
    );
  }

  const globalPercent = computeProjectGlobalPercent(project);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-build-main hover:text-build-main"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al proyecto
          </Link>
          <h1 className="mt-3 text-[34px] font-bold tracking-[-0.02em] text-build-main">
            Obra · {project.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Configura licencias, etapas constructivas, porcentaje global y documentos compartidos.
          </p>
        </div>
        <button
          type="button"
          onClick={resetWorkspace}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-white"
        >
          Resetear demo local
        </button>
      </div>

      <ProjectSectionNav projectId={projectId} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_360px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-[20px] font-bold text-build-main">Licencias previas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Marca la aprobacion y adjunta el soporte PDF por cada licencia.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: "anteproyecto" as const, label: "Aprobacion del Anteproyecto" },
              { key: "licenciaObra" as const, label: "Licencia de Construccion" },
            ].map((licenseItem) => {
              const license = project.constructionProgress.licenses[licenseItem.key];
              return (
                <div
                  key={licenseItem.key}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="text-sm font-bold text-build-main">{licenseItem.label}</h3>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Estado
                      </label>
                      <select
                        value={license.status}
                        onChange={(event) =>
                          updateProject((currentProject) => ({
                            ...currentProject,
                            constructionProgress: {
                              ...currentProject.constructionProgress,
                              licenses: {
                                ...currentProject.constructionProgress.licenses,
                                [licenseItem.key]: {
                                  ...currentProject.constructionProgress.licenses[licenseItem.key],
                                  status: event.target.value as typeof license.status,
                                },
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobado">Aprobado</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Fecha de aprobacion
                      </label>
                      <input
                        type="date"
                        value={license.approvedAt}
                        onChange={(event) =>
                          updateProject((currentProject) => ({
                            ...currentProject,
                            constructionProgress: {
                              ...currentProject.constructionProgress,
                              licenses: {
                                ...currentProject.constructionProgress.licenses,
                                [licenseItem.key]: {
                                  ...currentProject.constructionProgress.licenses[licenseItem.key],
                                  approvedAt: event.target.value,
                                },
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                      />
                    </div>

                    <label className="rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-center hover:border-build-accent">
                      <span className="material-symbols-outlined text-[24px] text-build-main">
                        upload_file
                      </span>
                      <p className="mt-2 text-sm font-bold text-build-main">Adjuntar PDF</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {license.document
                          ? `${license.document.fileName} · ${license.document.fileSizeLabel}`
                          : "Haz click para seleccionar"}
                      </p>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          updateProject((currentProject) => ({
                            ...currentProject,
                            constructionProgress: {
                              ...currentProject.constructionProgress,
                              licenses: {
                                ...currentProject.constructionProgress.licenses,
                                [licenseItem.key]: {
                                  ...currentProject.constructionProgress.licenses[licenseItem.key],
                                  document: {
                                    fileName: file.name,
                                    fileSizeLabel: makeFileSizeLabel(file.size),
                                    uploadedAt:
                                      new Date().toISOString().split("T")[0] ?? currentProject.startDate,
                                  },
                                },
                              },
                            },
                          }));
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-build-main">Porcentaje global</h2>
              <p className="mt-1 text-sm text-slate-500">Promedio calculado o override manual.</p>
            </div>
            <div className="rounded-full bg-build-main/10 px-4 py-2 text-lg font-bold text-build-main">
              {globalPercent}%
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-build-main">Usar override manual</p>
                <p className="text-[12px] text-slate-500">
                  Si lo activas, el cliente vera este valor en vez del promedio automatico.
                </p>
              </div>
              <input
                type="checkbox"
                checked={project.constructionProgress.manualOverrideEnabled}
                onChange={(event) =>
                  updateProject((currentProject) => ({
                    ...currentProject,
                    constructionProgress: {
                      ...currentProject.constructionProgress,
                      manualOverrideEnabled: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 accent-[#023143]"
              />
            </label>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Override manual %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={project.constructionProgress.manualOverridePercent}
                disabled={!project.constructionProgress.manualOverrideEnabled}
                onChange={(event) =>
                  updateProject((currentProject) => ({
                    ...currentProject,
                    constructionProgress: {
                      ...currentProject.constructionProgress,
                      manualOverridePercent: Number(event.target.value),
                    },
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent disabled:opacity-50"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                Etapas en paralelo
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Acabados secos y humedos pueden avanzar en paralelo sin bloquear el resto del
                seguimiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-[20px] font-bold text-build-main">Etapas de construccion</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configura estado, avance, fechas y evidencia visual por cada etapa.
          </p>
        </div>

        <div className="space-y-4">
          {CONSTRUCTION_STAGE_ORDER.map((stageKey: ConstructionStageKey) => {
            const stage = project.constructionProgress.stages[stageKey];
            return (
              <div
                key={stageKey}
                className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[220px_180px_120px_180px_180px_minmax(0,1fr)]"
              >
                <div>
                  <p className="text-sm font-bold text-build-main">
                    {CONSTRUCTION_STAGE_LABELS[stageKey]}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {CONSTRUCTION_STAGE_DESCRIPTIONS[stageKey]}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Estado
                  </label>
                  <select
                    value={stage.status}
                    onChange={(event) =>
                      updateProject((currentProject) => ({
                        ...currentProject,
                        constructionProgress: {
                          ...currentProject.constructionProgress,
                          stages: {
                            ...currentProject.constructionProgress.stages,
                            [stageKey]: {
                              ...currentProject.constructionProgress.stages[stageKey],
                              status: event.target.value as typeof stage.status,
                            },
                          },
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                  >
                    <option value="no_iniciada">No iniciada</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={stage.percent}
                    onChange={(event) =>
                      updateProject((currentProject) => ({
                        ...currentProject,
                        constructionProgress: {
                          ...currentProject.constructionProgress,
                          stages: {
                            ...currentProject.constructionProgress.stages,
                            [stageKey]: {
                              ...currentProject.constructionProgress.stages[stageKey],
                              percent: Number(event.target.value),
                            },
                          },
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Inicio real
                  </label>
                  <input
                    type="date"
                    value={stage.startDate}
                    onChange={(event) =>
                      updateProject((currentProject) => ({
                        ...currentProject,
                        constructionProgress: {
                          ...currentProject.constructionProgress,
                          stages: {
                            ...currentProject.constructionProgress.stages,
                            [stageKey]: {
                              ...currentProject.constructionProgress.stages[stageKey],
                              startDate: event.target.value,
                            },
                          },
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Fin estimado
                  </label>
                  <input
                    type="date"
                    value={stage.estimatedEnd}
                    onChange={(event) =>
                      updateProject((currentProject) => ({
                        ...currentProject,
                        constructionProgress: {
                          ...currentProject.constructionProgress,
                          stages: {
                            ...currentProject.constructionProgress.stages,
                            [stageKey]: {
                              ...currentProject.constructionProgress.stages[stageKey],
                              estimatedEnd: event.target.value,
                            },
                          },
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-center hover:border-build-accent">
                    <span className="text-[12px] font-bold text-build-main">
                      Fotos ({stage.media.photos.length})
                    </span>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {stage.media.photos[0]?.fileName ?? "Adjuntar imagenes"}
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const files = toFileDescriptors(event.target.files);
                        if (files.length === 0) return;
                        updateProject((currentProject) => ({
                          ...currentProject,
                          constructionProgress: {
                            ...currentProject.constructionProgress,
                            stages: {
                              ...currentProject.constructionProgress.stages,
                              [stageKey]: {
                                ...currentProject.constructionProgress.stages[stageKey],
                                media: {
                                  ...currentProject.constructionProgress.stages[stageKey].media,
                                  photos: [
                                    ...currentProject.constructionProgress.stages[stageKey].media.photos,
                                    ...files,
                                  ],
                                },
                              },
                            },
                          },
                        }));
                      }}
                    />
                  </label>

                  <label className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-center hover:border-build-accent">
                    <span className="text-[12px] font-bold text-build-main">
                      Reportes ({stage.media.reports.length})
                    </span>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {stage.media.reports[0]?.fileName ?? "Adjuntar PDF"}
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        const files = toFileDescriptors(event.target.files);
                        if (files.length === 0) return;
                        updateProject((currentProject) => ({
                          ...currentProject,
                          constructionProgress: {
                            ...currentProject.constructionProgress,
                            stages: {
                              ...currentProject.constructionProgress.stages,
                              [stageKey]: {
                                ...currentProject.constructionProgress.stages[stageKey],
                                media: {
                                  ...currentProject.constructionProgress.stages[stageKey].media,
                                  reports: [
                                    ...currentProject.constructionProgress.stages[stageKey].media.reports,
                                    ...files,
                                  ],
                                },
                              },
                            },
                          },
                        }));
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <DocumentManager
        title="Documentos del proyecto"
        description="Gestiona documentos transversales que el cliente puede heredar en su portal."
        module="avance"
        scope="project"
        documents={project.documents}
        definitions={PROJECT_DOCUMENT_DEFINITIONS}
        onChange={(nextDocuments) =>
          updateProject((currentProject) => ({
            ...currentProject,
            documents: nextDocuments,
          }))
        }
      />
    </section>
  );
}
