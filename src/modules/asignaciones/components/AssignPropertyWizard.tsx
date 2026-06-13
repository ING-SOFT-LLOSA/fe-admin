"use client";

import React, { useState, useEffect } from "react";
import { fetchUsuarios, mapUsuarioToClienteRow } from "@/lib/api/users";
import { crearContrato, asignarActivo } from "@/lib/api/expedientes";
import { fetchActivosPorProyecto } from "@/modules/inventario/services";
import { fetchProyectos } from "@/modules/proyectos/services";
import type { Proyecto } from "@/modules/proyectos/types";
import type { ClienteRow } from "@/types/user";

interface AssignPropertyWizardProps {
  onClose: () => void;
  onSuccess: () => void;
  client?: ClienteRow;
}

interface UnitSelection {
  id: string; // UUID
  name: string; // e.g. "Dpto 101"
  type: string;
}

export default function AssignPropertyWizard({ onClose, onSuccess, client }: AssignPropertyWizardProps) {
  // Steps:
  // From main page (no client): 1=Select Clients → 2=Select Units → 3=Confirm
  // From client profile (has client): 1=Select Units → 2=Confirm (skip client selection)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const totalSteps = client ? 2 : 3;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step: Inventory
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectSearch, setProjectSearch] = useState("");
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [units, setUnits] = useState<UnitSelection[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Step: Client selection (multi-select)
  const [searchQuery, setSearchQuery] = useState("");
  const [allClients, setAllClients] = useState<ClienteRow[]>([]);
  const [selectedClients, setSelectedClients] = useState<ClienteRow[]>(client ? [client] : []);
  const [clientsLoading, setClientsLoading] = useState(false);

  // Step: Details (financing type)
  const [tipoFinanciamiento, setTipoFinanciamiento] = useState("CREDITO_HIPOTECARIO");

  // Load Projects on mount
  useEffect(() => {
    fetchProyectos().then(data => {
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
        setProjectSearch(data[0].nombre);
      }
    }).catch(() => setErrorMsg("No se pudieron cargar los proyectos"));
    
    // Preload clients for search
    if (!client) {
      setClientsLoading(true);
      fetchUsuarios()
        .then(data => setAllClients(data.filter(u => u.activo).map(mapUsuarioToClienteRow)))
        .catch(console.error)
        .finally(() => setClientsLoading(false));
    }
  }, []);

  // Load Units when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingUnits(true);
    setUnits([]);
    setSelectedUnitIds([]);
    
    fetchActivosPorProyecto(selectedProjectId, "DISPONIBLE")
      .then(page => {
        const availableUnits: UnitSelection[] = page.content.map(a => ({
          id: a.id,
          name: a.nro,
          type: a.tipo
        }));
        setUnits(availableUnits);
      })
      .catch(() => setErrorMsg("Error cargando inventario del proyecto"))
      .finally(() => setLoadingUnits(false));
  }, [selectedProjectId]);

  // Filtered clients for search
  const filteredClients = allClients.filter(c => {
    if (c.tipoUsuario !== "CLIENTE") return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.dni !== "—" && c.dni.includes(searchQuery.trim()))
    );
  });

  function toggleClientSelection(c: ClienteRow) {
    setSelectedClients(prev => {
      const exists = prev.find(p => p.id === c.id);
      if (exists) return prev.filter(p => p.id !== c.id);
      return [...prev, c];
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function getCurrentStep() {
    if (client) {
      // 2-step flow: step 1=Units, step 2=Confirm (mapped to step 3 internally)
      if (step === 1) return 1;
      return 2;
    }
    return step;
  }

  function getStepLabel() {
    if (client) {
      if (step === 1) return "Seleccionar unidades";
      return "Confirmar asignación";
    }
    if (step === 1) return "Seleccionar personas";
    if (step === 2) return "Seleccionar unidades";
    return "Confirmar asignación";
  }

  // Step 1 (no client): Select clients
  function handleNextStep1NoClient() {
    if (selectedClients.length === 0) {
      setErrorMsg("Debes seleccionar al menos una persona para continuar.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  }

  // Step 1 (with client) or Step 2 (no client): Select units
  function handleNextStepUnits() {
    if (selectedUnitIds.length === 0) {
      setErrorMsg("Debes seleccionar al menos una unidad para continuar.");
      return;
    }
    setErrorMsg("");
    setStep(3);
  }

  async function handleConfirmAssignment() {
    if (selectedClients.length === 0 || selectedUnitIds.length === 0) return;
    
    setLoading(true);
    setErrorMsg("");

    try {
      // Paso 1: Crear el contrato (expediente) con los clientes seleccionados
      const fechaAdq = new Date().toISOString().split(".")[0];
      const clientIds = selectedClients.map(c => c.id);
      
      const contrato = await crearContrato({
        idsUsuarios: clientIds,
        tipoFinanciamiento,
        faseComercial: "SEPARACION",
        estadoTramiteLegal: "EN_PROCESO",
        fechaAdquisicion: fechaAdq,
        
        // Workaround positional keys
        arg0: clientIds,
        arg1: tipoFinanciamiento,
        arg2: "SEPARACION",
        arg3: "EN_PROCESO",
        arg4: fechaAdq
      });

      // Paso 2: Asignar todos los activos seleccionados al contrato creado
      await asignarActivo({
        uuidUsuarioActivo: contrato.uuidUsuarioActivo,
        idsActivo: selectedUnitIds,
        
        // Workaround positional keys
        arg0: contrato.uuidUsuarioActivo,
        arg1: selectedUnitIds
      });
      
      setSuccessMsg("Asignación completada correctamente.");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error("Error detallado al asignar unidad:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al asignar la unidad."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderUnitCard(u: UnitSelection) {
    const isSelected = selectedUnitIds.includes(u.id);
    return (
      <div
        key={u.id}
        onClick={() => {
          if (isSelected) setSelectedUnitIds(prev => prev.filter(id => id !== u.id));
          else setSelectedUnitIds(prev => [...prev, u.id]);
          setErrorMsg("");
        }}
        className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${isSelected
          ? "border-build-main bg-build-main/5"
          : "border-slate-200 dark:border-white/10 hover:border-build-accent bg-white dark:bg-white/5"
          }`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={`material-symbols-outlined text-[20px] ${isSelected ? "text-build-main dark:text-white" : "text-slate-400 dark:text-white/50"}`}>
            {u.type === "ESTACIONAMIENTO" || u.type === "COCHERA" ? "directions_car" : u.type === "DEPOSITO" ? "inventory_2" : "apartment"}
          </span>
          {isSelected && <span className="material-symbols-outlined text-[16px] text-build-main dark:text-white">check_circle</span>}
        </div>
        <h4 className="text-[13px] font-bold leading-tight text-build-main dark:text-white">{u.name}</h4>
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const currentStep = getCurrentStep();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-white/5 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[650px] animate-slide-up relative">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-build-main dark:text-white">key</span>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-build-main dark:text-white">Asignar unidad</h2>
              <p className="text-[12px] text-slate-500 dark:text-white/60 font-medium mt-0.5">Paso {currentStep} de {totalSteps} — {getStepLabel()}</p>
            </div>
          </div>
          <button disabled={loading} onClick={onClose} className="text-slate-400 dark:text-white/50 hover:text-build-main dark:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="h-1 w-full bg-build-bg">
          <div className="h-full bg-build-main transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* ─── Step 1 (No client): Select Persons ─── */}
          {!client && step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-[18px] font-bold text-build-main dark:text-white">Seleccionar personas</h3>
                <p className="text-[13px] text-slate-500 dark:text-white/60">Elige las personas que formarán parte del contrato.</p>
              </div>

              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/50 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o documento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent bg-white dark:bg-white/5"
                />
              </div>

              {/* Selected clients chips */}
              {selectedClients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedClients.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-build-main/10 text-build-main dark:text-white dark:bg-white/10 rounded-full text-[12px] font-bold">
                      {c.name}
                      <button onClick={() => toggleClientSelection(c)} className="hover:text-red-600 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Clients list */}
              {clientsLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span className="text-sm">Cargando clientes...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {filteredClients.length === 0 ? (
                    <p className="text-[13px] text-slate-500 dark:text-white/60 p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center">
                      No se encontraron clientes activos.
                    </p>
                  ) : (
                    filteredClients.map(c => {
                      const isSelected = selectedClients.some(sc => sc.id === c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleClientSelection(c)}
                          className={`cursor-pointer flex items-center justify-between border-2 rounded-xl p-3 transition-all ${
                            isSelected
                              ? "border-build-main bg-build-main/5"
                              : "border-slate-200 dark:border-white/10 hover:border-build-accent bg-white dark:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ${
                              isSelected
                                ? "bg-build-main text-white"
                                : "bg-build-bg dark:bg-white/10 text-build-main dark:text-white"
                            }`}>
                              {c.initials}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-build-main dark:text-white">{c.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-white/50">{c.dni !== "—" ? `DNI: ${c.dni} · ` : ""}{c.email}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-build-main dark:text-white text-[20px]">check_circle</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {errorMsg && <p className="text-[#ba1a1a] text-[12px] font-bold mt-3 animate-pulse">{errorMsg}</p>}
            </div>
          )}

          {/* ─── Select Units Step ─── */}
          {((client && step === 1) || (!client && step === 2)) && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-[18px] font-bold text-build-main dark:text-white">Seleccionar proyecto y unidades</h3>
                <p className="text-[13px] text-slate-500 dark:text-white/60">Elige un proyecto para consultar unidades disponibles.</p>
              </div>

              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">Proyecto</label>
                <div className="relative w-full lg:w-1/2">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/50 text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Buscar proyecto por nombre..."
                    value={projectSearch}
                    onChange={(e) => {
                      setProjectSearch(e.target.value);
                      setShowProjectSuggestions(true);
                    }}
                    onFocus={() => setShowProjectSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowProjectSuggestions(false), 200);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                  />
                  {showProjectSuggestions && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-[160px] overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg divide-y divide-slate-100 dark:divide-white/5">
                      {projects
                        .filter(p => p.nombre.toLowerCase().includes(projectSearch.toLowerCase()))
                        .length === 0 ? (
                          <p className="text-xs text-slate-400 dark:text-white/40 p-3">No se encontraron proyectos.</p>
                        ) : (
                          projects
                            .filter(p => p.nombre.toLowerCase().includes(projectSearch.toLowerCase()))
                            .map(p => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setProjectSearch(p.nombre);
                                  setShowProjectSuggestions(false);
                                }}
                                className="px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 flex justify-between items-center"
                              >
                                <span>{p.nombre}</span>
                                {selectedProjectId === p.id && (
                                  <span className="material-symbols-outlined text-[16px] text-build-main dark:text-white">check</span>
                                )}
                              </div>
                            ))
                        )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">Unidades Disponibles (Inventario)</label>
                {loadingUnits ? (
                  <p className="text-[13px] text-slate-500 dark:text-white/60 p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center flex items-center justify-center gap-2">
                     <svg className="animate-spin w-4 h-4 text-build-main dark:text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                     </svg>
                    Cargando inventario...
                  </p>
                ) : units.length === 0 ? (
                  <p className="text-[13px] text-slate-500 dark:text-white/60 p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center">No hay unidades disponibles en este proyecto.</p>
                ) : (
                  <div className="space-y-6">
                    {/* Departamentos */}
                    {units.filter(u => u.type !== "ESTACIONAMIENTO" && u.type !== "COCHERA" && u.type !== "DEPOSITO").length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 dark:text-white/50 uppercase tracking-wider mb-3">Departamentos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {units
                            .filter(u => u.type !== "ESTACIONAMIENTO" && u.type !== "COCHERA" && u.type !== "DEPOSITO")
                            .map(u => renderUnitCard(u))}
                        </div>
                      </div>
                    )}

                    {/* Estacionamientos */}
                    {units.filter(u => u.type === "ESTACIONAMIENTO" || u.type === "COCHERA").length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 dark:text-white/50 uppercase tracking-wider mb-3">Estacionamientos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {units
                            .filter(u => u.type === "ESTACIONAMIENTO" || u.type === "COCHERA")
                            .map(u => renderUnitCard(u))}
                        </div>
                      </div>
                    )}

                    {/* Depósitos */}
                    {units.filter(u => u.type === "DEPOSITO").length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 dark:text-white/50 uppercase tracking-wider mb-3">Depósitos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {units
                            .filter(u => u.type === "DEPOSITO")
                            .map(u => renderUnitCard(u))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {errorMsg && <p className="text-[#ba1a1a] text-[12px] font-bold mt-3 animate-pulse">{errorMsg}</p>}
              </div>
            </div>
          )}

          {/* ─── Confirm Step ─── */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <span className="material-symbols-outlined text-[48px] text-build-main dark:text-white">handshake</span>
                <h3 className="text-[20px] font-bold text-build-main dark:text-white mt-2">Resumen de asignación</h3>
                <p className="text-[13px] text-slate-500 dark:text-white/60 mt-1">Selecciona el tipo de financiamiento y confirma la asignación.</p>
              </div>

              {/* Financing selection */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-3">Tipo de Financiamiento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoFinanciamiento("CREDITO_HIPOTECARIO")}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      tipoFinanciamiento === "CREDITO_HIPOTECARIO"
                        ? "border-build-main bg-build-main/5"
                        : "border-slate-200 dark:border-white/10 hover:border-build-accent bg-white dark:bg-white/5"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[24px] mb-2 ${
                      tipoFinanciamiento === "CREDITO_HIPOTECARIO" ? "text-build-main dark:text-white" : "text-slate-400 dark:text-white/50"
                    }`}>account_balance</span>
                    <p className={`text-[13px] font-bold ${
                      tipoFinanciamiento === "CREDITO_HIPOTECARIO" ? "text-build-main dark:text-white" : "text-slate-600 dark:text-white/60"
                    }`}>Crédito Hipotecario</p>
                    <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5">Financiamiento bancario</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoFinanciamiento("CREDITO_DIRECTO")}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      tipoFinanciamiento === "CREDITO_DIRECTO"
                        ? "border-build-main bg-build-main/5"
                        : "border-slate-200 dark:border-white/10 hover:border-build-accent bg-white dark:bg-white/5"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[24px] mb-2 ${
                      tipoFinanciamiento === "CREDITO_DIRECTO" ? "text-build-main dark:text-white" : "text-slate-400 dark:text-white/50"
                    }`}>payments</span>
                    <p className={`text-[13px] font-bold ${
                      tipoFinanciamiento === "CREDITO_DIRECTO" ? "text-build-main dark:text-white" : "text-slate-600 dark:text-white/60"
                    }`}>Crédito Directo</p>
                    <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5">Pago directo a la empresa</p>
                  </button>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5 grid grid-cols-2 gap-6 relative overflow-hidden">
                <div className="relative z-10">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">
                    {selectedClients.length > 1 ? "Clientes Asignados" : "Cliente Asignado"}
                  </label>
                  <div className="space-y-1.5">
                    {selectedClients.map(c => (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-build-main flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {c.initials}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-build-main dark:text-white leading-tight">{c.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-white/50">{c.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative z-10 border-l border-slate-200 dark:border-white/10 pl-6">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">Unidades ({selectedProject?.nombre})</label>
                  <div className="space-y-1">
                    {selectedUnitIds.map(id => {
                      const u = units.find(unit => unit.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            {u?.type === "ESTACIONAMIENTO" || u?.type === "COCHERA" ? "directions_car" : u?.type === "DEPOSITO" ? "inventory_2" : "apartment"}
                          </span>
                          <span className="text-[13px] font-bold text-build-main dark:text-white">{u?.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-[#ffdad6]/50 border border-[#ba1a1a]/30 animate-pulse">
                  <p className="text-[14px] font-bold text-[#ba1a1a] flex items-center gap-2">
                    <span className="material-symbols-outlined">warning</span>{errorMsg}
                  </p>
                </div>
              )}
              {successMsg && (
                <div className="p-4 rounded-xl bg-[#d6f0e0] border border-[#27a85e]/30 flex flex-col items-center justify-center text-center animate-fade-in shadow-inner">
                  <div className="w-10 h-10 rounded-full bg-[#1c663b] flex justify-center items-center mb-2 shadow-[0_0_15px_rgba(39,168,94,0.4)]">
                    <span className="material-symbols-outlined text-white text-[20px]">check</span>
                  </div>
                  <p className="text-[14px] font-bold text-[#1c663b] leading-tight">{successMsg}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-8 py-4 bg-white dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex justify-between shrink-0">
          <button
            disabled={loading || successMsg !== ""}
            onClick={() => {
              if (client) {
                // 2-step flow
                if (step === 1) onClose();
                else setStep(1);
              } else {
                // 3-step flow
                if (step === 1) onClose();
                else if (step === 2) setStep(1);
                else setStep(2);
              }
            }}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:bg-white/5 hover:text-build-main dark:text-white rounded-xl transition-colors"
          >
            {step === 1 ? "Cancelar" : "Volver"}
          </button>

          {/* Step 1 (no client): Next from persons */}
          {!client && step === 1 && (
            <button onClick={handleNextStep1NoClient} className="px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all flex items-center gap-2 shadow-sm">
              Siguiente <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}

          {/* Select Units → Next */}
          {((client && step === 1) || (!client && step === 2)) && (
            <button onClick={handleNextStepUnits} className="px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all flex items-center gap-2 shadow-sm">
              Siguiente <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}

          {/* Confirm */}
          {step === 3 && (
            <button
              onClick={handleConfirmAssignment}
              disabled={loading || successMsg !== ""}
              className="px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm relative overflow-hidden"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg> Procesando...
                </>
              ) : successMsg ? "Asignado" : (
                <>
                  Confirmar asignación <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Loading Overlay Global */}
        {loading && <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] z-50 rounded-2xl pointer-events-none"></div>}

      </div>
    </div>
  );
}
