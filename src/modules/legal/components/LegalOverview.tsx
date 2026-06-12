"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  fetchTodosLosContratos,
  fetchEtapasExpediente,
  type UsuarioActivoResponseDTO,
  type EtapaExpedienteResponseDTO,
} from "@/lib/api/expedientes";

export default function LegalOverview() {
  const router = useRouter();
  const [contracts, setContracts] = useState<UsuarioActivoResponseDTO[]>([]);
  const [contractsStages, setContractsStages] = useState<Record<string, EtapaExpedienteResponseDTO[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isStagesLoading, setIsStagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Cascading Filter States
  const [selectedProyecto, setSelectedProyecto] = useState("");
  const [selectedTorre, setSelectedTorre] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [selectedEtapa, setSelectedEtapa] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const list = await fetchTodosLosContratos();
        if (!mounted) return;
        setContracts(list);
        
        setIsStagesLoading(true);
        const stagesMap: Record<string, EtapaExpedienteResponseDTO[]> = {};
        await Promise.all(
          list.map(async (c) => {
            try {
              const stages = await fetchEtapasExpediente(c.uuidUsuarioActivo);
              stagesMap[c.uuidUsuarioActivo] = stages;
            } catch (err) {
              console.error(`Error loading stages for ${c.uuidUsuarioActivo}:`, err);
            }
          })
        );
        if (mounted) {
          setContractsStages(stagesMap);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los expedientes.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsStagesLoading(false);
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  // Reset Torre filter when Project changes
  useEffect(() => {
    setSelectedTorre("");
  }, [selectedProyecto]);

  // Derived filter options
  const proyectosOptions = Array.from(
    new Set(
      contracts
        .flatMap((c) => c.activos ?? [])
        .map((a) => a.proyectoNombre)
        .filter(Boolean)
    )
  ).sort();

  const torresOptions = Array.from(
    new Set(
      contracts
        .filter((c) => {
          if (!selectedProyecto) return true;
          return (c.activos ?? []).some((a) => a.proyectoNombre === selectedProyecto);
        })
        .flatMap((c) => c.activos ?? [])
        .map((a) => a.torreNombre)
        .filter(Boolean)
    )
  ).sort();

  // Helper functions for stage labels
  function getEtapaActualLabel(stages: EtapaExpedienteResponseDTO[] | undefined): string {
    if (!stages || stages.length === 0) return "Por iniciar";
    const order = ["SEPARACION", "CONTRATO", "PAGO", "ENTREGA", "SANEAMIENTO"];
    const sorted = [...stages].sort((a, b) => order.indexOf(a.etapaProceso) - order.indexOf(b.etapaProceso));
    
    const inProgress = sorted.find((s) => s.estado === "EN_PROGRESO");
    if (inProgress) return formatEtapaLabel(inProgress.etapaProceso);
    
    const pending = sorted.find((s) => s.estado === "PENDIENTE");
    if (pending) return formatEtapaLabel(pending.etapaProceso);
    
    return "Saneamiento (Completado)";
  }

  function formatEtapaLabel(etapaProceso: string): string {
    switch (etapaProceso) {
      case "SEPARACION": return "Separación";
      case "CONTRATO": return "Contrato";
      case "PAGO": return "Pagos";
      case "ENTREGA": return "Entrega";
      case "SANEAMIENTO": return "Saneamiento";
      default: return etapaProceso;
    }
  }

  // Filtered List
  const filtered = contracts.filter((c) => {
    // 1. Proyecto
    if (selectedProyecto) {
      const matchesProject = (c.activos ?? []).some((a) => a.proyectoNombre === selectedProyecto);
      if (!matchesProject) return false;
    }

    // 2. Torre
    if (selectedTorre) {
      const matchesTower = (c.activos ?? []).some((a) => a.torreNombre === selectedTorre);
      if (!matchesTower) return false;
    }

    // 3. Estado Legal
    if (selectedEstado) {
      const isVigente = c.vigente !== false;
      const statusLabel = isVigente ? "Vigente" : "Desvinculado";
      if (statusLabel !== selectedEstado) return false;
    }

    // 4. Etapa
    if (selectedEtapa) {
      const stages = contractsStages[c.uuidUsuarioActivo];
      const stageLabel = getEtapaActualLabel(stages);
      if (stageLabel !== selectedEtapa && !(stageLabel.includes("Saneamiento") && selectedEtapa === "Saneamiento")) {
        return false;
      }
    }

    // 5. Search Text
    if (search) {
      const query = search.toLowerCase();
      const matchesUuid = c.uuidUsuarioActivo.toLowerCase().includes(query) || `exp-${c.uuidUsuarioActivo.slice(0, 8)}`.toLowerCase().includes(query);
      const matchesTitulares = c.clientes?.some((client) => {
        const fullName = [client.nombre, client.apellidos].filter(Boolean).join(" ").toLowerCase();
        return fullName.includes(query) || client.email.toLowerCase().includes(query) || (client.documentoIdentidad ?? "").toLowerCase().includes(query);
      });
      const matchesActivo = c.activos?.some((a) => {
        const unitName = `${a.torreNombre} ${a.tipo} ${a.nro}`.toLowerCase();
        return unitName.includes(query) || (a.proyectoNombre ?? "").toLowerCase().includes(query);
      });
      return matchesUuid || matchesTitulares || matchesActivo;
    }

    return true;
  });

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-build-main dark:text-white md:text-3xl">
            Gestión Legal
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
            Expedientes de compraventa, hitos de etapas, firmas de contratos y documentos legales.
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-white/30">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por expediente, cliente o unidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-9 pr-4 py-2.5 text-sm text-build-main dark:text-white outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent transition"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Cascading Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
        {/* Proyecto */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/35">Proyecto</label>
          <select
            value={selectedProyecto}
            onChange={(e) => setSelectedProyecto(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] px-3 py-2 text-xs focus:outline-none dark:text-white focus:border-build-accent"
          >
            <option value="">Todos los proyectos</option>
            {proyectosOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Torre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/35">Torre</label>
          <select
            value={selectedTorre}
            onChange={(e) => setSelectedTorre(e.target.value)}
            disabled={!selectedProyecto}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] px-3 py-2 text-xs focus:outline-none dark:text-white focus:border-build-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Todas las torres</option>
            {torresOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Estado Legal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/35">Estado Legal</label>
          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] px-3 py-2 text-xs focus:outline-none dark:text-white focus:border-build-accent"
          >
            <option value="">Todos los estados</option>
            <option value="Vigente">Vigente</option>
            <option value="Desvinculado">Desvinculado</option>
          </select>
        </div>

        {/* Etapa */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/35">Etapa Actual</label>
          <select
            value={selectedEtapa}
            onChange={(e) => setSelectedEtapa(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] px-3 py-2 text-xs focus:outline-none dark:text-white focus:border-build-accent"
          >
            <option value="">Todas las etapas</option>
            <option value="Separación">Separación</option>
            <option value="Contrato">Contrato</option>
            <option value="Pagos">Pagos</option>
            <option value="Entrega">Entrega</option>
            <option value="Saneamiento">Saneamiento</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <tr>
              {["Expediente", "Proyecto / Unidad", "Titulares", "Etapa actual", "Estado", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-build-accent" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Cargando expedientes...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-white/40">
                  {search || selectedProyecto || selectedEstado || selectedEtapa ? "Sin resultados para los filtros seleccionados." : "No hay expedientes registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((contract) => {
                const idCorto = contract.uuidUsuarioActivo.slice(0, 8).toUpperCase();
                
                // Formatted Project / Unit
                const firstAct = contract.activos?.[0];
                const unitListText = contract.activos && contract.activos.length > 0
                  ? contract.activos.map(a => `${a.tipo === "DEPARTAMENTO" ? "Dpto" : a.tipo === "ESTACIONAMIENTO" ? "Cochera" : "Depósito"} ${a.nro}`).join(" + ")
                  : "Sin unidades";
                const proyectoUnidadText = firstAct
                  ? `${firstAct.torreNombre} · ${unitListText}`
                  : "Sin asignar";

                // Formatted Titulares
                const titularesText = contract.clientes && contract.clientes.length > 0
                  ? contract.clientes.map(cl => [cl.nombre, cl.apellidos].filter(Boolean).join(" ")).join(" · ")
                  : "Sin titulares";

                // Stage label
                const stages = contractsStages[contract.uuidUsuarioActivo];
                const etapaActualText = isStagesLoading && !stages ? "Cargando..." : getEtapaActualLabel(stages);

                // Legal Status badge
                const isVigente = contract.vigente !== false;
                const statusBadgeClass = isVigente
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40";
                
                return (
                  <tr
                    key={contract.uuidUsuarioActivo}
                    onClick={() => router.push(`/legal/${contract.uuidUsuarioActivo}`)}
                    className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Expediente ID */}
                    <td className="px-5 py-4 text-sm font-bold text-build-main dark:text-white group-hover:text-build-accent transition-colors">
                      EXP-{idCorto}
                    </td>
                    
                    {/* Proyecto / Unidad */}
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-white/80">
                      {proyectoUnidadText}
                    </td>

                    {/* Titulares */}
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-white/70">
                      {titularesText}
                    </td>

                    {/* Etapa Actual */}
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-white/50">
                      {etapaActualText}
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadgeClass}`}>
                        <span className="material-symbols-outlined text-[12px]">{isVigente ? "check_circle" : "cancel"}</span>
                        {isVigente ? "Vigente" : "Desvinculado"}
                      </span>
                    </td>

                    {/* Action hint */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-semibold text-build-accent">Ver detalle</span>
                        <span className="material-symbols-outlined text-[16px] text-build-accent">arrow_forward</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5">
            <p className="text-xs text-slate-400 dark:text-white/30">
              {filtered.length} expediente{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}