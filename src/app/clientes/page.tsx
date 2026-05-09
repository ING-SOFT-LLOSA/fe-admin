"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

// --- Mock Data ---
type UnitStatus = "Disponible" | "Reservado" | "Vendido";
type Unit = { id: string; project: string; name: string; status: UnitStatus; type: string };

const MOCK_PROJECTS = ["Torre Aviana", "Parque Sur", "Vistas del Golf"];

const INITIAL_UNITS: Unit[] = [
  { id: "A101", project: "Torre Aviana", name: "Dpto 101", status: "Disponible", type: "Departamento" },
  { id: "A102", project: "Torre Aviana", name: "Dpto 102", status: "Reservado", type: "Departamento" },
  { id: "A201", project: "Torre Aviana", name: "Dpto 201", status: "Disponible", type: "Departamento" },
  { id: "A-C1", project: "Torre Aviana", name: "Estacionamiento 1", status: "Disponible", type: "Estacionamiento" },

  { id: "P501", project: "Parque Sur", name: "Dpto 501", status: "Disponible", type: "Departamento" },
  { id: "P502", project: "Parque Sur", name: "Dpto 502", status: "Disponible", type: "Departamento" },
  { id: "P-C1", project: "Parque Sur", name: "Estacionamiento E-01", status: "Disponible", type: "Estacionamiento" },

  { id: "V901", project: "Vistas del Golf", name: "Penthouse 901", status: "Disponible", type: "Departamento" },
];

const INITIAL_CLIENTS = [
  { initials: "CM", name: "Carlos Eduardo Mendoza", dni: "45892103", email: "c.mendoza@example.com", phone: "+51 987 654 321", project: "Torre Aviana - 1402", status: "Active", statusBg: "bg-[#E8F5E9] text-[#2E7D32]" },
  { initials: "MR", name: "Maria Fernanda Rojas", dni: "38471922", email: "m.rojas@example.com", phone: "+51 965 432 109", project: "Parque Sur - 501", status: "VIP", statusBg: "bg-[#c2e8ff] text-[#001e2b]" },
  { initials: "LD", name: "Luis Delgado Torres", dni: "52013847", email: "l.delgado@example.com", phone: "+51 941 238 765", project: "Torre Aviana - 1104", status: "Active", statusBg: "bg-[#E8F5E9] text-[#2E7D32]" },
  { initials: "EV", name: "Elena Vargas Castro", dni: "61204837", email: "e.vargas@example.com", phone: "+51 912 345 678", project: "Parque Sur - 802", status: "Inactive", statusBg: "bg-[#eeeeef] text-[#41484c]" },
];

