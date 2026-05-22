"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import ProjectSectionNav from "@/components/backoffice/ProjectSectionNav";
import { PROCESS_MODULE_LABELS, PROCESS_MODULE_ORDER } from "@/lib/backoffice/config";
import { useBackofficeWorkspace } from "@/lib/backoffice/store";
import type { BackofficeUnit, UnitStatus, UnitTypology } from "@/lib/backoffice/types";

type UnitsOverviewViewProps = {
  projectId: string;
};

function getStatusLabel(status: UnitStatus) {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "separado":
      return "Separado";
    case "en_contrato":
      return "En contrato";
    case "cancelado":
      return "Cancelado";
    case "entregado":
      return "Entregado";
  }
}

function getStatusClass(status: UnitStatus) {
  switch (status) {
    case "disponible":
      return "bg-[#d6f0e0] text-[#1c663b]";
    case "separado":
      return "bg-[#fff3e0] text-[#e65100]";
    case "en_contrato":
      return "bg-build-main/10 text-build-main";
    case "cancelado":
      return "bg-[#ffdad6] text-[#ba1a1a]";
    case "entregado":
      return "bg-slate-100 text-slate-600";
  }
}

function getCurrentStageLabel(unit: BackofficeUnit) {
  const moduleKey = PROCESS_MODULE_ORDER[unit.process.currentModule - 1] ?? "separacion";
  return PROCESS_MODULE_LABELS[moduleKey];
}

export default function UnitsOverviewView({ projectId }: UnitsOverviewViewProps) {
  const { workspace, isHydrated } = useBackofficeWorkspace();
  const [search, setSearch] = useState("");
  const [towerFilter, setTowerFilter] = useState("all");
  const [typologyFilter, setTypologyFilter] = useState<UnitTypology | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UnitStatus | "all">("all");
  const [stageFilter, setStageFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);

  const project = workspace.projects.find((entry) => entry.id === projectId);

  const groupedUnits = useMemo(() => {
    if (!project) return [];
    return project.towers
      .map((tower) => ({
        ...tower,
        units: tower.units.filter((unit) => {
          const query = deferredSearch.trim().toLowerCase();
          const matchesQuery =
            query.length === 0 ||
            unit.number.toLowerCase().includes(query) ||
            tower.name.toLowerCase().includes(query) ||
            unit.client?.fullName.toLowerCase().includes(query);
          const matchesTower = towerFilter === "all" || tower.id === towerFilter;
          const matchesTypology = typologyFilter === "all" || unit.typology === typologyFilter;
          const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
          const matchesStage = stageFilter === "all" || getCurrentStageLabel(unit) === stageFilter;
          return matchesQuery && matchesTower && matchesTypology && matchesStatus && matchesStage;
        }),
      }))
      .filter((tower) => tower.units.length > 0);
  }, [deferredSearch, project, stageFilter, statusFilter, towerFilter, typologyFilter]);

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h1 className="text-lg font-bold text-build-main">Proyecto no encontrado</h1>
      </div>
    );
  }

  const allUnits = project.towers.flatMap((tower) => tower.units);

  return (
    <section className="space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-build-main"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al proyecto
        </Link>
        <h1 className="mt-3 text-[34px] font-bold tracking-[-0.02em] text-build-main">
          Unidades · {project.name}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Gestiona unidades, cliente asignado y etapa del proceso de compra por torre.
        </p>
      </div>

      <ProjectSectionNav projectId={projectId} />

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total unidades
          </p>
          <p className="mt-2 text-[28px] font-bold text-build-main">{allUnits.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Disponibles
          </p>
          <p className="mt-2 text-[28px] font-bold text-[#1c663b]">
            {allUnits.filter((unit) => unit.status === "disponible").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            En contrato
          </p>
          <p className="mt-2 text-[28px] font-bold text-build-main">
            {allUnits.filter((unit) => unit.status === "en_contrato").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Entregadas
          </p>
          <p className="mt-2 text-[28px] font-bold text-slate-600">
            {allUnits.filter((unit) => unit.status === "entregado").length}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,180px)]">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Buscar unidad o cliente
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej. Torre A, Maria Garcia, A-101"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Torre
            </label>
            <select
              value={towerFilter}
              onChange={(event) => setTowerFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            >
              <option value="all">Todas</option>
              {project.towers.map((tower) => (
                <option key={tower.id} value={tower.id}>
                  {tower.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tipologia
            </label>
            <select
              value={typologyFilter}
              onChange={(event) => setTypologyFilter(event.target.value as UnitTypology | "all")}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            >
              <option value="all">Todas</option>
              <option value="1D">1D</option>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
              <option value="estacionamiento">Estacionamiento</option>
              <option value="deposito">Deposito</option>
              <option value="oficina">Oficina</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as UnitStatus | "all")}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            >
              <option value="all">Todos</option>
              <option value="disponible">Disponible</option>
              <option value="separado">Separado</option>
              <option value="en_contrato">En contrato</option>
              <option value="cancelado">Cancelado</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Etapa
            </label>
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
            >
              <option value="all">Todas</option>
              {PROCESS_MODULE_ORDER.map((moduleKey) => (
                <option key={moduleKey} value={PROCESS_MODULE_LABELS[moduleKey]}>
                  {PROCESS_MODULE_LABELS[moduleKey]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {groupedUnits.map((tower) => (
        <section
          key={tower.id}
          className="rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-[20px] font-bold text-build-main">{tower.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {tower.units.length} unidades visibles luego de filtros
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-500">
              {tower.floors} pisos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    "Unidad",
                    "Piso",
                    "Area",
                    "Tipologia",
                    "Estado",
                    "Cliente asignado",
                    "Etapa actual",
                    "Acciones",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tower.units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-build-main">{unit.number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{unit.floor}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{unit.area} m2</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{unit.typology}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${getStatusClass(unit.status)}`}
                      >
                        {getStatusLabel(unit.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {unit.client ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-build-main">
                            {unit.client.fullName}
                          </span>
                          <Link
                            href={`/clientes/${unit.client.clientId}/expediente`}
                            className="text-[12px] font-bold text-build-accent hover:underline"
                          >
                            Ver expediente
                          </Link>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-build-main">
                      {getCurrentStageLabel(unit)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/projects/${projectId}/unidades/${unit.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-build-main px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-build-main/90"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        Abrir detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </section>
  );
}
