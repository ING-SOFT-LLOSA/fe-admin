"use client";

import React, { useState, useEffect } from "react";
import { fetchUsuarios, mapUsuarioToClienteRow } from "@/lib/api/users";
import { asignarActivo } from "@/lib/api/expedientes";
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const totalSteps = client ? 2 : 3;
  const currentStep = client ? (step === 3 ? 2 : 1) : step;
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Inventory
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [units, setUnits] = useState<UnitSelection[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Step 2: Client
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<ClienteRow[]>([]);
  const [searchedClient, setSearchedClient] = useState<ClienteRow | null>(client || null);
  const [searchError, setSearchError] = useState("");

  // Step 3: Details (CU004 requires these)
  const [tipoFinanciamiento, setTipoFinanciamiento] = useState("CREDITO_HIPOTECARIO");

  // Load Projects on mount
  useEffect(() => {
    fetchProyectos().then(data => {
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    }).catch(() => setErrorMsg("No se pudieron cargar los proyectos"));
    
    // Preload clients for search
    fetchUsuarios().then(data => setClients(data.map(mapUsuarioToClienteRow))).catch(console.error);
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
          name: `${a.tipo === 'ESTACIONAMIENTO' ? 'Estac.' : 'Dpto'} ${a.nro}`,
          type: a.tipo
        }));
        setUnits(availableUnits);
      })
      .catch(() => setErrorMsg("Error cargando inventario del proyecto"))
      .finally(() => setLoadingUnits(false));
  }, [selectedProjectId]);

  function handleNextStep1() {
    if (selectedUnitIds.length === 0) {
      setErrorMsg("Debes seleccionar al menos una unidad para continuar.");
      return;
    }
    setErrorMsg("");
    setStep(client ? 3 : 2);
  }

  function handleSearchClient() {
    if (!searchQuery.trim()) return;
    setSearchError("");
    const q = searchQuery.trim().toLowerCase();
    const found = clients
      .filter((c) => c.tipoUsuario === "CLIENTE")
      .find(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.dni !== "—" && c.dni.includes(searchQuery.trim()))
      );
    if (found) {
      setSearchedClient(found);
    } else {
      setSearchedClient(null);
      setSearchError("No encontramos al cliente. Regístralo primero en el sistema para continuar.");
    }
  }

  function handleNextStep2() {
    if (!searchedClient) {
      setSearchError("Debes localizar y seleccionar un cliente.");
      return;
    }
    setStep(3);
  }

  async function handleConfirmAssignment() {
    if (!searchedClient || selectedUnitIds.length === 0) return;
    
    setLoading(true);
    setErrorMsg("");

    try {
      // Create a promise for each unit selected
      const assignments = selectedUnitIds.map(unitId => 
        asignarActivo({
          idUsuario: searchedClient.id,
          idActivo: unitId,
          tipoFinanciamiento,
          faseComercial: "SEPARACION",
          estadoTramiteLegal: "EN_PROCESO",
          fechaAdquisicion: new Date().toISOString()
        })
      );
      
      await Promise.all(assignments);
      
      setSuccessMsg("Unidad asignada correctamente.");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setErrorMsg("Ocurrió un error al asignar la unidad.");
    } finally {
      setLoading(false);
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

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
              <p className="text-[12px] text-slate-500 dark:text-white/60 font-medium mt-0.5">Paso {currentStep} de {totalSteps}</p>
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

          {/* Step 1: Inventory */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-[18px] font-bold text-build-main dark:text-white">Seleccionar proyecto y unidad</h3>
                <p className="text-[13px] text-slate-500 dark:text-white/60">Elige un proyecto para consultar unidades disponibles.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">Proyecto</label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full lg:w-1/2 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                >
                  {projects.length === 0 && <option value="">Cargando proyectos...</option>}
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {units.map(u => {
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
                              {u.type === "ESTACIONAMIENTO" ? "directions_car" : "apartment"}
                            </span>
                            {isSelected && <span className="material-symbols-outlined text-[16px] text-build-main dark:text-white">check_circle</span>}
                          </div>
                          <h4 className={`text-[13px] font-bold leading-tight ${isSelected ? "text-build-main dark:text-white" : "text-build-main dark:text-white"}`}>{u.name}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-white/50 mt-1 font-mono truncate" title={u.id}>{u.id}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {errorMsg && <p className="text-[#ba1a1a] text-[12px] font-bold mt-3 animate-pulse">{errorMsg}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Client */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-[18px] font-bold text-build-main dark:text-white">Confirmar cliente</h3>
                <p className="text-[13px] text-slate-500 dark:text-white/60">Busca por nombre, documento o correo para continuar con la asignación.</p>
              </div>

              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/50 text-[18px]">search</span>
                    <input
                      type="text"
                      placeholder="Buscar por nombre, correo o documento"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearchClient()}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                    />
                  </div>
                  <button
                    onClick={handleSearchClient}
                    disabled={!searchQuery.trim()}
                    className="px-6 py-3 bg-slate-100 dark:bg-white/10 text-build-main dark:text-white rounded-xl font-bold text-sm hover:bg-slate-200 dark:bg-white/15 transition-colors disabled:opacity-50"
                  >
                    Buscar
                  </button>
                </div>
                {searchError && (
                  <div className="mt-4 p-3 bg-[#ffdad6]/40 border border-[#ba1a1a]/20 rounded-lg flex gap-2 items-center">
                    <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">error</span>
                    <span className="text-[#ba1a1a] text-[12px] font-bold">{searchError}</span>
                  </div>
                )}
              </div>

              {searchedClient && (
                <div className="mt-6 border-2 border-build-main rounded-xl p-5 bg-build-main/5 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-build-main flex items-center justify-center text-white text-[16px] font-bold">
                      {searchedClient.initials}
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-build-main dark:text-white">{searchedClient.name}</h4>
                      <p className="text-[13px] text-slate-500 dark:text-white/60">
                        {searchedClient.dni !== "—" ? `Documento: ${searchedClient.dni} | ` : ""}{searchedClient.email}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#27a85e] text-[32px]">check_circle</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <span className="material-symbols-outlined text-[48px] text-build-main dark:text-white">handshake</span>
                <h3 className="text-[20px] font-bold text-build-main dark:text-white mt-2">Resumen de asignación</h3>
                <p className="text-[13px] text-slate-500 dark:text-white/60 mt-1">Ingresa las condiciones de financiamiento y confirma la asignación.</p>
              </div>

              {/* Form */}
              <div className="mb-4">
                 <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">Financiamiento</label>
                    <select
                      value={tipoFinanciamiento}
                      onChange={e => setTipoFinanciamiento(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-build-accent"
                    >
                      <option value="CREDITO_HIPOTECARIO">Crédito Hipotecario</option>
                      <option value="CREDITO_DIRECTO">Crédito Directo</option>
                    </select>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5 grid grid-cols-2 gap-6 relative overflow-hidden">
                <div className="relative z-10">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-1">Cliente Asignado</label>
                  <h4 className="text-[14px] font-bold text-build-main dark:text-white">{searchedClient?.name}</h4>
                  <p className="text-[12px] text-slate-500 dark:text-white/60">{searchedClient?.email}</p>
                </div>
                <div className="relative z-10 border-l border-slate-200 dark:border-white/10 pl-6">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-1">Unidades ({selectedProject?.nombre})</label>
                  <div className="space-y-1">
                    {selectedUnitIds.map(id => {
                      const u = units.find(unit => unit.id === id);
                      return (
                        <div key={id} className="flex flex-col">
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
              if (step === 1) onClose();
              else if (client) setStep(1);
              else setStep((prev) => (prev === 3 ? 2 : 1));
            }}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:bg-white/5 hover:text-build-main dark:text-white rounded-xl transition-colors"
          >
            {step === 1 ? "Cancelar" : "Volver"}
          </button>

          {step === 1 && (
            <button onClick={handleNextStep1} className="px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all flex items-center gap-2 shadow-sm">
              Siguiente <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}
          {step === 2 && (
            <button onClick={handleNextStep2} disabled={!searchedClient} className="px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm">
              Siguiente <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}
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
        {loading && <div className="absolute inset-0 bg-white dark:bg-white/5/40 backdrop-blur-[1px] z-50 rounded-2xl pointer-events-none"></div>}

      </div>
    </div>
  );
}
