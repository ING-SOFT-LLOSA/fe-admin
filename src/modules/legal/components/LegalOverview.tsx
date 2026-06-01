"use client";

import Link from "next/link";

import { useBackofficeWorkspace } from "@/modules/shared/workspace/store";

export default function LegalOverview() {
  const { workspace, isHydrated } = useBackofficeWorkspace();
  const assignedUnits = workspace.projects.flatMap((project) =>
    project.towers.flatMap((tower) =>
      tower.units
        .filter((unit) => unit.client)
        .map((unit) => ({
          project,
          tower,
          unit,
          client: unit.client,
        })),
    ),
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-build-main md:text-3xl">
          Gestión Legal
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Expedientes, documentos y trazabilidad contractual por cliente y unidad.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Cliente", "Proyecto", "Unidad", "Estado", "Acción"].map((header) => (
                <th key={header} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!isHydrated ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                  Cargando expedientes...
                </td>
              </tr>
            ) : assignedUnits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                  No hay unidades asignadas en el workspace local.
                </td>
              </tr>
            ) : (
              assignedUnits.map(({ project, tower, unit, client }) => (
                <tr key={unit.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-bold text-build-main">{client?.fullName}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{project.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {tower.name} - {unit.number}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{unit.status}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/clientes/${client?.clientId}/expediente`}
                      className="inline-flex items-center gap-2 rounded-lg bg-build-main px-3 py-2 text-xs font-bold text-white hover:bg-build-main/90"
                    >
                      <span className="material-symbols-outlined text-[16px]">balance</span>
                      Abrir expediente
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