export default function ClientsPage() {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [units, setUnits] = useState(INITIAL_UNITS);

  // Modal Wizard State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [forceConflict, setForceConflict] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Project & Units Selection
  const [selectedProject, setSelectedProject] = useState(MOCK_PROJECTS[0]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  // Step 2: Client Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedClient, setSearchedClient] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  // Revoke / Resolve Contract States (CU006)
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [clientToRevoke, setClientToRevoke] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState("Desistimiento");

  // Helpers
  const availableUnitsForProject = units.filter(u => u.project === selectedProject && u.status === "Disponible");

  function openWizard() {
    setStep(1);
    setSelectedProject(MOCK_PROJECTS[0]);
    setSelectedUnitIds([]);
    setSearchQuery("");
    setSearchedClient(null);
    setSearchError("");
    setErrorMsg("");
    setSuccessMsg("");
    setForceConflict(false);
    setIsModalOpen(true);
  }

  function handleNextStep1() {
    if (selectedUnitIds.length === 0) {
      setErrorMsg("Debes seleccionar al menos una unidad para continuar.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  }

  function handleSearchClient() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchError("");
    setTimeout(() => {
      setLoading(false);
      const found = clients.find(c => c.dni.includes(searchQuery) || c.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (found) {
        setSearchedClient(found);
      } else {
        setSearchedClient(null);
        setSearchError("El cliente no existe en Modulo-Seguridad, proceda a registrarlo primero.");
      }
    }, 600);
  }

  function handleNextStep2() {
    if (!searchedClient) {
      setSearchError("Debes localizar y seleccionar un cliente.");
      return;
    }
    setStep(3);
  }

  function handleConfirmAssignment() {
    setLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      if (forceConflict) {
        setLoading(false);
        setErrorMsg("Colisión Concurrente: La unidad seleccionada ya se encuentra asignada a otro usuario.");
        setTimeout(() => {
          setUnits(units.map(u => selectedUnitIds.includes(u.id) ? { ...u, status: "Reservado" } : u));
          setSelectedUnitIds([]);
          setErrorMsg("");
          setStep(1);
        }, 2500);
        return;
      }

      setUnits(units.map(u => selectedUnitIds.includes(u.id) ? { ...u, status: "Reservado" } : u));
      const assignedNames = units.filter(u => selectedUnitIds.includes(u.id)).map(u => u.name).join(", ");

      // Update logic to either modify existing active client or add new to state if necessary (simplified mock)
      setClients(clients.map(c => c.dni === searchedClient.dni ? { ...c, project: c.project && c.project !== "Sin asignar" ? `${c.project}, ${selectedProject} - ${assignedNames}` : `${selectedProject} - ${assignedNames}`, status: "Active" } : c));

      setLoading(false);
      setSuccessMsg("Propiedad vinculada correctamente. El estado se actualizó a 'Reservado' y los hitos previos fueron completados.");

      setTimeout(() => {
        setIsModalOpen(false);
      }, 3000);

    }, 1200);
  }

  // --- CU006 ---
  function openRevokeModal(client: any) {
    setClientToRevoke({ ...client });
    setRevokeReason("Desistimiento");
    setRevokeOpen(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleRevokeContract() {
    setLoading(true);
    setSuccessMsg("");

    setTimeout(() => {
      // 1. Parse client's properties and count them
      const properties = clientToRevoke.project.split(", ").filter(Boolean);

      // 2. Logic: If multiple, remove only the first one found. (Mock simulation)
      let newProjectStr = "";
      let isInactive = false;

      if (properties.length > 1) {
        const removed = properties[0];
        const remaining = properties.slice(1).join(", ");
        newProjectStr = remaining;
      } else {
        newProjectStr = "Sin asignar";
        isInactive = true;
      }

      // Update Client table
      setClients(clients.map(c =>
        c.dni === clientToRevoke.dni
          ? { ...c, project: newProjectStr, status: isInactive ? "Inactive" : c.status, statusBg: isInactive ? "bg-[#eeeeef] text-[#41484c]" : c.statusBg }
          : c
      ));

      // Simulate updating inventory
      setUnits(units.map(u => u.status === "Reservado" && properties[0].includes(u.name) ? { ...u, status: "Disponible" } : u));

      setLoading(false);
      setSuccessMsg(isInactive
        ? "Contrato resuelto. La unidad vuelve a inventario abierto y el acceso a S3 del cliente se ha bloqueado de inmediato."
        : "Unidad resuelta correctamente. El cliente sigue activo porque posee más propiedades en cartera."
      );

      setTimeout(() => {
        setRevokeOpen(false);
        setClientToRevoke(null);
      }, 4000);

    }, 1500);
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#1a1c1d]">Gestión de Comercial y Ventas</h2>
          <p className="text-base text-[#41484c] mt-2">Administra registros de clientes, contactos y vinculaciones con propiedades.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-[#e2e2e4] rounded-xl text-[#1a1c1d] text-xs font-semibold hover:bg-[#eeeeef] transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person_add</span>Nuevo Cliente
          </button>
          <button
            onClick={openWizard}
            className="px-4 py-2 bg-[#023143] text-white rounded-xl text-xs font-semibold hover:bg-[#001b27] transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(2,49,67,0.25)] hover:shadow-[0_6px_20px_rgba(2,49,67,0.35)]"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>Asignar Propiedad
          </button>
        </div>
      </div>

      {/* Analytics / KPI Mini */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#e2e2e4] p-5 shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
          <h4 className="text-[12px] font-bold text-[#72787c] uppercase">Clientes Totales</h4>
          <div className="text-[24px] font-bold text-[#1a1c1d] mt-1">{clients.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e2e4] p-5 shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
          <h4 className="text-[12px] font-bold text-[#72787c] uppercase">Unidades Disponibles</h4>
          <div className="text-[24px] font-bold text-[#27a85e] mt-1">{units.filter(u => u.status === "Disponible").length}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e2e4] p-5 shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
          <h4 className="text-[12px] font-bold text-[#72787c] uppercase">Reservas Activas</h4>
          <div className="text-[24px] font-bold text-[#e18b1d] mt-1">{units.filter(u => u.status === "Reservado").length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e2e4] shadow-[0_4px_20px_rgba(2,49,67,0.03)] overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e2e4] bg-[#f9f9fb]">
                {["Cliente", "DNI / RUC", "Email", "Teléfono", "Unidades Asignadas", "Estado", "Acciones"].map(h => (
                  <th key={h} className="py-4 px-6 text-[12px] font-semibold text-[#023143] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm text-[#1a1c1d]">
              {clients.map((c) => (
                <tr key={c.dni} className="border-b border-[#e2e2e4] hover:bg-[#f4f3f5]/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#f4f3f5] flex items-center justify-center text-[#023143] text-xs font-bold">{c.initials}</div>
                      <span className="font-semibold text-[#1a1c1d]">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[#41484c]">{c.dni}</td>
                  <td className="py-4 px-6 text-[#72787c]">{c.email}</td>
                  <td className="py-4 px-6 text-[#41484c]">{c.phone}</td>
                  <td className="py-4 px-6 font-medium text-[#023143]">{c.project}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${c.statusBg}`}>{c.status}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.project && c.project !== "Sin asignar" && (
                        <button
                          onClick={() => openRevokeModal(c)}
                          className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-md transition-colors"
                          title="Resolver Contrato / Desvincular"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      )}
                      <button className="text-[#41484c] hover:text-[#023143] hover:bg-[#f4f3f5] transition-colors p-1.5 rounded-md">
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[650px] animate-slide-up relative">

            {/* Header */}
            <div className="px-8 py-5 border-b border-[#e2e2e4] flex justify-between items-center bg-[#f9f9fb] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#c2e8ff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#023143]">key</span>
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-[#1a1c1d]">Asignación de Propiedades a Clientes</h2>
                  <p className="text-[12px] text-[#41484c] font-medium mt-0.5">Paso {step} de 3</p>
                </div>
              </div>
              <button disabled={loading} onClick={() => setIsModalOpen(false)} className="text-[#c1c7cc] hover:text-[#ba1a1a] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="h-1 w-full bg-[#f4f3f5]">
              <div className="h-full bg-[#023143] transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">

              {/* Step 1: Inventory */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-[18px] font-bold text-[#1a1c1d]">Selecciona Proyecto e Inventario</h3>
                    <p className="text-[13px] text-[#72787c]">Elige un proyecto para consultar unidades disponibles que el cliente adquirirá.</p>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider mb-2">Proyecto</label>
                    <select
                      value={selectedProject}
                      onChange={e => { setSelectedProject(e.target.value); setSelectedUnitIds([]); }}
                      className="w-full lg:w-1/2 px-4 py-2.5 bg-[#f9f9fb] border border-[#c1c7cc] rounded-lg text-sm font-semibold focus:outline-none focus:border-[#023143] focus:ring-1 focus:ring-[#023143]"
                    >
                      {MOCK_PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider mb-2">Unidades Disponibles (Inventario)</label>
                    {availableUnitsForProject.length === 0 ? (
                      <p className="text-[13px] text-[#72787c] p-4 bg-[#f4f3f5] rounded-lg text-center">No hay unidades disponibles en este proyecto.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableUnitsForProject.map(u => {
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
                                ? "border-[#023143] bg-[#023143]/5"
                                : "border-[#e2e2e4] hover:border-[#c1c7cc] bg-white"
                                }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`material-symbols-outlined text-[20px] ${isSelected ? "text-[#023143]" : "text-[#72787c]"}`}>
                                  {u.type === "Departamento" ? "apartment" : "directions_car"}
                                </span>
                                {isSelected && <span className="material-symbols-outlined text-[16px] text-[#023143]">check_circle</span>}
                              </div>
                              <h4 className={`text-[14px] font-bold ${isSelected ? "text-[#023143]" : "text-[#1a1c1d]"}`}>{u.name}</h4>
                              <p className="text-[11px] text-[#72787c] mt-0.5">{u.id}</p>
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
                    <h3 className="text-[18px] font-bold text-[#1a1c1d]">Asignar Cliente</h3>
                    <p className="text-[13px] text-[#72787c]">Localiza al cliente en nuestra base de Módulo-Seguridad ingresando su DNI o Nombre.</p>
                  </div>

                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72787c] text-[18px]">search</span>
                        <input
                          type="text"
                          placeholder="Buscar por DNI o Nombre... (ej. Carlos, 4589...)"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSearchClient()}
                          className="w-full pl-10 pr-4 py-3 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143] focus:ring-1 focus:ring-[#023143]"
                        />
                      </div>
                      <button
                        onClick={handleSearchClient}
                        disabled={loading || !searchQuery.trim()}
                        className="px-6 py-3 bg-[#e2e2e4] text-[#1a1c1d] rounded-lg font-bold text-sm hover:bg-[#c1c7cc] transition-colors disabled:opacity-50"
                      >
                        {loading ? "Buscando..." : "Buscar"}
                      </button>
                    </div>
                    {searchError && (
                      <div className="mt-4 p-3 bg-[#ffdad6]/40 border border-[#ba1a1a]/20 rounded-lg flex gap-2 items-center">
                        <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">error</span>
                        <span className="text-[#ba1a1a] text-[12px] font-bold">{searchError}</span>
                      </div>
                    )}
                  </div>

                  {searchedClient && !loading && (
                    <div className="mt-6 border-2 border-[#023143] rounded-xl p-5 bg-[#023143]/5 flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#023143] flex items-center justify-center text-white text-[16px] font-bold">
                          {searchedClient.initials}
                        </div>
                        <div>
                          <h4 className="text-[16px] font-bold text-[#1a1c1d]">{searchedClient.name}</h4>
                          <p className="text-[13px] text-[#41484c]">DNI: {searchedClient.dni} | {searchedClient.email}</p>
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
                  <div className="text-center mb-8">
                    <span className="material-symbols-outlined text-[48px] text-[#023143]">handshake</span>
                    <h3 className="text-[20px] font-bold text-[#1a1c1d] mt-2">Confirmar Reserva y Asignación</h3>
                    <p className="text-[13px] text-[#72787c] mt-1">Revisa los datos antes de persistir los cambios en la base de datos central y notificar a los sistemas.</p>
                  </div>

                  <div className="bg-[#f9f9fb] border border-[#e2e2e4] rounded-xl p-6 grid grid-cols-2 gap-8 relative overflow-hidden">
                    {/* Decorative background circle */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#c2e8ff] opacity-20 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase tracking-wider mb-2">Cliente Asignado</label>
                      <h4 className="text-[16px] font-bold text-[#1a1c1d]">{searchedClient?.name}</h4>
                      <p className="text-[13px] text-[#41484c]">DNI: {searchedClient?.dni}</p>
                    </div>
                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase tracking-wider mb-2">Unidades (Inventario)</label>
                      <div className="space-y-1.5">
                        {selectedUnitIds.map(id => {
                          const u = units.find(unit => unit.id === id);
                          return (
                            <div key={id} className="flex flex-col border-b border-[#e2e2e4] pb-1.5 last:border-0">
                              <span className="text-[14px] font-bold text-[#023143]">{selectedProject}</span>
                              <span className="text-[12px] text-[#1a1c1d]">{u?.name} ({u?.type})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Alterations simulator for demo */}
                  <div className="flex items-center justify-between p-4 border border-[#e2e2e4] rounded-lg mt-8">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#1a1c1d]">Simulador de Concurrencia</h4>
                      <p className="text-[11px] text-[#72787c]">Obliga a fallar el proceso indicando que otro agente la asignó simultaneamente.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={forceConflict} onChange={e => setForceConflict(e.target.checked)} />
                      <div className="w-9 h-5 bg-[#c1c7cc] rounded-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ba1a1a]"></div>
                    </label>
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
                    <div className="p-6 rounded-xl bg-[#d6f0e0] border border-[#27a85e]/30 flex flex-col items-center justify-center text-center animate-fade-in shadow-inner">
                      <div className="w-12 h-12 rounded-full bg-[#1c663b] flex justify-center items-center mb-3 shadow-[0_0_15px_rgba(39,168,94,0.4)]">
                        <span className="material-symbols-outlined text-white text-[24px]">check</span>
                      </div>
                      <p className="text-[15px] font-bold text-[#1c663b] leading-tight">{successMsg}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-8 py-4 bg-[#f9f9fb] border-t border-[#e2e2e4] flex justify-between shrink-0">
              <button
                disabled={loading || successMsg !== ""}
                onClick={() => {
                  if (step === 1) setIsModalOpen(false);
                  else setStep(prev => (prev - 1) as any);
                }}
                className="px-5 py-2.5 text-sm font-bold text-[#41484c] hover:text-[#1a1c1d] transition-colors"
              >
                {step === 1 ? "Cancelar" : "Volver"}
              </button>

              {step === 1 && (
                <button onClick={handleNextStep1} className="px-6 py-2.5 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(2,49,67,0.25)]">
                  Siguiente <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              )}
              {step === 2 && (
                <button onClick={handleNextStep2} disabled={!searchedClient} className="px-6 py-2.5 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_4px_14px_rgba(2,49,67,0.25)]">
                  Siguiente <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleConfirmAssignment}
                  disabled={loading || successMsg !== ""}
                  className="px-6 py-2.5 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_14px_rgba(2,49,67,0.25)] relative overflow-hidden"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg> Validando Inventario...
                    </>
                  ) : successMsg ? "Asignado" : (
                    <>
                      Confirmar Asignación <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Loading Overlay Global (Optional) */}
            {loading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-50 rounded-2xl pointer-events-none"></div>}

          </div>
        </div>
      )}

      {/* CU006: Revoke / Resolve Contract Modal */}
      {revokeOpen && clientToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative overflow-hidden">

            {/* Decorative Warning Element */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#ffdad6] opacity-30 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center mb-5 border border-[#ba1a1a]/10 relative z-10 shadow-[0_0_20px_rgba(186,26,26,0.1)]">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[32px]">assignment_add</span>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <span className="material-symbols-outlined text-[#1a1c1d] text-[16px]">close</span>
                </div>
              </div>

              <h3 className="text-[22px] font-bold text-[#1a1c1d] mb-2 leading-tight">Resolver Contrato</h3>
              <p className="text-[14px] text-[#41484c] mb-6">
                El cliente <b>{clientToRevoke.name}</b> cuenta con las siguientes propiedades: <br />
                <span className="text-[#ba1a1a] font-bold mt-2 inline-block border border-[#ba1a1a]/20 bg-[#ffdad6]/20 px-3 py-1 rounded-lg">
                  {clientToRevoke.project}
                </span>
              </p>

              {!successMsg && (
                <div className="w-full text-left mb-8 animate-fade-in">
                  <label className="block text-[12px] font-bold text-[#41484c] mb-2">Motivo de Resolución Interbancaria/Contrato:</label>
                  <select
                    value={revokeReason}
                    onChange={e => setRevokeReason(e.target.value)}
                    className="w-full px-4 py-3 border border-[#c1c7cc] rounded-lg text-sm font-medium focus:outline-none focus:border-[#ba1a1a] hover:border-[#ba1a1a]/50 bg-white"
                  >
                    <option value="Desistimiento">Desistimiento Voluntario</option>
                    <option value="Falta de pago">Resolución por Falta de Pago</option>
                    <option value="Legal">Resolución Legal / Otros</option>
                  </select>

                  <div className="flex gap-3 items-start mt-5 p-3 rounded-xl bg-[#f4f3f5] border border-[#e2e2e4]">
                    <span className="material-symbols-outlined text-[#72787c]">policy</span>
                    <p className="text-[12px] text-[#41484c] leading-relaxed">
                      Al confirmar, el sistema <b>limpiará el inventario asociado devolviendo la unidad a estado "Disponible"</b>,
                      revocará en tiempo real el <span className="font-semibold text-[#023143]">acceso a los Documentos</span> y lo
                      enviará al historial de inmutabilidad (auditoría).
                    </p>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="w-full p-6 bg-[#d6f0e0] border border-[#27a85e]/20 rounded-xl flex items-center gap-4 mb-6 shadow-inner animate-slide-up text-left z-10 relative">
                  <span className="material-symbols-outlined text-[32px] text-[#1c663b]">check_circle</span>
                  <p className="text-[14px] font-bold text-[#1c663b]">{successMsg}</p>
                </div>
              )}
            </div>

            {!successMsg && (
              <div className="flex gap-3 justify-end relative z-10 w-full pt-4 border-t border-[#e2e2e4]">
                <button
                  disabled={loading}
                  onClick={() => setRevokeOpen(false)}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-[#41484c] hover:bg-[#f4f3f5] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRevokeContract}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#ba1a1a] text-white rounded-lg text-sm font-bold hover:bg-[#93000a] transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_14px_rgba(186,26,26,0.25)]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg> Invalidando accesos S3...
                    </>
                  ) : "Concluir Resolución"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
