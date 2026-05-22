"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CreateClienteModal from "@/components/clientes/CreateClienteModal";
import EditClienteModal from "@/components/clientes/EditClienteModal";
import ViewClienteModal from "@/components/clientes/ViewClienteModal";
import DeleteUsuarioModal from "@/components/clientes/DeleteUsuarioModal";
import { useAuth } from "@/contexts/AuthContext";
import { canEliminarUsuario } from "@/lib/auth/permissions";
import { fetchUsuarios, mapUsuarioToClienteRow } from "@/lib/api/users";
import type { ClienteRow } from "@/types/user";

// --- Mock Data ---
type UnitStatus = "Disponible" | "Reservado" | "Vendido" | "Bloqueado";
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

export default function ClientsPage() {
  const { perfil } = useAuth();
  const [clients, setClients] = useState<ClienteRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ClienteRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClienteRow | null>(null);
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
  const [searchedClient, setSearchedClient] = useState<ClienteRow | null>(null);
  const [searchError, setSearchError] = useState("");

  // Revoke / Resolve Contract States (CU006)
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [clientToRevoke, setClientToRevoke] = useState<ClienteRow | null>(null);
  const [revokeReason, setRevokeReason] = useState("Desistimiento");

  // Helpers
  const availableUnitsForProject = units.filter(u => u.project === selectedProject && u.status === "Disponible");

  async function reloadClients(showSpinner = true) {
    if (showSpinner) setListLoading(true);
    setListError(null);
    try {
      const usuarios = await fetchUsuarios();
      setClients(usuarios.map(mapUsuarioToClienteRow));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios.");
    } finally {
      if (showSpinner) setListLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void reloadClients();
    });
  }, []);

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
      const q = searchQuery.trim().toLowerCase();
      const found = clients
        .filter((c) => c.tipoUsuario === "CLIENTE")
        .find(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.dni !== "—" && c.dni.includes(searchQuery.trim())),
        );
      if (found) {
        setSearchedClient(found);
      } else {
        setSearchedClient(null);
        setSearchError("No encontramos al cliente. Regístralo primero para continuar con la asignación.");
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
        setErrorMsg("La unidad seleccionada ya fue vinculada por otro usuario. Actualiza inventario e intenta nuevamente.");
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
      if (!searchedClient) return;
      setClients(clients.map(c => c.id === searchedClient.id ? { ...c, project: c.project && c.project !== "Sin asignar" ? `${c.project}, ${selectedProject} - ${assignedNames}` : `${selectedProject} - ${assignedNames}`, status: "Con propiedad reservada", statusBg: "bg-[#c2e8ff] text-[#001e2b]" } : c));

      setLoading(false);
      setSuccessMsg("Propiedad vinculada correctamente. El cliente queda con estado 'Con propiedad reservada'.");

      setTimeout(() => {
        setIsModalOpen(false);
      }, 3000);

    }, 1200);
  }

  // --- CU006 ---
  function openDeleteModal(client: ClienteRow) {
    setUserToDelete(client);
    setDeleteOpen(true);
  }

  function openRevokeModal(client: ClienteRow) {
    setClientToRevoke({ ...client });
    setRevokeReason("Desistimiento");
    setRevokeOpen(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleRevokeContract() {
    if (!clientToRevoke) return;
    setLoading(true);
    setSuccessMsg("");

    setTimeout(() => {
      const activeClient = clientToRevoke;
      // 1. Parse client's properties and count them
      const properties = activeClient.project.split(", ").filter(Boolean);

      // 2. Logic: If multiple, remove only the first one found. (Mock simulation)
      let newProjectStr = "";
      let isInactive = false;

      if (properties.length > 1) {
        const remaining = properties.slice(1).join(", ");
        newProjectStr = remaining;
      } else {
        newProjectStr = "Sin asignar";
        isInactive = true;
      }

      // Update Client table
      setClients(clients.map(c =>
        c.id === activeClient.id
          ? { ...c, project: newProjectStr, status: isInactive ? "Inactivo" : "En seguimiento", statusBg: isInactive ? "bg-[#eeeeef] text-build-accent" : "bg-[#fff3e0] text-[#e65100]" }
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
    <>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main">Clientes y Asignaciones</h2>
          <p className="text-base text-slate-600 mt-2">Registra clientes, gestiona sus datos y vincula propiedades a su perfil.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 border border-build-accent rounded-xl text-build-main text-xs font-semibold hover:bg-build-bg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>Crear cliente
          </button>
          <button
            onClick={openWizard}
            className="px-4 py-2 bg-build-main text-white rounded-xl text-xs font-semibold hover:bg-build-main/90 transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(2,49,67,0.25)] hover:shadow-[0_6px_20px_rgba(2,49,67,0.35)]"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>Asignar propiedad
          </button>
        </div>
      </div>

      {/* Analytics / KPI Mini */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Clientes Totales</h4>
          <div className="text-[24px] font-bold text-build-main mt-1">
            {clients.filter((c) => c.tipoUsuario === "CLIENTE").length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Unidades Disponibles</h4>
          <div className="text-[24px] font-bold text-[#27a85e] mt-1">{units.filter(u => u.status === "Disponible").length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Reservas Activas</h4>
          <div className="text-[24px] font-bold text-build-accent mt-1">{units.filter(u => u.status === "Reservado").length}</div>
        </div>
      </div>

      {listError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {listError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                {["Cliente", "DNI / RUC", "Email", "Teléfono", "Unidades Asignadas", "Estado", "Acciones"].map(h => (
                  <th key={h} className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm text-build-main">
              {listLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-build-accent">
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Cargando usuarios…
                    </span>
                  </td>
                </tr>
              )}
              {!listLoading && !listError && clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-build-accent">
                    No hay usuarios registrados. Crea clientes con POST /api/users/register.
                  </td>
                </tr>
              )}
              {!listLoading && clients.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => { setSelectedClient(c); setViewOpen(true); }}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-full bg-build-bg flex items-center justify-center text-build-main text-xs font-bold">{c.initials}</div>
                      <div>
                        <span className="font-semibold text-build-main">{c.name}</span>
                        {c.tipoUsuario === "EMPLEADO" && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-build-accent">
                            {c.rol ?? "Empleado"}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-build-accent">{c.dni}</td>
                  <td className="py-4 px-6 text-build-accent">{c.email}</td>
                  <td className="py-4 px-6 text-build-accent">{c.phone}</td>
                  <td className="py-4 px-6 font-medium text-build-main">{c.project}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${c.statusBg}`}>{c.status}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedClient(c); setEditOpen(true); }}
                        className="text-build-main hover:bg-[#c2e8ff] p-1.5 rounded-md transition-colors"
                        title="Editar perfil"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      {c.project && c.project !== "Sin asignar" && (
                        <Link
                          href={`/clientes/${c.id}/expediente`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-build-main hover:bg-[#c2e8ff] p-1.5 rounded-md transition-colors"
                          title="Ver expediente"
                        >
                          <span className="material-symbols-outlined text-[18px]">folder_managed</span>
                        </Link>
                      )}
                      {c.project && c.project !== "Sin asignar" && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openRevokeModal(c); }}
                          className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-md transition-colors"
                          title="Resolver Contrato / Desvincular"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      )}
                      {canEliminarUsuario(perfil, c) && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(c); }}
                          className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-md transition-colors"
                          title="Eliminar usuario"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
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
            <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-build-main">key</span>
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-build-main">Flujo guiado de asignación</h2>
                  <p className="text-[12px] text-slate-500 font-medium mt-0.5">Paso {step} de 3</p>
                </div>
              </div>
              <button disabled={loading} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-build-main transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="h-1 w-full bg-build-bg">
              <div className="h-full bg-build-main transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">

              {/* Step 1: Inventory */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-[18px] font-bold text-build-main">Seleccionar proyecto y unidad</h3>
                    <p className="text-[13px] text-slate-500">Elige un proyecto para consultar unidades disponibles que el cliente adquirirá.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Proyecto</label>
                    <select
                      value={selectedProject}
                      onChange={e => { setSelectedProject(e.target.value); setSelectedUnitIds([]); }}
                      className="w-full lg:w-1/2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                    >
                      {MOCK_PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Unidades Disponibles (Inventario)</label>
                    {availableUnitsForProject.length === 0 ? (
                      <p className="text-[13px] text-slate-500 p-4 bg-slate-50 rounded-xl text-center">No hay unidades disponibles en este proyecto.</p>
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
                                ? "border-build-main bg-build-main/5"
                                : "border-slate-200 hover:border-build-accent bg-white"
                                }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`material-symbols-outlined text-[20px] ${isSelected ? "text-build-main" : "text-slate-400"}`}>
                                  {u.type === "Departamento" ? "apartment" : "directions_car"}
                                </span>
                                {isSelected && <span className="material-symbols-outlined text-[16px] text-build-main">check_circle</span>}
                              </div>
                              <h4 className={`text-[14px] font-bold ${isSelected ? "text-build-main" : "text-build-main"}`}>{u.name}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">{u.id}</p>
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
                    <h3 className="text-[18px] font-bold text-build-main">Confirmar cliente</h3>
                    <p className="text-[13px] text-slate-500">Busca por nombre, documento o correo para continuar con la asignación.</p>
                  </div>

                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input
                          type="text"
                          placeholder="Buscar por DNI o Nombre... (ej. Carlos, 4589...)"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSearchClient()}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                        />
                      </div>
                      <button
                        onClick={handleSearchClient}
                        disabled={loading || !searchQuery.trim()}
                        className="px-6 py-3 bg-slate-100 text-build-main rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
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
                    <div className="mt-6 border-2 border-build-main rounded-xl p-5 bg-build-main/5 flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-build-main flex items-center justify-center text-white text-[16px] font-bold">
                          {searchedClient.initials}
                        </div>
                        <div>
                          <h4 className="text-[16px] font-bold text-build-main">{searchedClient.name}</h4>
                          <p className="text-[13px] text-slate-500">DNI: {searchedClient.dni} | {searchedClient.email}</p>
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
                    <span className="material-symbols-outlined text-[48px] text-build-main">handshake</span>
                    <h3 className="text-[20px] font-bold text-build-main mt-2">Confirmar asignación</h3>
                    <p className="text-[13px] text-slate-500 mt-1">Revisa los datos finales antes de registrar la propiedad en el perfil del cliente.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-8 relative overflow-hidden">
                    {/* Decorative background circle */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#c2e8ff] opacity-20 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente Asignado</label>
                      <h4 className="text-[16px] font-bold text-build-main">{searchedClient?.name}</h4>
                      <p className="text-[13px] text-slate-500">DNI: {searchedClient?.dni}</p>
                    </div>
                    <div className="relative z-10">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Unidades (Inventario)</label>
                      <div className="space-y-1.5">
                        {selectedUnitIds.map(id => {
                          const u = units.find(unit => unit.id === id);
                          return (
                            <div key={id} className="flex flex-col border-b border-slate-200 pb-1.5 last:border-0">
                              <span className="text-[14px] font-bold text-build-main">{selectedProject}</span>
                              <span className="text-[12px] text-build-main">{u?.name} ({u?.type})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Alterations simulator for demo */}
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl mt-8">
                    <div>
                      <h4 className="text-[13px] font-bold text-build-main">Simular conflicto de asignación</h4>
                      <p className="text-[11px] text-slate-500">Usa esta opción para probar el mensaje cuando una unidad deja de estar disponible.</p>
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
            <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between shrink-0">
              <button
                disabled={loading || successMsg !== ""}
                onClick={() => {
                  if (step === 1) setIsModalOpen(false);
                  else setStep((prev) => (prev === 3 ? 2 : 1));
                }}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-build-main rounded-xl transition-colors"
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
                      </svg> Validando inventario...
                    </>
                  ) : successMsg ? "Asignado" : (
                    <>
                      Confirmar asignación <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
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
                  <span className="material-symbols-outlined text-build-main text-[16px]">close</span>
                </div>
              </div>

              <h3 className="text-[22px] font-bold text-build-main mb-2 leading-tight">Desvincular propiedad</h3>
              <p className="text-[14px] text-build-accent mb-6">
                El cliente <b>{clientToRevoke.name}</b> cuenta con las siguientes propiedades: <br />
                <span className="text-[#ba1a1a] font-bold mt-2 inline-block border border-[#ba1a1a]/20 bg-[#ffdad6]/20 px-3 py-1 rounded-lg">
                  {clientToRevoke.project}
                </span>
              </p>

              {!successMsg && (
                <div className="w-full text-left mb-8 animate-fade-in">
                  <label className="block text-[12px] font-bold text-build-accent mb-2">Motivo de Resolución Interbancaria/Contrato:</label>
                  <select
                    value={revokeReason}
                    onChange={e => setRevokeReason(e.target.value)}
                    className="w-full px-4 py-3 border border-build-accent rounded-lg text-sm font-medium focus:outline-none focus:border-[#ba1a1a] hover:border-[#ba1a1a]/50 bg-white"
                  >
                    <option value="Desistimiento">Desistimiento Voluntario</option>
                    <option value="Falta de pago">Resolución por Falta de Pago</option>
                    <option value="Legal">Resolución Legal / Otros</option>
                  </select>

                  <div className="flex gap-3 items-start mt-5 p-3 rounded-xl bg-build-bg border border-build-accent">
                    <span className="material-symbols-outlined text-build-accent">policy</span>
                    <p className="text-[12px] text-build-accent leading-relaxed">
                      Al confirmar, el sistema <b>limpiará el inventario asociado devolviendo la unidad a estado "Disponible"</b>,
                      revocará en tiempo real el <span className="font-semibold text-build-main">acceso a los Documentos</span> y lo
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
              <div className="flex gap-3 justify-end relative z-10 w-full pt-4 border-t border-build-accent">
                <button
                  disabled={loading}
                  onClick={() => setRevokeOpen(false)}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-build-accent hover:bg-build-bg transition-colors"
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

      <CreateClienteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => reloadClients(false)}
      />

      <DeleteUsuarioModal
        open={deleteOpen}
        usuario={userToDelete}
        onClose={() => {
          setDeleteOpen(false);
          setUserToDelete(null);
        }}
        onDeleted={() => reloadClients(false)}
      />

      <EditClienteModal
        open={editOpen}
        cliente={selectedClient}
        onClose={() => { setEditOpen(false); setSelectedClient(null); }}
        onUpdated={() => reloadClients(false)}
      />

      <ViewClienteModal
        open={viewOpen}
        cliente={selectedClient}
        onClose={() => { setViewOpen(false); setSelectedClient(null); }}
      />
    </>
  );
}
