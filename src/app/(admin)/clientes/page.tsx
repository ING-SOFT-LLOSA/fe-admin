"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CreateClienteModal from "@/components/clientes/CreateClienteModal";
import EditClienteModal from "@/components/clientes/EditClienteModal";
import ViewClienteModal from "@/components/clientes/ViewClienteModal";
import DeleteUsuarioModal from "@/components/clientes/DeleteUsuarioModal";
import AssignPropertyWizard from "@/components/clientes/AssignPropertyWizard";
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

  // Pagination states
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal Wizard State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for Revoke Modal (CU006)
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");


  // Revoke / Resolve Contract States (CU006)
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [clientToRevoke, setClientToRevoke] = useState<ClienteRow | null>(null);
  const [revokeReason, setRevokeReason] = useState("Desistimiento");
  async function reloadClients(showSpinner = true, p = page, s = size, q = search) {
    if (showSpinner) setListLoading(true);
    setListError(null);
    try {
      const allUsers = await fetchUsuarios();
      const filtered = q ? allUsers.filter(u => 
        u.nombre.toLowerCase().includes(q.toLowerCase()) || 
        (u.apellidos && u.apellidos.toLowerCase().includes(q.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(q.toLowerCase()))
      ) : allUsers;
      
      const start = p * s;
      const paginated = filtered.slice(start, start + s);

      setClients(paginated.map(mapUsuarioToClienteRow));
      setTotalPages(Math.ceil(filtered.length / s) || 1);
      setTotalElements(filtered.length);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios.");
    } finally {
      if (showSpinner) setListLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void reloadClients(true, page, size, search);
    });
  }, [page, size, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  function openWizard() {
    setIsModalOpen(true);
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

      {/* Toolbar */}
      <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-1/3">
          <input
            type="text"
            placeholder="Buscar por nombre, correo, dni..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-build-main"
          />
          <button type="submit" className="px-4 py-2 bg-slate-100 text-build-main rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">
            Buscar
          </button>
        </form>
        <div className="text-sm text-slate-500">
          Mostrando {clients.length} de {totalElements} registros
        </div>
      </div>

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
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || listLoading}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-build-main hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm font-medium text-slate-500">
            Página {page + 1} de {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || listLoading}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-build-main hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Assignment Wizard Modal */}
      {/* Assignment Wizard Modal */}
      {isModalOpen && (
        <AssignPropertyWizard
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            void reloadClients(false);
          }}
        />
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
